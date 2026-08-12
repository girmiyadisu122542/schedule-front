import { ref, reactive, computed, watch, type ComputedRef, type Ref } from 'vue';
import { toast } from 'vue-sonner';
import router from '@/router';
import type { ZodType } from 'zod';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import {
    DEFAULT_PAGE_LIMIT,
    FIRST_PAGE,
    STATUS_INFO,
    STATUS_DANGER,
    STATUS_ACTIVATE,
    STATUS_DEACTIVATE
} from '@/config/appConfig';
import { extractFieldErrors, readApiErrorMessage, toFormErrors, type MutationResult } from '@/utils/apiError';
import type { FetchParams, ConfirmState, Pagination } from '@/types/CommonTypes';
import type { AllowedAction } from '@/constants/allowedActions';
import type { ActionOption } from '@/components/common/ActionMenu.vue';

import EyeIcon from '@/assets/icons/EyeIcon.vue';
import EditIcon from '@/assets/icons/EditIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import ActiveToggleIcon from '@/assets/icons/ActiveToggleIcon.vue';
import InactiveToggleIcon from '@/assets/icons/InactiveToggleIcon.vue';

/**
 * The minimum every master-data row carries. `is_active` is optional because a
 * few tables deliberately have no lifecycle flag — `academic_years` is a period,
 * not a record you retire (Final Schema.md §6). Those slices set `hasState: false`.
 *
 * `uuid` is optional for the same kind of reason: `invigilator_availabilities`
 * has no uuid column (Final Schema.md §17) because nothing routes to a single
 * window. The factory itself only ever reads `id`.
 */
export interface CrudItem {
    id: number;
    uuid?: string;
    /** Nullable because a few rows are identified by `code` instead — see `rowLabel`. */
    name: string | null;
    is_active?: boolean;
}

export interface PaginatedResult<TItem> {
    data: TItem[];
    pagination: Pagination | null;
}

/**
 * The five service functions a master-data slice needs. Each entity's
 * `xService.ts` supplies them; the factory never talks to axios itself.
 */
export interface CrudService<TItem, TPayload> {
    fetchList: (params: Record<string, unknown>) => Promise<PaginatedResult<TItem>>;
    create: (payload: TPayload) => Promise<MutationResult<TItem>>;
    update: (id: number, payload: TPayload) => Promise<MutationResult<TItem>>;
    remove: (id: number) => Promise<MutationResult<TItem | null>>;
    /** Omitted by slices that set `hasState: false`. */
    changeState?: (id: number, isActive: boolean) => Promise<MutationResult<TItem>>;
}

export interface CrudColumn {
    key: string;
    label: string;
}

export interface CrudFilter {
    key: string;
    label: string;
    options: { label: string; value: unknown }[];
}

export interface CrudConfig<TItem extends CrudItem, TForm extends object, TPayload> {
    /**
     * PascalCase entity name. Permission actions are derived from it —
     * `'Campus'` → `seeCampus` / `createCampus` / `updateCampus` /
     * `deleteCampus` / `changeCampusState` — so it must match the backend
     * `PermissionList.php` keys exactly.
     */
    entity: string;
    /** Translation key + fallback for the singular label shown in dialogs. */
    labelKey: string;
    labelFallback: string;
    service: CrudService<TItem, TPayload>;
    /** A blank form for the create dialog. */
    emptyForm: () => TForm;
    /** Map a fetched row back onto the form for the edit dialog. */
    toForm: (item: TItem) => TForm;
    /** Reactive Zod factory; its output type is the request payload. */
    schema: () => ComputedRef<ZodType<TPayload, TForm>>;
    columns: ComputedRef<CrudColumn[]>;
    filters?: ComputedRef<CrudFilter[]>;
    /**
     * False for tables with no `is_active` column — drops the state-toggle row
     * action and the default Active/Inactive filter. Defaults to true.
     */
    hasState?: boolean;
    /**
     * How a row names itself in confirm dialogs. Defaults to `name`; rooms
     * override it because an unnamed room is identified by its code ("NB-301").
     */
    rowLabel?: (item: TItem) => string;
    /**
     * Extra guards run before delete. Returning a string shows it as an error
     * toast and aborts — for rules the UI can decide without a round trip.
     */
    beforeDelete?: (item: TItem) => string | null;
    /**
     * Where a row's detail page lives. Supplying it adds a "View details" row
     * action, gated on the same `see:` permission as the list itself. Routes by
     * uuid — numeric ids never appear in URLs.
     */
    detailPath?: (item: TItem) => string;
}

/**
 * The shared CRUD engine behind every list screen: paginated fetch,
 * search + filters, create/edit dialog with Zod and server-error mapping, the
 * state toggle, delete, and the per-row action menu.
 *
 * Each entity composable wraps this in `createSharedComposable` so the whole app
 * sees one instance — see `masterData/composables/useCampus.ts` for the canonical
 * two-dozen-line slice. Lives in `src/composables/` because more than one module
 * uses it; modules must never import from each other.
 */
