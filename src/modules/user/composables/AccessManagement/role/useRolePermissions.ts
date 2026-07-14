import { ref, computed } from 'vue';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import { toast } from 'vue-sonner';

export interface PermissionGroup {
    id: number;
    name: string;
    code: string;
    level: number;
    permissions: Permission[];
    permissionGroups?: PermissionGroup[];
}

export interface Permission {
    id: number;
    name: string;
    key: string;
    is_permitted: boolean;
}

export function useRolePermissions(roleId: number) {
    const { customizeLanguageData } = useLanguageStore();

    const isLoading = ref(false);
    const isSaving = ref(false);
    const role = ref<any>(null);
    const permissionGroups = ref<PermissionGroup[]>([]);
    const selectedGroupId = ref<number | null>(null);
    const selectedPermissions = ref<Set<number>>(new Set());
    const searchQuery = ref('');
    const activeTab = ref<'permission_group' | 'module_group'>('permission_group');

    const selectedGroup = computed(
        () => permissionGroups.value.find((group) => group.id === selectedGroupId.value) ?? null
    );

    const filteredGroups = computed(() => {
        if (!searchQuery.value) return permissionGroups.value;
        const query = searchQuery.value.toLowerCase();
        return permissionGroups.value.filter((group) => group.name.toLowerCase().includes(query));
    });

    const groupPermissionCount = (group: PermissionGroup) => {
        const total = group.permissions?.length ?? 0;
        const granted =
            group.permissions?.filter((permission) => selectedPermissions.value.has(permission.id)).length ?? 0;
        return `${granted}/${total}`;
    };

    const isAllSelected = computed(() => {
        if (!selectedGroup.value) return false;
        return selectedGroup.value.permissions.every((permission) => selectedPermissions.value.has(permission.id));
    });

    const toggleSelectAll = () => {
        if (!selectedGroup.value) return;
        if (isAllSelected.value) {
            selectedGroup.value.permissions.forEach((permission) => selectedPermissions.value.delete(permission.id));
        } else {
            selectedGroup.value.permissions.forEach((permission) => selectedPermissions.value.add(permission.id));
        }
    };

    const togglePermission = (id: number) => {
        if (selectedPermissions.value.has(id)) {
            selectedPermissions.value.delete(id);
        } else {
            selectedPermissions.value.add(id);
        }
    };

    const fetchRolePermissions = async () => {
        isLoading.value = true;
        try {
            const [roleRes, groupsRes] = await Promise.all([
                axiosInstance.get(`/role/${roleId}/permission-groups`),
                axiosInstance.get('/role/', { params: { limit: 1 } })
            ]);

            permissionGroups.value = roleRes.data.data ?? [];

            permissionGroups.value.forEach((group) => {
                group.permissions?.forEach((permission) => {
                    if (permission.is_permitted) selectedPermissions.value.add(permission.id);
                });
            });

            if (permissionGroups.value.length > 0) {
                selectedGroupId.value = permissionGroups.value[0]?.id ?? null;
            }
        } catch {
            toast.error(customizeLanguageData('somethingWentWrong', 'Something went wrong'));
        } finally {
            isLoading.value = false;
        }
    };

    const fetchRoleDetail = async () => {
        try {
            const res = await axiosInstance.get(`/role/`, { params: { limit: 100 } });
            const found = (res.data.data ?? []).find((role: any) => role.id === roleId);
            role.value = found ?? null;
        } catch {}
    };

    const savePermissions = async () => {
        isSaving.value = true;
        try {
            await axiosInstance.post(`/role/${roleId}/permissions/set`, {
                permissions: Array.from(selectedPermissions.value)
            });
            toast.success(customizeLanguageData('permissionsSuccessfullyUpdated', 'Permissions updated'));
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || customizeLanguageData('somethingWentWrong', 'Something went wrong')
            );
        } finally {
            isSaving.value = false;
        }
    };

    return {
        isLoading,
        isSaving,
        role,
        permissionGroups,
        filteredGroups,
        selectedGroupId,
        selectedGroup,
        selectedPermissions,
        searchQuery,
        activeTab,
        isAllSelected,

        groupPermissionCount,
        toggleSelectAll,
        togglePermission,
        fetchRolePermissions,
        fetchRoleDetail,
        savePermissions
    };
}
