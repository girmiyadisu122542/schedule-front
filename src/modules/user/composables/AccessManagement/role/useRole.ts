import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import { roleSchema } from '@/modules/user/schemas/AccessManagement/role/roleSchema';
import type { Role, RoleForm, PaginatedRoles } from '@/modules/user/types/AccessManagement/role';
import {
    ACTIVE_STATUS,
    INACTIVE_STATUS,
    BULK_ACTION,
    type BulkAction,
    STATUS_INFO,
    STATUS_DANGER,
    STATUS_ACTIVATE,
    STATUS_DEACTIVATE,
    TRUE,
    FALSE
} from '@/config/appConfig';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import type { FetchParams, ConfirmState } from '@/types/CommonTypes';

import EyeIcon from '@/assets/icons/EyeIcon.vue';
import EditIcon from '@/assets/icons/EditIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import ShieldProtectedCheckmark from '@/assets/icons/ShieldProtectedCheckmark.vue';
import ChangeStatusIcon from '@/assets/icons/ChangeStatusIcon.vue';
import ActiveToggleIcon from '@/assets/icons/ActiveToggleIcon.vue';
import InactiveToggleIcon from '@/assets/icons/InactiveToggleIcon.vue';

function roleManager() {
    const languageStore = useLanguageStore();
    const { customizeLanguageData } = languageStore;
    const router = useRouter();
    const allowedRoutesStore = useAllowedRoutesStore();

    const isLoading = ref(false);
    const searchQuery = ref('');
    const currentPage = ref(1);
    const limit = ref(10);
    const filters = ref<Record<string, any>>({});

    const roles = ref<PaginatedRoles>({ data: [], pagination: null });

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
        system: 0,
        custom: 0,
        unassigned: 0,
        assigned_users: 0
    });

    const fetchStats = async () => {
        try {
            const res = await axiosInstance.get('/role/stats');
            stats.value = { ...stats.value, ...(res.data.data ?? {}) };
        } catch {}
    };

    const tableColumns = computed(() => [
        { key: 'name', label: customizeLanguageData('roleName', 'Role Name') },
        { key: 'description', label: customizeLanguageData('description', 'Description') },
        { key: 'permissions_count', label: customizeLanguageData('permission', 'Permissions') },
        { key: 'users_count', label: customizeLanguageData('assignedUsers', 'Assigned Users') },
        { key: 'state', label: customizeLanguageData('state', 'State') }
    ]);

    const dialogVisible = ref(false);
    const isEditingDialog = ref(false);
    const editingRoleId = ref<number | null>(null);
    const isSavingEdit = ref(false);
    const editErrors = ref<Record<string, string>>({});

    const editForm = reactive<RoleForm>({
        name: '',
        is_system: false,
        unique_per_user: false,
        state: ACTIVE_STATUS,
        description: ''
    });

    const viewDialogVisible = ref(false);
    const viewingRole = ref<Role | null>(null);

    const confirmDeleteVisible = ref(false);
    const deletingRoleId = ref<number | null>(null);
    const isDeletingRole = ref(false);

    const fetchRoles = async (params: FetchParams = {}) => {
        isLoading.value = true;
        try {
            const response = await axiosInstance.get('/role/', {
                params: {
                    page: params.page ?? currentPage.value,
                    limit: params.perPage ?? limit.value,
                    search: params.search ?? (searchQuery.value || undefined),
                    ...filters.value
                }
            });
            roles.value = {
                data: response.data.data ?? [],
                pagination: response.data.pagination ?? null
            };
        } catch {
            toast.error(customizeLanguageData('somethingWentWrong', 'Something went wrong'));
        } finally {
            isLoading.value = false;
        }
    };

    const reloadRoles = async (params: FetchParams = {}) => {
        await fetchRoles(params);
        fetchStats();
    };

    const handleSearch = (value: string) => {
        searchQuery.value = value;
        fetchRoles({ page: 1 });
    };

    const handleFilterChange = (filterValues: Record<string, any>) => {
        filters.value = filterValues;
        fetchRoles({ page: 1 });
    };

    const filterFields = computed(() => {
        const fields: any[] = [];

        fields.push({
            label: customizeLanguageData('state', 'State'),
            key: 'state',
            options: [
                { label: customizeLanguageData('active', 'Active'), value: ACTIVE_STATUS },
                { label: customizeLanguageData('inactive', 'Inactive'), value: INACTIVE_STATUS }
            ]
        });

        fields.push({
            label: customizeLanguageData('roleType', 'Role Type'),
            key: 'is_system',
            options: [
                { label: customizeLanguageData('system', 'System'), value: 'true' },
                { label: customizeLanguageData('custom', 'Custom'), value: 'false' }
            ]
        });

        fields.push({
            label: customizeLanguageData('uniquePerUser', 'Unique Per User'),
            key: 'unique_per_user',
            options: [
                { label: customizeLanguageData('yes', 'Yes'), value: 'true' },
                { label: customizeLanguageData('no', 'No'), value: 'false' }
            ]
        });

        return fields;
    });

    const openCreateDialog = () => {
        isEditingDialog.value = false;
        editingRoleId.value = null;
        editErrors.value = {};
        Object.assign(editForm, {
            name: '',
            is_system: false,
            unique_per_user: false,
            state: ACTIVE_STATUS,
            description: ''
        });
        dialogVisible.value = true;
    };

    const openEditDialog = (item: Role) => {
        isEditingDialog.value = true;
        editingRoleId.value = item.id;
        editErrors.value = {};
        Object.assign(editForm, {
            name: item.name,
            is_system: item.is_system,
            unique_per_user: item.unique_per_user,
            state: item.state,
            description: item.description ?? ''
        });
        dialogVisible.value = true;
    };

    const openViewDialog = (item: Role) => {
        viewingRole.value = item;
        viewDialogVisible.value = true;
    };

    const openDeleteConfirm = (id: number) => {
        deletingRoleId.value = id;
        confirmDeleteVisible.value = true;
    };

    const saveRoleForm = async () => {
        editErrors.value = {};
        const schema = roleSchema().value;
        const payload = {
            name: editForm.name,
            description: editForm.description,
            is_system: editForm.is_system,
            unique_per_user: editForm.unique_per_user
        };
        const result = schema.safeParse(payload);

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                editErrors.value[issue.path[0] as string] = issue.message;
            });
            return;
        }

        isSavingEdit.value = true;
        try {
            const body = { ...result.data };

            if (isEditingDialog.value && editingRoleId.value) {
                await axiosInstance.post(`/role/update/${editingRoleId.value}`, body);

                const original = roles.value.data.find((role) => role.id === editingRoleId.value);
                if (original && original.state !== editForm.state) {
                    await axiosInstance.get(`/role/change-state/${editingRoleId.value}`, {
                        params: { state: editForm.state }
                    });
                }

                toast.success(customizeLanguageData('roleSuccessfullyUpdated', 'Role updated'));
            } else {
                await axiosInstance.post('/role/create', body);
                toast.success(customizeLanguageData('roleSuccessfullyCreated', 'Role created'));
            }

            dialogVisible.value = false;
            reloadRoles();
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

    const confirmDelete = async () => {
        if (!deletingRoleId.value) return;
        isDeletingRole.value = true;
        try {
            await axiosInstance.delete(`/role/delete/${deletingRoleId.value}`);
            toast.success(customizeLanguageData('roleSuccessfullyDeleted', 'Role deleted'));
            confirmDeleteVisible.value = false;
            reloadRoles();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || customizeLanguageData('somethingWentWrong', 'Something went wrong')
            );
        } finally {
            isDeletingRole.value = false;
            deletingRoleId.value = null;
        }
    };

    const changeRoleState = async (item: Role) => {
        const newState = Number(item.state) === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;
        try {
            await axiosInstance.get(`/role/change-state/${item.id}`, { params: { state: newState } });
            const message =
                newState === ACTIVE_STATUS
                    ? customizeLanguageData('roleSuccessfullyActivated', 'Role activated')
                    : customizeLanguageData('roleSuccessfullyDeactivated', 'Role deactivated');
            toast.success(message);
            reloadRoles();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || customizeLanguageData('somethingWentWrong', 'Something went wrong')
            );
        }
    };

    const changeRoleType = async (item: Role) => {
        const nextIsSystem = !item.is_system;
        try {
            await axiosInstance.get(`/role/change-type/${item.id}`, {
                params: { is_system: nextIsSystem ? TRUE : FALSE }
            });
            const message = nextIsSystem
                ? customizeLanguageData('roleSuccessfullyChangedToSystem', 'Role changed to system')
                : customizeLanguageData('roleSuccessfullyChangedToNonSystem', 'Role changed to custom');
            toast.success(message);
            reloadRoles();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || customizeLanguageData('somethingWentWrong', 'Something went wrong')
            );
        }
    };

    const confirmChangeRoleType = (item: Role) => {
        const willBeSystem = !item.is_system;
        openConfirmDialog({
            title: willBeSystem
                ? customizeLanguageData('markAsSystem', 'Mark as System')
                : customizeLanguageData('markAsCustom', 'Mark as Custom'),
            message: willBeSystem
                ? customizeLanguageData('confirmMarkRoleAsSystem', 'Are you sure you want to make this a system role?')
                : customizeLanguageData('confirmMarkRoleAsCustom', 'Are you sure you want to make this a custom role?'),
            confirmLabel: customizeLanguageData('confirm', 'Confirm'),
            type: STATUS_INFO,
            itemName: item.name,
            statusTransition: {
                from: item.is_system
                    ? customizeLanguageData('system', 'System')
                    : customizeLanguageData('custom', 'Custom'),
                to: willBeSystem ? customizeLanguageData('system', 'System') : customizeLanguageData('custom', 'Custom')
            },
            run: () => changeRoleType(item)
        });
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
            itemLabel: customizeLanguageData('role', 'Role'),
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

    const confirmChangeRoleState = (item: Role) => {
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
            run: () => changeRoleState(item)
        });
    };

    const confirmDeleteRole = (item: Role) => {
        openConfirmDialog({
            title: customizeLanguageData('delete', 'Delete'),
            message: customizeLanguageData('confirmDeleteRole', 'Are you sure you want to delete this role?'),
            confirmLabel: customizeLanguageData('delete', 'Delete'),
            type: STATUS_DANGER,
            itemNames: [item.name],
            run: async () => {
                try {
                    await axiosInstance.delete(`/role/delete/${item.id}`);
                    toast.success(customizeLanguageData('roleSuccessfullyDeleted', 'Role deleted'));
                    reloadRoles();
                } catch (error: any) {
                    toast.error(
                        error?.response?.data?.message ||
                            customizeLanguageData('somethingWentWrong', 'Something went wrong')
                    );
                }
            }
        });
    };

    const getActionOptions = (item: Role) => {
        const options: any[] = [
            {
                label: customizeLanguageData('view', 'View'),
                icon: EyeIcon,
                onClick: () => openViewDialog(item)
            }
        ];

        if (allowedRoutesStore.can('updateRole')) {
            options.push({
                label: customizeLanguageData('edit', 'Edit'),
                icon: EditIcon,
                onClick: () => openEditDialog(item)
            });
        }

        if (allowedRoutesStore.can('seeRolePermission') || allowedRoutesStore.can('addRolePermission')) {
            options.push({
                label: customizeLanguageData('assignPermission', 'Assign Permission'),
                icon: ShieldProtectedCheckmark,
                onClick: () => router.push({ name: 'rolePermissions', params: { id: item.id } })
            });
        }

        if (allowedRoutesStore.can('changeRoleState')) {
            options.push({
                label:
                    Number(item.state) === ACTIVE_STATUS
                        ? customizeLanguageData('deactivate', 'Deactivate')
                        : customizeLanguageData('activate', 'Activate'),
                icon: Number(item.state) === ACTIVE_STATUS ? InactiveToggleIcon : ActiveToggleIcon,
                onClick: () => confirmChangeRoleState(item)
            });
        }

        if (allowedRoutesStore.can('changeRoleType')) {
            options.push({
                label: item.is_system
                    ? customizeLanguageData('markAsCustom', 'Mark as Custom')
                    : customizeLanguageData('markAsSystem', 'Mark as System'),
                icon: ChangeStatusIcon,
                onClick: () => confirmChangeRoleType(item)
            });
        }

        if (allowedRoutesStore.can('deleteRole')) {
            options.push({
                label: customizeLanguageData('delete', 'Delete'),
                icon: TrashIcon,
                variant: STATUS_DANGER,
                onClick: () => confirmDeleteRole(item)
            });
        }

        return options;
    };

    watch(
        () => languageStore.currentLanguage,
        async () => {
            await fetchRoles();
        }
    );

    const selectedRoles = ref<Role[]>([]);
    const openBulkConfirm = (
        rows: Role[],
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
            itemLabel: customizeLanguageData('role', 'Role'),
            itemNames: rows.map((role) => role.name),
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    await opts.run();
                } finally {
                    confirmState.value.loading = false;
                    confirmState.value.show = false;
                    selectedRoles.value = [];
                }
            }
        };
    };

    const bulkChangeState = (rows: Role[], actionType: BulkAction, onSuccess?: () => void) => {
        const isActivate = actionType === BULK_ACTION.ACTIVATE;
        openBulkConfirm(rows, {
            title: isActivate
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            message: `${isActivate ? customizeLanguageData('confirmActivate', 'Activate') : customizeLanguageData('confirmDeactivate', 'Deactivate')} ${rows.length} ${customizeLanguageData('roles', 'roles')}?`,
            confirmLabel: isActivate
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            type: isActivate ? STATUS_INFO : STATUS_DANGER,
            run: async () => {
                try {
                    const res = await axiosInstance.post('/role/bulk-action', {
                        role_ids: rows.map((role) => role.id),
                        action_type: actionType
                    });
                    toast.success(
                        res.data?.message ||
                            (isActivate
                                ? customizeLanguageData('rolesActivatedSuccessfully', 'Roles activated successfully')
                                : customizeLanguageData(
                                      'rolesDeactivatedSuccessfully',
                                      'Roles deactivated successfully'
                                  ))
                    );
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

    const bulkDelete = (rows: Role[], onSuccess?: () => void) => {
        openBulkConfirm(rows, {
            title: customizeLanguageData('delete', 'Delete'),
            message: `${customizeLanguageData('confirmDelete', 'Are you sure you want to delete')} ${rows.length} ${customizeLanguageData('roles', 'roles')}?`,
            confirmLabel: customizeLanguageData('delete', 'Delete'),
            type: STATUS_DANGER,
            run: async () => {
                const results = await Promise.allSettled(
                    rows.map((role) => axiosInstance.delete(`/role/delete/${role.id}`))
                );
                const failed = results.filter((result) => result.status === 'rejected').length;
                if (failed === 0) {
                    toast.success(customizeLanguageData('roleSuccessfullyDeleted', 'Roles deleted'));
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

    const getBulkActions = (items: Role[], onSuccess?: () => void) => {
        const actions: any[] = [];
        const hasActive = items.some((role) => Number(role.state) === ACTIVE_STATUS);
        const hasInactive = items.some((role) => Number(role.state) !== ACTIVE_STATUS);

        if (hasInactive && allowedRoutesStore.can('changeRoleState')) {
            actions.push({
                label: customizeLanguageData('activate', 'Activate'),
                icon: ActiveToggleIcon,
                onClick: (rows: Role[]) => bulkChangeState(rows, BULK_ACTION.ACTIVATE, onSuccess)
            });
        }

        if (hasActive && allowedRoutesStore.can('changeRoleState')) {
            actions.push({
                label: customizeLanguageData('deactivate', 'Deactivate'),
                icon: InactiveToggleIcon,
                onClick: (rows: Role[]) => bulkChangeState(rows, BULK_ACTION.DEACTIVATE, onSuccess)
            });
        }

        if (allowedRoutesStore.can('deleteRole')) {
            actions.push({
                label: customizeLanguageData('delete', 'Delete'),
                icon: TrashIcon,
                variant: STATUS_DANGER,
                onClick: (rows: Role[]) => bulkDelete(rows, onSuccess)
            });
        }

        return actions;
    };

    return {
        isLoading,
        roles,
        stats,
        tableColumns,
        confirmState,
        searchQuery,
        currentPage,
        limit,
        filters,
        filterFields,
        dialogVisible,
        isEditingDialog,
        editingRoleId,
        editForm,
        editErrors,
        isSavingEdit,
        viewDialogVisible,
        viewingRole,
        confirmDeleteVisible,
        isDeletingRole,
        selectedRoles,
        getBulkActions,

        fetchRoles,
        reloadRoles,
        fetchStats,
        handleSearch,
        handleFilterChange,
        openCreateDialog,
        openEditDialog,
        openViewDialog,
        openDeleteConfirm,
        saveRoleForm,
        confirmDelete,
        getActionOptions
    };
}

export const useRole = createSharedComposable(roleManager);