export function useCrudResource<TItem extends CrudItem, TForm extends object, TPayload>(
    config: CrudConfig<TItem, TForm, TPayload>
) {
    const languageStore = useLanguageStore();
    const { customizeLanguageData } = languageStore;
    const allowedRoutesStore = useAllowedRoutesStore();

    /** `'Campus'` + `'update'` → the `updateCampus` allowed-action string. */
    const action = (verb: string) => `${verb}${config.entity}` as AllowedAction;
    const changeStateAction = `change${config.entity}State` as AllowedAction;

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const isLoading = ref(false);
    const searchQuery = ref('');
    const currentPage = ref(FIRST_PAGE);
    const limit = ref(DEFAULT_PAGE_LIMIT);
    const filters = ref<Record<string, unknown>>({});

    // `ref` would infer the deep-unwrapped shape for a generic payload; the cast
    // keeps `items.value` typed as the caller's row type and still unwraps in templates.
    const items = ref<PaginatedResult<TItem>>({ data: [], pagination: null }) as Ref<PaginatedResult<TItem>>;

    const dialogVisible = ref(false);
    const isEditingDialog = ref(false);
    const editingId = ref<number | null>(null);
    const isSavingEdit = ref(false);
    const editErrors = ref<Record<string, string>>({});
    const editForm = reactive(config.emptyForm()) as TForm;

    const confirmState = ref<ConfirmState>({
        show: false,
        loading: false,
        title: '',
        message: '',
        type: STATUS_INFO,
        confirmLabel: '',
        onConfirm: () => {}
    });

    const hasState = config.hasState ?? true;
    const rowLabel = (item: TItem) => config.rowLabel?.(item) ?? item.name ?? '';

    /** Default state filter — offered only to slices that have `is_active`. */
    const defaultFilters = computed<CrudFilter[]>(() =>
        hasState
            ? [
                  {
                      label: customizeLanguageData('state', 'State'),
                      key: 'is_active',
                      options: [
                          { label: customizeLanguageData('active', 'Active'), value: true },
                          { label: customizeLanguageData('inactive', 'Inactive'), value: false }
                      ]
                  }
              ]
            : []
    );

    const filterFields = computed(() => config.filters?.value ?? defaultFilters.value);

    const fetchItems = async (params: FetchParams = {}) => {
        isLoading.value = true;
        try {
            currentPage.value = params.page ?? currentPage.value;
            limit.value = params.perPage ?? limit.value;

            items.value = await config.service.fetchList({
                page: currentPage.value,
                limit: limit.value,
                search: params.search ?? (searchQuery.value || undefined),
                ...filters.value
            });
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * The query the list is CURRENTLY showing, minus paging.
     *
     * Export sends exactly this, so a user who has filtered to one college
     * exports that college rather than all 400 rows. Page and limit are left
     * out deliberately — an export is the whole filtered set, not one page.
     */
    const currentQueryParams = (): Record<string, unknown> => ({
        search: searchQuery.value || undefined,
        ...filters.value
    });

    const handleSearch = (value: string) => {
        searchQuery.value = value;
        fetchItems({ page: FIRST_PAGE });
    };

    const handleFilterChange = (filterValues: Record<string, unknown>) => {
        filters.value = filterValues;
        fetchItems({ page: FIRST_PAGE });
    };

    const openCreateDialog = () => {
        isEditingDialog.value = false;
        editingId.value = null;
        editErrors.value = {};
        Object.assign(editForm, config.emptyForm());
        dialogVisible.value = true;
    };

    const openEditDialog = (item: TItem) => {
        isEditingDialog.value = true;
        editingId.value = item.id;
        editErrors.value = {};
        Object.assign(editForm, config.toForm(item));
        dialogVisible.value = true;
    };

    const saveForm = async () => {
        editErrors.value = {};
        const result = config.schema().value.safeParse({ ...editForm });

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                editErrors.value[issue.path[0] as string] = issue.message;
            });
            return;
        }

        isSavingEdit.value = true;
        try {
            const saved =
                isEditingDialog.value && editingId.value
                    ? await config.service.update(editingId.value, result.data)
                    : await config.service.create(result.data);

            // The backend's message names the record and is already localized.
            toast.success(saved.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));

            dialogVisible.value = false;
            await fetchItems();
        } catch (error: unknown) {
            // Field-level 422s land on the form; everything else becomes a toast.
            const fieldErrors = extractFieldErrors(error);
            if (fieldErrors) {
                editErrors.value = { ...editErrors.value, ...toFormErrors(fieldErrors) };
            } else {
                toast.error(genericError(error));
            }
        } finally {
            isSavingEdit.value = false;
        }
    };

    const openConfirmDialog = (options: {
        title: string;
        message: string;
        confirmLabel: string;
        type: ConfirmState['type'];
        itemName?: string;
        statusTransition?: { from: string; to: string };
        run: () => Promise<void>;
    }) => {
        confirmState.value = {
            show: true,
            loading: false,
            title: options.title,
            message: options.message,
            type: options.type,
            confirmLabel: options.confirmLabel,
            itemLabel: customizeLanguageData(config.labelKey, config.labelFallback),
            itemName: options.itemName,
            statusTransition: options.statusTransition,
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    await options.run();
                } finally {
                    confirmState.value.loading = false;
                    confirmState.value.show = false;
                }
            }
        };
    };

    const confirmChangeState = (item: TItem) => {
        const willActivate = !item.is_active;
        openConfirmDialog({
            title: willActivate
                ? customizeLanguageData('confirmActivation', 'Confirm activation ?')
                : customizeLanguageData('confirmDeactivation', 'Confirm deactivation ?'),
            message: willActivate
                ? `"${rowLabel(item)}" ${customizeLanguageData('willBeShownInActiveSections', 'will be shown in active sections. You can re-deactivate it anytime.')}`
                : `"${rowLabel(item)}" ${customizeLanguageData('willBeHiddenFromActiveSections', 'will be hidden from active sections. You can re-activate it anytime.')}`,
            confirmLabel: willActivate
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            type: willActivate ? STATUS_ACTIVATE : STATUS_DEACTIVATE,
            itemName: rowLabel(item),
            statusTransition: {
                from: willActivate
                    ? customizeLanguageData('inactive', 'Inactive')
                    : customizeLanguageData('active', 'Active'),
                to: willActivate
                    ? customizeLanguageData('active', 'Active')
                    : customizeLanguageData('inactive', 'Inactive')
            },
            run: async () => {
                try {
                    if (!config.service.changeState) return;

                    const changed = await config.service.changeState(item.id, willActivate);
                    toast.success(changed.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
                    await fetchItems();
                } catch (error: unknown) {
                    toast.error(genericError(error));
                }
            }
        });
    };

    const confirmDelete = (item: TItem) => {
        const blocked = config.beforeDelete?.(item);
        if (blocked) {
            toast.error(blocked);
            return;
        }

        openConfirmDialog({
            title: customizeLanguageData('delete', 'Delete'),
            message: customizeLanguageData('confirmDeleteRecord', 'Are you sure you want to delete this record?'),
            confirmLabel: customizeLanguageData('delete', 'Delete'),
            type: STATUS_DANGER,
            itemName: rowLabel(item),
            run: async () => {
                try {
                    const removed = await config.service.remove(item.id);
                    toast.success(
                        removed.message ?? customizeLanguageData('deletedSuccessfully', 'Deleted successfully')
                    );
                    await fetchItems();
                } catch (error: unknown) {
                    // Business-rule 422s ("still has buildings") arrive here —
                    // never swallow them.
                    toast.error(genericError(error));
                }
            }
        });
    };

    /**
     * The "View details" row action, or null when the slice has no detail page
     * or the user may not read the record.
     *
     * Exposed separately because a slice whose write actions depend on status
     * (class and exam schedules) still wants the detail link on EVERY row —
     * reading a published meeting is not an edit.
     */
    const getDetailOption = (item: TItem): ActionOption | null => {
        if (!config.detailPath || !allowedRoutesStore.can(action('see'))) return null;

        return {
            label: customizeLanguageData('viewDetails', 'View details'),
            icon: EyeIcon,
            onClick: () => router.push(config.detailPath!(item))
        };
    };

    /**
     * @param item the row
     * @param includeDetail false when the caller places the detail link itself
     */
    const getActionOptions = (item: TItem, includeDetail = true): ActionOption[] => {
        const options: ActionOption[] = [];

        const detail = includeDetail ? getDetailOption(item) : null;
        if (detail) {
            options.push(detail);
        }

        if (allowedRoutesStore.can(action('update'))) {
            options.push({
                label: customizeLanguageData('edit', 'Edit'),
                icon: EditIcon,
                onClick: () => openEditDialog(item)
            });
        }

        if (hasState && allowedRoutesStore.can(changeStateAction)) {
            options.push({
                label: item.is_active
                    ? customizeLanguageData('deactivate', 'Deactivate')
                    : customizeLanguageData('activate', 'Activate'),
                icon: item.is_active ? InactiveToggleIcon : ActiveToggleIcon,
                onClick: () => confirmChangeState(item)
            });
        }

        if (allowedRoutesStore.can(action('delete'))) {
            options.push({
                label: customizeLanguageData('delete', 'Delete'),
                icon: TrashIcon,
                variant: STATUS_DANGER,
                onClick: () => confirmDelete(item)
            });
        }

        return options;
    };

    watch(
        () => languageStore.currentLanguage,
        async () => {
            await fetchItems();
        }
    );

    return {
        isLoading,
        items,
        tableColumns: config.columns,
        filterFields,
        confirmState,
        searchQuery,
        currentPage,
        limit,
        dialogVisible,
        isEditingDialog,
        editingId,
        editForm,
        editErrors,
        isSavingEdit,

        currentQueryParams,

        fetchItems,
        handleSearch,
        handleFilterChange,
        openCreateDialog,
        openEditDialog,
        saveForm,
        getActionOptions,
        getDetailOption,
        // Exposed so a slice can put its own semantic action behind the same
        // confirm dialog the factory uses — scheduling's Cancel meeting does.
        openConfirmDialog
    };
}
