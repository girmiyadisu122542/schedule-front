import { ref, reactive, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { collegeSchema } from '@/modules/masterData/schemas/collegeSchema';
import type { College, CollegeForm, PaginatedColleges } from '@/modules/masterData/types/college';
import {
    ACTIVE_STATUS,
    INACTIVE_STATUS,
    BULK_ACTION,
    type BulkAction,
    STATUS_INFO,
    STATUS_DANGER,
    STATUS_ACTIVATE,
    STATUS_DEACTIVATE
} from '@/config/appConfig';
import type { FetchParams, ConfirmState } from '@/types/CommonTypes';

import EyeIcon from '@/assets/icons/EyeIcon.vue';
import EditIcon from '@/assets/icons/EditIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import ActiveToggleIcon from '@/assets/icons/ActiveToggleIcon.vue';
import InactiveToggleIcon from '@/assets/icons/InactiveToggleIcon.vue';

/** Backend resource base — not implemented yet; endpoints assumed to follow the role/user convention. */
const BASE = '/college';

const emptyForm = (): CollegeForm => ({
    name: '',
    code: '',
    description: '',
    dean_name: '',
    email: '',
    phone: '',
    established_year: '',
    state: ACTIVE_STATUS
});

function collegeManager() {
    const languageStore = useLanguageStore();
    const { customizeLanguageData } = languageStore;
    const allowedRoutesStore = useAllowedRoutesStore();

    const isLoading = ref(false);
    const searchQuery = ref('');
    const currentPage = ref(1);
    const limit = ref(10);
    const filters = ref<Record<string, any>>({});

    const colleges = ref<PaginatedColleges>({ data: [], pagination: null });

    const confirmState = ref<ConfirmState>({
        show: false,
        loading: false,
        title: '',
        message: '',
        type: STATUS_INFO,
        confirmLabel: '',
        onConfirm: () => {}
    });

    const stats = ref({
        total: 0,
        active: 0,
        inactive: 0,
        departments: 0
    });

    const fetchStats = async () => {
        try {
            const res = await axiosInstance.get(`${BASE}/stats`);
            stats.value = { ...stats.value, ...(res.data.data ?? {}) };
        } catch {}
    };

    const tableColumns = computed(() => [
        { key: 'name', label: customizeLanguageData('collegeName', 'College Name') },
        { key: 'code', label: customizeLanguageData('code', 'Code') },
        { key: 'dean_name', label: customizeLanguageData('dean', 'Dean') },
        { key: 'departments_count', label: customizeLanguageData('departments', 'Departments') },
        { key: 'state', label: customizeLanguageData('state', 'State') }
    ]);

    const filterFields = computed(() => [
        {
            label: customizeLanguageData('state', 'State'),
            key: 'state',
            options: [
                { label: customizeLanguageData('active', 'Active'), value: ACTIVE_STATUS },
                { label: customizeLanguageData('inactive', 'Inactive'), value: INACTIVE_STATUS }
            ]
        }
    ]);

    const dialogVisible = ref(false);
    const isEditingDialog = ref(false);
    const editingCollegeId = ref<number | null>(null);
    const isSavingEdit = ref(false);
    const editErrors = ref<Record<string, string>>({});
    const editForm = reactive<CollegeForm>(emptyForm());

    const viewDialogVisible = ref(false);
    const viewingCollege = ref<College | null>(null);

    const fetchColleges = async (params: FetchParams = {}) => {
        isLoading.value = true;
        try {
            const response = await axiosInstance.get(`${BASE}/`, {
                params: {
                    page: params.page ?? currentPage.value,
                    limit: params.perPage ?? limit.value,
                    search: params.search ?? (searchQuery.value || undefined),
                    ...filters.value
                }
            });
            colleges.value = {
                data: response.data.data ?? [],
                pagination: response.data.pagination ?? null
            };
        } catch {
            toast.error(customizeLanguageData('somethingWentWrong', 'Something went wrong'));
        } finally {
            isLoading.value = false;
        }
    };

    const reloadColleges = async (params: FetchParams = {}) => {
        await fetchColleges(params);
        fetchStats();
    };

    const handleSearch = (value: string) => {
        searchQuery.value = value;
        fetchColleges({ page: 1 });
    };

    const handleFilterChange = (filterValues: Record<string, any>) => {
        filters.value = filterValues;
        fetchColleges({ page: 1 });
    };

    const openCreateDialog = () => {
        isEditingDialog.value = false;
        editingCollegeId.value = null;
        editErrors.value = {};
        Object.assign(editForm, emptyForm());
        dialogVisible.value = true;
    };

    const openEditDialog = (item: College) => {
        isEditingDialog.value = true;
        editingCollegeId.value = item.id;
        editErrors.value = {};
        Object.assign(editForm, {
            name: item.name,
            code: item.code,
            description: item.description ?? '',
            dean_name: item.dean_name ?? '',
            email: item.email ?? '',
            phone: item.phone ?? '',
            established_year: item.established_year != null ? String(item.established_year) : '',
            state: item.state
        });
        dialogVisible.value = true;
    };

    const openViewDialog = (item: College) => {
        viewingCollege.value = item;
        viewDialogVisible.value = true;
    };

    const saveCollegeForm = async () => {
        editErrors.value = {};
        const schema = collegeSchema().value;
        const result = schema.safeParse({
            name: editForm.name,
            code: editForm.code,
            description: editForm.description,
            dean_name: editForm.dean_name,
            email: editForm.email,
            phone: editForm.phone,
            established_year: editForm.established_year
        });

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                editErrors.value[issue.path[0] as string] = issue.message;
            });
            return;
        }

        isSavingEdit.value = true;
        try {
            const body = { ...result.data };

            if (isEditingDialog.value && editingCollegeId.value) {
                await axiosInstance.post(`${BASE}/update/${editingCollegeId.value}`, body);

                const original = colleges.value.data.find((college) => college.id === editingCollegeId.value);
                if (original && original.state !== editForm.state) {
                    await axiosInstance.get(`${BASE}/change-state/${editingCollegeId.value}`, {
                        params: { state: editForm.state }
                    });
                }

                toast.success(customizeLanguageData('collegeSuccessfullyUpdated', 'College updated'));
            } else {
                await axiosInstance.post(`${BASE}/create`, body);
                toast.success(customizeLanguageData('collegeSuccessfullyCreated', 'College created'));
            }

            dialogVisible.value = false;
            reloadColleges();
        } catch (error: any) {
            const errors = error?.response?.data?.errors;
            if (errors) {
                Object.entries(errors).forEach(([k, v]) => {
                    editErrors.value[k] = Array.isArray(v) ? v[0] : (v as string);
                });
            } else {
                toast.error(
                    error?.response?.data?.message ??
                        customizeLanguageData('somethingWentWrong', 'Something went wrong')
                );
            }
        } finally {
            isSavingEdit.value = false;
        }
    };

    const openConfirmDialog = (opts: {
        title: string;
        message: string;
        confirmLabel: string;
        type: ConfirmState['type'];
        itemNames?: string[];
        itemName?: string;
        statusTransition?: { from: string; to: string };
        run: () => Promise<void> | void;
    }) => {
        confirmState.value = {
            show: true,
            loading: false,
            title: opts.title,
            message: opts.message,
            type: opts.type,
            confirmLabel: opts.confirmLabel,
            itemLabel: customizeLanguageData('college', 'College'),
            itemNames: opts.itemNames,
            itemName: opts.itemName,
            statusTransition: opts.statusTransition,
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    await opts.run();
                } finally {
                    confirmState.value.loading = false;
                    confirmState.value.show = false;
                }
            }
        };
    };

    const changeCollegeState = async (item: College) => {
        const newState = Number(item.state) === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;
        try {
            await axiosInstance.get(`${BASE}/change-state/${item.id}`, { params: { state: newState } });
            toast.success(
                newState === ACTIVE_STATUS
                    ? customizeLanguageData('collegeSuccessfullyActivated', 'College activated')
                    : customizeLanguageData('collegeSuccessfullyDeactivated', 'College deactivated')
            );
            reloadColleges();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || customizeLanguageData('somethingWentWrong', 'Something went wrong')
            );
        }
    };

    const confirmChangeCollegeState = (item: College) => {
        const willActivate = Number(item.state) !== ACTIVE_STATUS;
        openConfirmDialog({
            title: willActivate
                ? customizeLanguageData('confirmActivation', 'Confirm activation ?')
                : customizeLanguageData('confirmDeactivation', 'Confirm deactivation ?'),
            message: willActivate
                ? `"${item.name}" ${customizeLanguageData('willBeShownInActiveSections', 'will be shown in active sections. You can re-deactivate it anytime.')}`
                : `"${item.name}" ${customizeLanguageData('willBeHiddenFromActiveSections', 'will be hidden from active sections. You can re-activate it anytime.')}`,
            confirmLabel: willActivate
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            type: willActivate ? STATUS_ACTIVATE : STATUS_DEACTIVATE,
            itemName: item.name,
            statusTransition: {
                from: willActivate
                    ? customizeLanguageData('inactive', 'Inactive')
                    : customizeLanguageData('active', 'Active'),
                to: willActivate
                    ? customizeLanguageData('active', 'Active')
                    : customizeLanguageData('inactive', 'Inactive')
            },
            run: () => changeCollegeState(item)
        });
    };

    const confirmDeleteCollege = (item: College) => {
        openConfirmDialog({
            title: customizeLanguageData('delete', 'Delete'),
            message: customizeLanguageData('confirmDeleteCollege', 'Are you sure you want to delete this college?'),
            confirmLabel: customizeLanguageData('delete', 'Delete'),
            type: STATUS_DANGER,
            itemNames: [item.name],
            run: async () => {
                try {
                    await axiosInstance.delete(`${BASE}/delete/${item.id}`);
                    toast.success(customizeLanguageData('collegeSuccessfullyDeleted', 'College deleted'));
                    reloadColleges();
                } catch (error: any) {
                    toast.error(
                        error?.response?.data?.message ||
                            customizeLanguageData('somethingWentWrong', 'Something went wrong')
                    );
                }
            }
        });
    };

    const getActionOptions = (item: College) => {
        const options: any[] = [
            {
                label: customizeLanguageData('view', 'View'),
                icon: EyeIcon,
                onClick: () => openViewDialog(item)
            }
        ];

        if (allowedRoutesStore.can('updateCollege')) {
            options.push({
                label: customizeLanguageData('edit', 'Edit'),
                icon: EditIcon,
                onClick: () => openEditDialog(item)
            });
        }

        if (allowedRoutesStore.can('changeCollegeStatus')) {
            options.push({
                label:
                    Number(item.state) === ACTIVE_STATUS
                        ? customizeLanguageData('deactivate', 'Deactivate')
                        : customizeLanguageData('activate', 'Activate'),
                icon: Number(item.state) === ACTIVE_STATUS ? InactiveToggleIcon : ActiveToggleIcon,
                onClick: () => confirmChangeCollegeState(item)
            });
        }

        if (allowedRoutesStore.can('deleteCollege')) {
            options.push({
                label: customizeLanguageData('delete', 'Delete'),
                icon: TrashIcon,
                variant: STATUS_DANGER,
                onClick: () => confirmDeleteCollege(item)
            });
        }

        return options;
    };

    const selectedColleges = ref<College[]>([]);

    const openBulkConfirm = (
        rows: College[],
        opts: {
            title: string;
            message: string;
            confirmLabel: string;
            type: ConfirmState['type'];
            run: () => Promise<void>;
        }
    ) => {
        if (!rows.length) return;
        confirmState.value = {
            show: true,
            loading: false,
            title: opts.title,
            message: opts.message,
            type: opts.type,
            confirmLabel: opts.confirmLabel,
            itemLabel: customizeLanguageData('college', 'College'),
            itemNames: rows.map((college) => college.name),
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    await opts.run();
                } finally {
                    confirmState.value.loading = false;
                    confirmState.value.show = false;
                    selectedColleges.value = [];
                }
            }
        };
    };

    const bulkChangeState = (rows: College[], actionType: BulkAction, onSuccess?: () => void) => {
        const isActivate = actionType === BULK_ACTION.ACTIVATE;
        openBulkConfirm(rows, {
            title: isActivate
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            message: `${isActivate ? customizeLanguageData('confirmActivate', 'Activate') : customizeLanguageData('confirmDeactivate', 'Deactivate')} ${rows.length} ${customizeLanguageData('colleges', 'colleges')}?`,
            confirmLabel: isActivate
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            type: isActivate ? STATUS_INFO : STATUS_DANGER,
            run: async () => {
                try {
                    await axiosInstance.post(`${BASE}/bulk-action`, {
                        college_ids: rows.map((college) => college.id),
                        action_type: actionType
                    });
                    toast.success(customizeLanguageData('collegesUpdatedSuccessfully', 'Colleges updated successfully'));
                    onSuccess?.();
                } catch (error: any) {
                    toast.error(
                        error?.response?.data?.message ||
                            customizeLanguageData('somethingWentWrong', 'Something went wrong')
                    );
                }
            }
        });
    };

    const bulkDelete = (rows: College[], onSuccess?: () => void) => {
        openBulkConfirm(rows, {
            title: customizeLanguageData('delete', 'Delete'),
            message: `${customizeLanguageData('confirmDelete', 'Are you sure you want to delete')} ${rows.length} ${customizeLanguageData('colleges', 'colleges')}?`,
            confirmLabel: customizeLanguageData('delete', 'Delete'),
            type: STATUS_DANGER,
            run: async () => {
                const results = await Promise.allSettled(
                    rows.map((college) => axiosInstance.delete(`${BASE}/delete/${college.id}`))
                );
                const failed = results.filter((result) => result.status === 'rejected').length;
                if (failed === 0) {
                    toast.success(customizeLanguageData('collegeSuccessfullyDeleted', 'Colleges deleted'));
                } else if (failed < rows.length) {
                    toast.warning(
                        `${rows.length - failed} ${customizeLanguageData('succeeded', 'succeeded')}, ${failed} ${customizeLanguageData('failed', 'failed')}`
                    );
                } else {
                    toast.error(customizeLanguageData('somethingWentWrong', 'Something went wrong'));
                }
                onSuccess?.();
            }
        });
    };

    const getBulkActions = (items: College[], onSuccess?: () => void) => {
        const actions: any[] = [];
        const hasActive = items.some((college) => Number(college.state) === ACTIVE_STATUS);
        const hasInactive = items.some((college) => Number(college.state) !== ACTIVE_STATUS);

        if (hasInactive && allowedRoutesStore.can('changeCollegeStatus')) {
            actions.push({
                label: customizeLanguageData('activate', 'Activate'),
                icon: ActiveToggleIcon,
                onClick: (rows: College[]) => bulkChangeState(rows, BULK_ACTION.ACTIVATE, onSuccess)
            });
        }

        if (hasActive && allowedRoutesStore.can('changeCollegeStatus')) {
            actions.push({
                label: customizeLanguageData('deactivate', 'Deactivate'),
                icon: InactiveToggleIcon,
                onClick: (rows: College[]) => bulkChangeState(rows, BULK_ACTION.DEACTIVATE, onSuccess)
            });
        }

        if (allowedRoutesStore.can('deleteCollege')) {
            actions.push({
                label: customizeLanguageData('delete', 'Delete'),
                icon: TrashIcon,
                variant: STATUS_DANGER,
                onClick: (rows: College[]) => bulkDelete(rows, onSuccess)
            });
        }

        return actions;
    };

    watch(
        () => languageStore.currentLanguage,
        async () => {
            await fetchColleges();
        }
    );

    return {
        isLoading,
        colleges,
        stats,
        tableColumns,
        filterFields,
        confirmState,
        searchQuery,
        currentPage,
        limit,
        filters,
        dialogVisible,
        isEditingDialog,
        editingCollegeId,
        editForm,
        editErrors,
        isSavingEdit,
        viewDialogVisible,
        viewingCollege,
        selectedColleges,
        getBulkActions,

        fetchColleges,
        reloadColleges,
        fetchStats,
        handleSearch,
        handleFilterChange,
        openCreateDialog,
        openEditDialog,
        openViewDialog,
        saveCollegeForm,
        getActionOptions
    };
}

export const useCollege = createSharedComposable(collegeManager);
