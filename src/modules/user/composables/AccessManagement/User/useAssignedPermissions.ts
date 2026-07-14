import type { Ref } from 'vue';
import { toast } from 'vue-sonner';
import { ref, watch, computed, onMounted } from 'vue';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import type { PermissionOverrideStatus } from '@/config/appConfig';
import type { User } from '@/modules/user/types/AccessManagement/User/UserType';

export interface RoleInheritedPermission {
    id: number;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: PermissionOverrideStatus;
    override_id: number | null;
}

export interface RoleInheritedGroup {
    role_id: number;
    role_name: string;
    binding_id: number;
    permissions: RoleInheritedPermission[];
}

export interface DirectGrantPeriod {
    override_id: number;
    start_date: string | null;
    end_date: string | null;
}

export interface DirectGrantGroup {
    permission_id: number;
    name: string;
    periods: DirectGrantPeriod[];
}

export const ASSIGNED_SUB_TAB = {
    ROLE_INHERITED: 'roleInherited',
    DIRECT_GRANTS: 'directGrants'
} as const;

export type AssignedSubTab = (typeof ASSIGNED_SUB_TAB)[keyof typeof ASSIGNED_SUB_TAB];

type ConfirmType = 'danger' | 'warning' | 'info';

interface PendingAction {
    title: string;
    message: string;
    confirmLabel: string;
    type: ConfirmType;
    run: () => Promise<void>;
}

