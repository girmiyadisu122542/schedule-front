import { ref, reactive, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue-sonner';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import {
    permissionGroupSchema,
    permissionSchema
} from '@/modules/user/schemas/AccessManagement/permission/permissionSchema';
import type {
    Permission,
    PermissionGroup,
    PermissionGroupForm,
    PermissionForm,
    PaginatedPermissions,
    PaginatedPermissionGroups
} from '@/modules/user/types/AccessManagement/permission';
import {
    ACTIVE_STATUS,
    INACTIVE_STATUS,
    STATUS_INFO,
    STATUS_DANGER,
    STATUS_ACTIVATE,
    STATUS_DEACTIVATE
} from '@/config/appConfig';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import type { ConfirmState } from '@/types/CommonTypes';
import { normalizeErrors } from '@/utils/errorFormatter';

import EyeIcon from '@/assets/icons/EyeIcon.vue';
import EditIcon from '@/assets/icons/EditIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import ActiveToggleIcon from '@/assets/icons/ActiveToggleIcon.vue';
import InactiveToggleIcon from '@/assets/icons/InactiveToggleIcon.vue';

interface FetchParams {
    page?: number;
    perPage?: number;
    search?: string;
}

export function usePermission() {
    const languageStore = useLanguageStore();
    const { currentLanguage } = storeToRefs(languageStore);
    const { customizeLanguageData } = languageStore;
    const allowedRoutesStore = useAllowedRoutesStore();

    const isLoading = ref(false);
    const isSaving = ref(false);
    const searchQuery = ref('');
    const permissionSearch = ref('');
    const currentPage = ref(1);
    const limit = ref(10);
    const permFilters = ref<Record<string, any>>({});

    const permissionGroups = ref<PaginatedPermissionGroups>({ data: [], pagination: null });
    const selectedGroupId = ref<number | null>(null);
    const selectedGroup = computed(
        () => permissionGroups.value.data.find((group) => group.id === selectedGroupId.value) ?? null
    );

    const permissions = ref<PaginatedPermissions>({ data: [], pagination: null });
    const selectedPermissions = ref<Set<number>>(new Set());
    const isAllSelected = computed(() => {
        if (!permissions.value.data.length) return false;
        return permissions.value.data.every((permission) => selectedPermissions.value.has(permission.id));
    });

    const modules = ref<{ id: number; name: string }[]>([]);

    const groupDialogVisible = ref(false);
    const permDialogVisible = ref(false);
    const groupDetailVisible = ref(false);
    const permDetailVisible = ref(false);
    const selectedPermDetail = ref<Permission | null>(null);
    const isEditingGroup = ref(false);
    const isEditingPerm = ref(false);
    const selectedGroupDetail = ref<PermissionGroup | null>(null);
    const selectedGroupForEdit = ref<PermissionGroup | null>(null);
    const selectedPermForEdit = ref<Permission | null>(null);
    const groupFormErrors = ref<Record<string, string>>({});
    const permFormErrors = ref<Record<string, string>>({});
    const formErrors = ref<Record<string, string>>({});

    const groupForm = reactive<PermissionGroupForm>({
        name: '',
        code: '',
        permission_group_id: null,
        is_group: false,
        status: ACTIVE_STATUS
    });

    const permForm = reactive<PermissionForm>({
        name: '',
        key: '',
        module_id: null,
        permission_group_id: null,
        unique_per_user: false,
        state: ACTIVE_STATUS
    });

    const confirmState = ref<ConfirmState>({
        show: false,
        loading: false,
        title: '',
        message: '',
        type: STATUS_INFO,
        confirmLabel: '',
        onConfirm: () => {}
    });

    const openConfirmDialog = (opts: {
        title: string;
        message: string;
        confirmLabel: string;
        type: ConfirmState['type'];
        itemNames?: string[];
        run: () => Promise<void> | void;
    }) => {
        confirmState.value = {
            show: true,
            loading: false,
            title: opts.title,
            message: opts.message,
            type: opts.type,
            confirmLabel: opts.confirmLabel,
            itemLabel: customizeLanguageData('permission', 'Permission'),
            itemNames: opts.itemNames,
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

    const fetchPermissionGroups = async (params: FetchParams = {}) => {
        isLoading.value = true;
        try {
            const res = await axiosInstance.get('/permission-group', {
                params: { page: params.page ?? 1, limit: params.perPage ?? 100, search: params.search ?? undefined }
            });
            permissionGroups.value = { data: res.data.data ?? [], pagination: res.data.pagination ?? null };
            if (!selectedGroupId.value && permissionGroups.value.data.length > 0) {
                selectedGroupId.value = permissionGroups.value.data[0]?.id ?? null;
            }
        } catch {
            toast.error(customizeLanguageData('somethingWentWrong', 'Error'));
        } finally {
            isLoading.value = false;
        }
    };

    const fetchPermissions = async (params: FetchParams = {}) => {
        isLoading.value = true;
        try {
            const res = await axiosInstance.get('/permission', {
                params: {
                    page: params.page ?? currentPage.value,
                    limit: params.perPage ?? limit.value,
                    search: params.search ?? (permissionSearch.value || undefined),
                    permission_group_id: selectedGroupId.value ?? undefined,
                    ...permFilters.value
                }
            });
            permissions.value = { data: res.data.data ?? [], pagination: res.data.pagination ?? null };
        } catch {
            toast.error(customizeLanguageData('somethingWentWrong', 'Error'));
        } finally {
            isLoading.value = false;
        }
    };

    const handlePermFilterChange = (filterValues: Record<string, any>) => {
        permFilters.value = filterValues;
        fetchPermissions({ page: 1 });
    };

    const permFilterFields = computed(() => {
        const fields: any[] = [];

        if (modules.value.length > 0) {
            fields.push({
                label: customizeLanguageData('module', 'Module'),
                key: 'module_id',
                options: modules.value.map((moduleItem) => ({ label: moduleItem.name, value: moduleItem.id }))
            });
        }

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

    // No module system in the Schedule starter kit -- keep as a no-op so the
    // permission catalogue's (now unused) module filter has nothing to load.
    const fetchModules = async () => {
        modules.value = [];
    };

    const selectGroup = (id: number) => {
        selectedGroupId.value = id;
        selectedPermissions.value.clear();
        fetchPermissions({ page: 1 });
    };

    const toggleSelectAll = () => {
        if (isAllSelected.value) {
            permissions.value.data.forEach((permission) => selectedPermissions.value.delete(permission.id));
        } else {
            permissions.value.data.forEach((permission) => selectedPermissions.value.add(permission.id));
        }
    };

    const togglePermission = (id: number) => {
        if (selectedPermissions.value.has(id)) selectedPermissions.value.delete(id);
        else selectedPermissions.value.add(id);
    };

    const openCreateGroup = () => {
        isEditingGroup.value = false;
        groupFormErrors.value = {};
        Object.assign(groupForm, {
            name: '',
            code: '',
            permission_group_id: null,
            is_group: false,
            status: ACTIVE_STATUS
        });
        groupDialogVisible.value = true;
    };

    const openEditGroup = (group: PermissionGroup) => {
        isEditingGroup.value = true;
        selectedGroupForEdit.value = group;
        groupFormErrors.value = {};
        Object.assign(groupForm, {
            name: group.name,
            code: group.code,
            permission_group_id: group.permission_group_id,
            is_group: false,
            status: group.status ?? ACTIVE_STATUS
        });
        groupDialogVisible.value = true;
    };

    const openGroupDetail = (group: PermissionGroup) => {
        selectedGroupDetail.value = group;
        groupDetailVisible.value = true;
    };

    const openPermissionDetail = (perm: Permission) => {
        selectedPermDetail.value = perm;
        permDetailVisible.value = true;
    };

    const saveGroup = async () => {
        groupFormErrors.value = {};
        const schema = permissionGroupSchema().value;
        const result = schema.safeParse({ ...groupForm });
        if (!result.success) {
            result.error.issues.forEach((issue) => {
                groupFormErrors.value[issue.path[0] as string] = issue.message;
            });
            return;
        }
        isSaving.value = true;
        try {
            if (isEditingGroup.value && selectedGroupForEdit.value) {
                await axiosInstance.post(`/permission-group/update/${selectedGroupForEdit.value.id}`, result.data);
                toast.success(customizeLanguageData('permissionGroupSuccessfullyUpdated', 'Group updated'));
            } else {
                await axiosInstance.post('/permission-group/create', result.data);
                toast.success(customizeLanguageData('permissionGroupSuccessfullyCreated', 'Group created'));
            }
            groupDialogVisible.value = false;
            fetchPermissionGroups();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || customizeLanguageData('somethingWentWrong'));
        } finally {
            isSaving.value = false;
        }
    };

    const deleteGroup = async (id: number) => {
        try {
            await axiosInstance.delete(`/permission-group/delete/${id}`);
            toast.success(customizeLanguageData('permissionGroupSuccessfullyDeleted'));
            fetchPermissionGroups();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || customizeLanguageData('somethingWentWrong'));
        }
    };

    const confirmGroupDeleteVisible = ref(false);
    const deletingGroupId = ref<number | null>(null);
    const isDeletingGroup = ref(false);

    const openGroupDeleteConfirm = (id: number) => {
        deletingGroupId.value = id;
        confirmGroupDeleteVisible.value = true;
    };

    const confirmGroupDelete = async () => {
        if (!deletingGroupId.value) return;
        isDeletingGroup.value = true;
        try {
            await axiosInstance.delete(`/permission-group/delete/${deletingGroupId.value}`);
            toast.success(customizeLanguageData('permissionGroupSuccessfullyDeleted'));
            confirmGroupDeleteVisible.value = false;
            fetchPermissionGroups();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || customizeLanguageData('somethingWentWrong'));
        } finally {
            isDeletingGroup.value = false;
            deletingGroupId.value = null;
        }
    };

    const confirmPermDeleteVisible = ref(false);
    const deletingPermId = ref<number | null>(null);
    const isDeletingPerm = ref(false);

    const openPermDeleteConfirm = (id: number) => {
        deletingPermId.value = id;
        confirmPermDeleteVisible.value = true;
    };

    const confirmPermDelete = async () => {
        if (!deletingPermId.value) return;
        isDeletingPerm.value = true;
        try {
            await axiosInstance.delete(`/permission/delete/${deletingPermId.value}`);
            toast.success(customizeLanguageData('permissionSuccessfullyDeleted'));
            confirmPermDeleteVisible.value = false;
            fetchPermissions();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || customizeLanguageData('somethingWentWrong'));
        } finally {
            isDeletingPerm.value = false;
            deletingPermId.value = null;
        }
    };

    const openCreatePermission = () => {
        isEditingPerm.value = false;
        permFormErrors.value = {};
        Object.assign(permForm, {
            name: '',
            key: '',
            module_id: null,
            permission_group_id: selectedGroupId.value,
            unique_per_user: false,
            state: ACTIVE_STATUS
        });
        permDialogVisible.value = true;
    };

    const openEditPermission = (perm: Permission) => {
        isEditingPerm.value = true;
        selectedPermForEdit.value = perm;
        permFormErrors.value = {};
        Object.assign(permForm, {
            name: perm.name,
            key: perm.key,
            module_id: perm.module_id,
            permission_group_id: perm.permission_group_id,
            unique_per_user: perm.unique_per_user,
            state: perm.state
        });
        permDialogVisible.value = true;
    };

    const savePermission = async () => {
        permFormErrors.value = {};
        const schema = permissionSchema(isEditingPerm.value).value;
        const result = schema.safeParse({ ...permForm });
        if (!result.success) {
            result.error.issues.forEach((issue) => {
                const key = issue.path[0] as string;
                if (key) permFormErrors.value[key] = issue.message;
            });
            return;
        }
        isSaving.value = true;
        try {
            if (isEditingPerm.value && selectedPermForEdit.value) {
                await axiosInstance.post(`/permission/update/${selectedPermForEdit.value.id}`, result.data);
                toast.success(customizeLanguageData('permissionSuccessfullyUpdated', 'Permission updated'));
            } else {
                await axiosInstance.post('/permission/create', result.data);
                toast.success(customizeLanguageData('permissionSuccessfullyCreated', 'Permission created'));
            }
            permDialogVisible.value = false;
            fetchPermissions();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                permFormErrors.value = normalizeErrors(error.response.data.errors);
            } else {
                toast.error(
                    error.response?.data?.message || customizeLanguageData('somethingWentWrong', 'Something went wrong')
                );
            }
        } finally {
            isSaving.value = false;
        }
    };

    const deletePermission = async (id: number) => {
        try {
            await axiosInstance.delete(`/permission/delete/${id}`);
            toast.success(customizeLanguageData('permissionSuccessfullyDeleted'));
            fetchPermissions();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || customizeLanguageData('somethingWentWrong'));
        }
    };

    const clearPermissionSelection = () => selectedPermissions.value.clear();

    const isBulkProcessing = ref(false);
    const bulkDeleteConfirmVisible = ref(false);

    const runBulkPermissionAction = async (actionType: 'activate' | 'deactivate' | 'delete') => {
        const ids = Array.from(selectedPermissions.value);
        if (!ids.length) return;
        isBulkProcessing.value = true;
        try {
            const res = await axiosInstance.post('/permission/bulk-action', {
                permission_ids: ids,
                action_type: actionType
            });
            toast.success(res.data?.message || customizeLanguageData('somethingWentWrong'));
            selectedPermissions.value.clear();
            fetchPermissions();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || customizeLanguageData('somethingWentWrong'));
        } finally {
            isBulkProcessing.value = false;
        }
    };

    const bulkActivatePermissions = () => {
        const count = selectedPermissions.value.size;
        if (!count) return;
        openConfirmDialog({
            title: customizeLanguageData('activate', 'Activate'),
            message: `${customizeLanguageData('confirmActivate', 'Activate')} ${count} ${customizeLanguageData('permissions', 'permissions')}?`,
            confirmLabel: customizeLanguageData('activate', 'Activate'),
            type: STATUS_ACTIVATE,
            run: () => runBulkPermissionAction('activate')
        });
    };

    const bulkDeactivatePermissions = () => {
        const count = selectedPermissions.value.size;
        if (!count) return;
        openConfirmDialog({
            title: customizeLanguageData('deactivate', 'Deactivate'),
            message: `${customizeLanguageData('confirmDeactivate', 'Deactivate')} ${count} ${customizeLanguageData('permissions', 'permissions')}?`,
            confirmLabel: customizeLanguageData('deactivate', 'Deactivate'),
            type: STATUS_DEACTIVATE,
            run: () => runBulkPermissionAction('deactivate')
        });
    };
    const initiateBulkDelete = () => {
        bulkDeleteConfirmVisible.value = true;
    };
    const confirmBulkDelete = async () => {
        await runBulkPermissionAction('delete');
        bulkDeleteConfirmVisible.value = false;
    };

    const getGroupActions = (group: PermissionGroup) => {
        const options: any[] = [
            { label: customizeLanguageData('view'), icon: EyeIcon, onClick: () => openGroupDetail(group) }
        ];

        if (allowedRoutesStore.can('updatePermissionGroup')) {
            options.push({ label: customizeLanguageData('edit'), icon: EditIcon, onClick: () => openEditGroup(group) });
        }

        if (allowedRoutesStore.can('createPermission')) {
            options.push({
                label: customizeLanguageData('addNewPermission', 'Add New Permission'),
                icon: PlusIcon,
                onClick: () => {
                    selectedGroupId.value = group.id;
                    openCreatePermission();
                }
            });
        }

        if (allowedRoutesStore.can('deletePermissionGroup')) {
            options.push({
                label: customizeLanguageData('delete'),
                icon: TrashIcon,
                variant: STATUS_DANGER,
                onClick: () => openGroupDeleteConfirm(group.id)
            });
        }

        return options;
    };

    const changePermissionState = async (perm: Permission) => {
        const currentState = Number(perm.state);
        const newState = currentState === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;
        try {
            await axiosInstance.get(`/permission/change-state/${perm.id}`, { params: { state: newState } });
            const message =
                newState === ACTIVE_STATUS
                    ? customizeLanguageData('permissionSuccessfullyActivated', 'Permission activated')
                    : customizeLanguageData('permissionSuccessfullyDeactivated', 'Permission deactivated');
            toast.success(message);
            fetchPermissions();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || customizeLanguageData('somethingWentWrong'));
        }
    };

    const confirmChangePermissionState = (perm: Permission) => {
        const willActivate = Number(perm.state) !== ACTIVE_STATUS;
        openConfirmDialog({
            title: willActivate
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            message: willActivate
                ? customizeLanguageData(
                      'confirmActivatePermission',
                      'Are you sure you want to activate this permission?'
                  )
                : customizeLanguageData(
                      'confirmDeactivatePermission',
                      'Are you sure you want to deactivate this permission?'
                  ),
            confirmLabel: willActivate
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            type: willActivate ? STATUS_ACTIVATE : STATUS_DEACTIVATE,
            itemNames: [perm.name],
            run: () => changePermissionState(perm)
        });
    };

    const getPermissionActions = (perm: Permission) => {
        const currentState = Number(perm.state);
        const options: any[] = [
            { label: customizeLanguageData('view', 'View'), icon: EyeIcon, onClick: () => openPermissionDetail(perm) }
        ];

        if (allowedRoutesStore.can('updatePermission')) {
            options.push({
                label: customizeLanguageData('edit', 'Edit'),
                icon: EditIcon,
                onClick: () => openEditPermission(perm)
            });
        }

        if (allowedRoutesStore.can('changePermissionStatus')) {
            options.push({
                label:
                    currentState === ACTIVE_STATUS
                        ? customizeLanguageData('deactivate', 'Deactivate')
                        : customizeLanguageData('activate', 'Activate'),
                icon: currentState === ACTIVE_STATUS ? InactiveToggleIcon : ActiveToggleIcon,
                onClick: () => confirmChangePermissionState(perm)
            });
        }

        if (allowedRoutesStore.can('deletePermission')) {
            options.push({
                label: customizeLanguageData('delete', 'Delete'),
                icon: TrashIcon,
                variant: STATUS_DANGER,
                onClick: () => openPermDeleteConfirm(perm.id)
            });
        }

        return options;
    };

    const handleSearch = (val: string) => {
        searchQuery.value = val;
    };

    let permissionSearchTimer: ReturnType<typeof setTimeout> | null = null;
    const handlePermissionSearch = (val: string) => {
        permissionSearch.value = val;
        if (permissionSearchTimer) clearTimeout(permissionSearchTimer);
        permissionSearchTimer = setTimeout(() => {
            fetchPermissions({ page: 1 });
        }, 350);
    };

    watch(currentLanguage, async (newLang, oldLang) => {
        if (newLang === oldLang) return;
        await fetchPermissionGroups();
        if (selectedGroupId.value) await fetchPermissions();
    });

    return {
        isLoading,
        isSaving,
        searchQuery,
        currentPage,
        limit,
        permissionGroups,
        selectedGroupId,
        selectedGroup,
        permissions,
        selectedPermissions,
        isAllSelected,
        modules,
        groupDialogVisible,
        permDialogVisible,
        groupDetailVisible,
        permDetailVisible,
        selectedPermDetail,
        isEditingGroup,
        isEditingPerm,
        selectedGroupDetail,
        groupForm,
        permForm,
        groupFormErrors,
        permFormErrors,
        confirmGroupDeleteVisible,
        isDeletingGroup,
        confirmPermDeleteVisible,
        isDeletingPerm,
        fetchPermissionGroups,
        fetchPermissions,
        fetchModules,
        selectGroup,
        toggleSelectAll,
        togglePermission,
        openCreateGroup,
        openEditGroup,
        openGroupDetail,
        saveGroup,
        deleteGroup,
        openPermissionDetail,
        openCreatePermission,
        openEditPermission,
        savePermission,
        deletePermission,
        openGroupDeleteConfirm,
        confirmGroupDelete,
        openPermDeleteConfirm,
        confirmPermDelete,
        getGroupActions,
        getPermissionActions,
        handleSearch,
        permissionSearch,
        handlePermissionSearch,
        permFilters,
        permFilterFields,
        handlePermFilterChange,
        clearPermissionSelection,
        isBulkProcessing,
        bulkDeleteConfirmVisible,
        bulkActivatePermissions,
        bulkDeactivatePermissions,
        initiateBulkDelete,
        confirmBulkDelete,
        confirmState
    };
}
