import type { Ref } from 'vue';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import { ref, watch, computed, reactive } from 'vue';

import axiosInstance from '@/api/axiosInstance';
import { ALL_TAB_VALUE } from '@/config/appConfig';
import { useLanguageStore } from '@/stores/languageStore';
import type { ApiResponse, FetchParams } from '@/types/CommonTypes';
import type { Permission } from '@/modules/user/types/AccessManagement/permission';
import { validateFormWithZod, type NormalizedErrors } from '@/utils/errorFormatter';
import type { permissionOverridePayload, User } from '@/modules/user/types/AccessManagement/User/UserType';
import { userPermissionOverrideSchema } from '@/modules/user/schemas/AccessManagement/User/userPermissionOverrideSchema';
import type { UserPermissionOverrideFields } from '@/modules/user/schemas/AccessManagement/User/userPermissionOverrideSchema';
import { useUserActivation } from '@/modules/user/composables/AccessManagement/User/useUserActivation';

interface PermissionGroup {
    id: number;
    level: number;
    name: string;
    code: string;
    parent: any;
    is_group: boolean;
    has_children?: boolean;
    permissions_count: number;
    granted_count?: number;
    permission_group_id: number | null;
}

export function usePermissionOverride(user: Ref<User | null | undefined>) {
    const languageStore = useLanguageStore();
    const { currentLanguage } = storeToRefs(languageStore);
    const { customizeLanguageData } = languageStore;
    const { ensureUserActive } = useUserActivation();

    const previousSelectedIds = ref<number[]>([]);

    const activeTab = ref<string | number>(ALL_TAB_VALUE);

    const tabOptions = computed(() => [
        { id: ALL_TAB_VALUE, label: customizeLanguageData('all', 'All'), value: ALL_TAB_VALUE }
    ]);

    const groupFilterId = ref<number | null>(null);

    const limit = ref<number>(10);
    const currentPage = ref<number>(1);
    const currentGroupId = ref<number>();
    const currentGroupName = ref<string>('');
    const isLoading = ref<boolean>(false);
    const permissionSearchQuery = ref<string>('');
    const permissionGroupSearchQuery = ref<string>('');
    const selectedEntityTypeId = ref<number | string>('');
    const selectedItems = ref<{ id: number; state: number }[]>([]);
    const selectedPermissionGroupParentId = ref<number | null>(null);

    const currentPermissions = ref<Permission[]>([]);
    const permissionGroups = ref<PermissionGroup[]>([]);
    const selectedUser = ref<User | null>(user.value || null);
    const permissions = ref<ApiResponse<Permission> | null>(null);
    const validationErrors = ref<NormalizedErrors<UserPermissionOverrideFields>>({});

    const pendingChanges = ref<Map<number, boolean>>(new Map());

    const groupFilterOptions = computed(() =>
        permissionGroups.value.map((group) => ({ label: group.name, value: group.id }))
    );

    const displayedGroups = computed(() => {
        let groups = permissionGroups.value;

        if (groupFilterId.value) {
            groups = groups.filter((group) => group.id === groupFilterId.value);
        }

        if (permissionGroupSearchQuery.value) {
            const query = permissionGroupSearchQuery.value.toLowerCase();
            groups = groups.filter((group) => group.name.toLowerCase().includes(query));
        }

        return groups;
    });

    const clearGroupFilter = () => {
        groupFilterId.value = null;
    };

    const selectedCount = computed(() => selectedItems.value.length);
    const totalPermissions = computed(() => currentPermissions.value.length);
    const isDirty = computed(() => pendingChanges.value.size > 0);

    const tableColumns = [
        { key: 'name', label: customizeLanguageData('permissionName', 'Permission Name') },
        { key: 'state', label: customizeLanguageData('action', 'Action') }
    ];

    const userPermissionOverrideform = reactive<permissionOverridePayload>({
        starts_at: null,
        ends_at: null,
        allow: false,
        permission_ids: []
    });

    const fetchPermissionGroups = async (entityTypeId: number | string, parentId?: number | null) => {
        try {
            const response = await axiosInstance.get<ApiResponse<PermissionGroup>>(
                '/permission-group/permission/entity-type',
                {
                    params: {
                        entity_type_id: entityTypeId || undefined,
                        parent_id: parentId || selectedPermissionGroupParentId.value,
                        user_id: selectedUser.value?.id || undefined,
                        dropdown: true
                    }
                }
            );

            if (parentId === null || parentId === undefined) {
                permissionGroups.value = response.data.data;
            }

            return response.data.data;
        } catch (error) {
            console.error(
                customizeLanguageData('failedToFetchGroupedPermissions', 'Failed to fetch grouped permissions'),
                error
            );
            return [];
        }
    };

    const applyGrantedFlags = () => {
        const data = permissions.value?.data;
        if (!data) return;
        data.forEach((permission) => {
            permission.granted = pendingChanges.value.get(permission.id) === true;
        });
    };

    const stagePermission = (permissionId: number, allow: boolean) => {
        pendingChanges.value.set(permissionId, allow);
        const item = permissions.value?.data?.find((permission) => permission.id === permissionId);
        if (item) item.granted = allow;
    };

    const unstagePermission = (permissionId: number) => {
        pendingChanges.value.delete(permissionId);
        const item = permissions.value?.data?.find((permission) => permission.id === permissionId);
        if (item) item.granted = false;
    };

    const setPermissionGranted = (permissionId: number, granted: boolean) => {
        if (granted) {
            stagePermission(permissionId, true);
        } else {
            unstagePermission(permissionId);
        }
    };

    const fetchPermissions = async (params: FetchParams = {}) => {
        try {
            isLoading.value = true;
            const response = await axiosInstance.get<ApiResponse<Permission>>('/permission', {
                params: {
                    limit: params.perPage ?? limit.value,
                    page: params.page ?? currentPage.value,
                    permission_group_id: currentGroupId.value,
                    entity_type: selectedEntityTypeId.value || undefined,
                    search: permissionSearchQuery.value || undefined,
                    authorized_only: true,
                    dropdown: true
                }
            });
            permissions.value = response.data;
            applyGrantedFlags();
        } catch (error) {
            console.error(customizeLanguageData('failedToFetchPermissions', 'Failed to fetch permissions'), error);
        } finally {
            isLoading.value = false;
        }
    };

    const handleTabChange = async (tabValue: number | string) => {
        activeTab.value = tabValue;
        selectedPermissionGroupParentId.value = null;
        currentGroupId.value = undefined;
        currentGroupName.value = '';
        groupFilterId.value = null;

        selectedEntityTypeId.value = '';
        await fetchPermissionGroups('');
        await fetchPermissions({ page: 1 });
    };

    const handleExpand = async (node: any) => {
        selectedPermissionGroupParentId.value = node.id;
        const children = await fetchPermissionGroups(
            selectedEntityTypeId.value as number,
            selectedPermissionGroupParentId.value
        );
        node.children = children;

        if (!children || children.length === 0) {
            currentGroupId.value = node.id;
            currentGroupName.value = node.name;
        }
    };

    const handleLeafClicked = async (node: any) => {
        if (node && !node.is_group) {
            currentGroupId.value = node.id;
            currentGroupName.value = node.name;
        } else {
            await handleExpand(node);
        }
    };

    const onLeafClicked = async (node: any) => {
        await handleLeafClicked(node);
        if (node && !node.is_group) {
            currentPermissions.value = permissions.value?.data || [];
            selectedItems.value = [];
        }
    };

    const submitPermissionOverride = async (options: { resetForm?: boolean } = {}): Promise<boolean> => {
        const { resetForm = true } = options;
        const errors = validateFormWithZod<UserPermissionOverrideFields>(
            userPermissionOverrideSchema.value,
            userPermissionOverrideform
        );

        validationErrors.value = {};
        if (errors) {
            validationErrors.value = errors;
            return false;
        }

        const isActive = await ensureUserActive(selectedUser.value);
        if (!isActive) return false;

        const payloadToSend: Record<string, any> = {};
        Object.entries(userPermissionOverrideform).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                payloadToSend[key] = value;
            }
        });

        if (payloadToSend.starts_at) {
            const date = new Date(payloadToSend.starts_at);
            payloadToSend.starts_at = `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        }
        if (payloadToSend.ends_at) {
            const date = new Date(payloadToSend.ends_at);
            payloadToSend.ends_at = `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        }

        try {
            isLoading.value = true;
            const response = await axiosInstance.post(
                `/user/${selectedUser.value?.id}/assign-permission`,
                payloadToSend
            );
            toast.success(
                response.data.message ||
                    customizeLanguageData('permissionsAssignedSuccessfully', 'Permissions assigned successfully')
            );

            if (resetForm) {
                selectedItems.value = [];
                userPermissionOverrideform.permission_ids = [];
                userPermissionOverrideform.allow = false;
                clearForm(userPermissionOverrideform);
            }

            return true;
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    customizeLanguageData('errorSubmittingPermissionOverride', 'Error submitting override')
            );
            return false;
        } finally {
            isLoading.value = false;
        }
    };

    const clearForm = (form: any) => {
        Object.keys(form).forEach((key) => {
            form[key] = null;
        });
    };

    const assignPermissions = () => {
        selectedItems.value.forEach((item) => stagePermission(item.id, true));
    };

    const revokePermissions = () => {
        selectedItems.value.forEach((item) => stagePermission(item.id, false));
    };

    const savePermissionChanges = async (): Promise<boolean> => {
        if (pendingChanges.value.size === 0) {
            return true;
        }

        const missing: NormalizedErrors<UserPermissionOverrideFields> = {};
        if (!userPermissionOverrideform.starts_at) {
            missing.starts_at = customizeLanguageData('startDateRequired', 'Start date is required');
        }
        if (Object.keys(missing).length) {
            validationErrors.value = missing;
            toast.error(customizeLanguageData('startDateRequired', 'Start date is required'));
            return false;
        }
        validationErrors.value = {};

        const toGrant: number[] = [];
        const toRevoke: number[] = [];
        pendingChanges.value.forEach((granted, permissionId) => {
            (granted ? toGrant : toRevoke).push(permissionId);
        });

        let ok = true;
        if (toGrant.length) {
            userPermissionOverrideform.permission_ids = toGrant;
            userPermissionOverrideform.allow = true;
            ok = await submitPermissionOverride({ resetForm: false });
        }
        if (ok && toRevoke.length) {
            userPermissionOverrideform.permission_ids = toRevoke;
            userPermissionOverrideform.allow = false;
            ok = await submitPermissionOverride({ resetForm: false });
        }

        if (ok) {
            pendingChanges.value.clear();
            applyGrantedFlags();
        }

        return ok;
    };

    const clearPendingChanges = () => {
        pendingChanges.value.clear();
        applyGrantedFlags();
    };

    const handleSearch = (value: string): void => {
        permissionSearchQuery.value = value;
        fetchPermissions({ page: 1 });
    };

    const handleSelectedItems = (ids: number[]) => {
        const permissionsData = permissions.value?.data ?? [];

        previousSelectedIds.value
            .filter((id) => !ids.includes(id))
            .forEach((id) => {
                const index = selectedItems.value.findIndex((selected) => selected.id === id);
                if (index !== -1) {
                    selectedItems.value.splice(index, 1);
                }
            });

        ids.filter((id) => !previousSelectedIds.value.includes(id)).forEach((id) => {
            const item = permissionsData.find((permission) => permission.id === id);
            if (item) {
                selectedItems.value.push({ id, state: item.granted ? 1 : 0 });
            }
        });

        previousSelectedIds.value = [...ids];
    };

    const handleToggleChange = (item: Permission, granted: boolean) => {
        setPermissionGranted(item.id, granted);
    };

    watch(selectedItems, (newVal) => {
        if (newVal.length === 0 && previousSelectedIds.value.length > 0) {
            previousSelectedIds.value = [];
        }
    });

    watch(
        user,
        async (newUser) => {
            selectedUser.value = newUser || null;
            if (!newUser?.id) return;
            await handleTabChange(ALL_TAB_VALUE);
        },
        { immediate: true }
    );

    watch(
        () => currentGroupId.value,
        () => fetchPermissions({ page: 1 })
    );

    watch(currentLanguage, async (newLang, oldLang) => {
        if (newLang === oldLang) return;
        if (activeTab.value) {
            await handleTabChange(activeTab.value);
        }
        if (currentGroupId.value) {
            await fetchPermissions({ page: 1 });
        }
    });

    return {
        selectedPermissionGroupParentId,
        permissionGroupSearchQuery,
        userPermissionOverrideform,
        selectedEntityTypeId,
        currentPermissions,
        validationErrors,
        permissionGroups,
        totalPermissions,
        displayedGroups,
        currentGroupId,
        currentGroupName,
        selectedItems,
        selectedCount,
        tableColumns,
        selectedUser,
        permissions,
        tabOptions,
        isLoading,
        isDirty,
        activeTab,
        groupFilterId,
        groupFilterOptions,
        clearGroupFilter,
        handleSearch,
        handleExpand,
        onLeafClicked,
        handleSelectedItems,
        handleToggleChange,
        assignPermissions,
        revokePermissions,
        setPermissionGranted,
        savePermissionChanges,
        clearPendingChanges,
        handleTabChange,
        fetchPermissions,
        handleLeafClicked,
        submitPermissionOverride
    };
}