export function useAssignedPermissions(user: Ref<User | null | undefined>) {
    const { customizeLanguageData } = useLanguageStore();

    const selectedUser = ref<User | null>(user.value || null);
    const activeSubTab = ref<AssignedSubTab>(ASSIGNED_SUB_TAB.ROLE_INHERITED);

    const subTabOptions = computed(() => [
        {
            label: customizeLanguageData('roleInheritedPermissions', 'Role Inherited Permissions'),
            value: ASSIGNED_SUB_TAB.ROLE_INHERITED
        },
        {
            label: customizeLanguageData('directGrantsTemporal', 'Direct Grants / Temporal'),
            value: ASSIGNED_SUB_TAB.DIRECT_GRANTS
        }
    ]);

    const roleInherited = ref<RoleInheritedGroup[]>([]);
    const directGrants = ref<DirectGrantGroup[]>([]);
    const isLoading = ref(false);

    // A single shared confirm dialog gates every revoke / restore / remove.
    const confirmVisible = ref(false);
    const confirmLoading = ref(false);
    const pendingAction = ref<PendingAction | null>(null);

    const fetchRoleInherited = async () => {
        const userId = selectedUser.value?.id;
        if (!userId) {
            roleInherited.value = [];
            return;
        }
        try {
            isLoading.value = true;
            const response = await axiosInstance.get(`/user/${userId}/role-inherited-permissions`);
            roleInherited.value = response.data?.data ?? [];
        } catch (error) {
            roleInherited.value = [];
        } finally {
            isLoading.value = false;
        }
    };

    const fetchDirectGrants = async () => {
        const userId = selectedUser.value?.id;
        if (!userId) {
            directGrants.value = [];
            return;
        }
        try {
            isLoading.value = true;
            const response = await axiosInstance.get(`/user/${userId}/permission-overrides`, {
                params: { limit: 1000 }
            });
            const overrides = response.data?.data ?? [];

            // Direct grants are the explicit allow-overrides; group each permission's
            // non-overlapping periods under one accordion.
            const groups = new Map<number, DirectGrantGroup>();
            overrides
                .filter((override: any) => override.allow)
                .forEach((override: any) => {
                    const permissionId = Number(override.permission_id);
                    if (!groups.has(permissionId)) {
                        groups.set(permissionId, {
                            permission_id: permissionId,
                            name: override.permission,
                            periods: []
                        });
                    }
                    groups.get(permissionId)!.periods.push({
                        override_id: override.id,
                        start_date: override.starts_at,
                        end_date: override.ends_at
                    });
                });

            directGrants.value = [...groups.values()];
        } catch (error) {
            directGrants.value = [];
        } finally {
            isLoading.value = false;
        }
    };

    const refreshActive = async () => {
        if (activeSubTab.value === ASSIGNED_SUB_TAB.ROLE_INHERITED) {
            await fetchRoleInherited();
        } else {
            await fetchDirectGrants();
        }
    };

    const requestConfirm = (action: PendingAction) => {
        pendingAction.value = action;
        confirmVisible.value = true;
    };

    const cancelConfirm = () => {
        confirmVisible.value = false;
        pendingAction.value = null;
    };

    const runConfirm = async () => {
        if (!pendingAction.value) return;
        confirmLoading.value = true;
        try {
            await pendingAction.value.run();
            confirmVisible.value = false;
            pendingAction.value = null;
        } finally {
            confirmLoading.value = false;
        }
    };

    const revokeInherited = (roleName: string, permission: RoleInheritedPermission) => {
        requestConfirm({
            title: customizeLanguageData('revokePermission', 'Revoke Permission'),
            message: customizeLanguageData(
                'revokeInheritedConfirm',
                'Revoke "{{name}}" inherited from {{role}}? An explicit restriction will be recorded.',
                { name: permission.name, role: roleName }
            ),
            confirmLabel: customizeLanguageData('revoke', 'Revoke'),
            type: 'danger',
            run: async () => {
                const userId = selectedUser.value?.id;
                if (!userId) return;
                try {
                    await axiosInstance.post(`/user/${userId}/revoke-inherited-permission`, {
                        permission_id: permission.id,
                        ends_at: permission.end_date
                    });
                    toast.success(customizeLanguageData('permissionRevoked', 'Permission revoked'));
                    await fetchRoleInherited();
                } catch (error: any) {
                    toast.error(
                        error.response?.data?.message ||
                            customizeLanguageData('somethingWentWrong', 'Something went wrong')
                    );
                }
            }
        });
    };

    const restoreInherited = (roleName: string, permission: RoleInheritedPermission) => {
        requestConfirm({
            title: customizeLanguageData('restorePermission', 'Restore Permission'),
            message: customizeLanguageData(
                'restoreInheritedConfirm',
                'Restore "{{name}}" inherited from {{role}}? The restriction will be removed.',
                { name: permission.name, role: roleName }
            ),
            confirmLabel: customizeLanguageData('restore', 'Restore'),
            type: 'info',
            run: async () => {
                const userId = selectedUser.value?.id;
                if (!userId) return;
                try {
                    await axiosInstance.post(`/user/${userId}/restore-inherited-permission`, {
                        permission_id: permission.id
                    });
                    toast.success(customizeLanguageData('permissionRestored', 'Permission restored'));
                    await fetchRoleInherited();
                } catch (error: any) {
                    toast.error(
                        error.response?.data?.message ||
                            customizeLanguageData('somethingWentWrong', 'Something went wrong')
                    );
                }
            }
        });
    };

    const removePeriod = (group: DirectGrantGroup, period: DirectGrantPeriod) => {
        requestConfirm({
            title: customizeLanguageData('removeGrant', 'Remove Grant'),
            message: customizeLanguageData(
                'removeGrantConfirm',
                'Permanently remove this "{{name}}" grant period? This cannot be undone.',
                { name: group.name }
            ),
            confirmLabel: customizeLanguageData('remove', 'Remove'),
            type: 'danger',
            run: async () => {
                const userId = selectedUser.value?.id;
                if (!userId) return;
                try {
                    await axiosInstance.delete(`/user/${userId}/permission-override/${period.override_id}`);
                    toast.success(customizeLanguageData('grantRemoved', 'Grant removed'));
                    await fetchDirectGrants();
                } catch (error: any) {
                    toast.error(
                        error.response?.data?.message ||
                            customizeLanguageData('somethingWentWrong', 'Something went wrong')
                    );
                }
            }
        });
    };

    watch(user, (newUser) => {
        selectedUser.value = newUser || null;
        refreshActive();
    });

    watch(activeSubTab, () => refreshActive());

    onMounted(() => {
        if (user.value) {
            selectedUser.value = user.value;
        }
        refreshActive();
    });

    return {
        selectedUser,
        activeSubTab,
        subTabOptions,
        roleInherited,
        directGrants,
        isLoading,
        confirmVisible,
        confirmLoading,
        pendingAction,
        fetchRoleInherited,
        fetchDirectGrants,
        revokeInherited,
        restoreInherited,
        removePeriod,
        cancelConfirm,
        runConfirm
    };
}
