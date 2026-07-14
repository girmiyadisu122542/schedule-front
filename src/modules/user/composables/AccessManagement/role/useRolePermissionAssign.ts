import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import type {
    RolePermissionGroup,
    RoleModuleGroup,
    RoleModule,
    RolePermissionStats
} from '@/modules/user/types/AccessManagement/rolePermission';

export function useRolePermissionAssign() {
    const { customizeLanguageData } = useLanguageStore();

    const isLoading = ref(false);
    const isSaving = ref(false);

    const permissionGroups = ref<RolePermissionGroup[]>([]);
    const selectedGroupId = ref<number | null>(null);
    const pgSearchQuery = ref('');
    const expandedGroups = ref<Set<number>>(new Set());

    const selectedGroup = computed(() => findGroupById(permissionGroups.value, selectedGroupId.value));

    const filteredPgTree = computed(() => {
        if (!pgSearchQuery.value) return buildTree(permissionGroups.value);
        const query = pgSearchQuery.value.toLowerCase();
        const filtered = permissionGroups.value.filter((group) => group.name.toLowerCase().includes(query));
        return buildTree(filtered);
    });

    const moduleGroups = ref<RoleModuleGroup[]>([]);
    const selectedModuleGroupId = ref<number | null>(null);
    const selectedModuleId = ref<number | null>(null);
    const mgSearchQuery = ref('');
    const expandedModuleGroups = ref<Set<number>>(new Set());

    const selectedModuleGroup = computed(
        () => moduleGroups.value.find((moduleGroup) => moduleGroup.id === selectedModuleGroupId.value) ?? null
    );

    const selectedModule = computed(() => {
        if (!selectedModuleGroup.value) return null;
        return selectedModuleGroup.value.modules.find((moduleItem) => moduleItem.id === selectedModuleId.value) ?? null;
    });

    const filteredModuleGroups = computed(() => {
        if (!mgSearchQuery.value) return moduleGroups.value;
        const query = mgSearchQuery.value.toLowerCase();
        return moduleGroups.value.filter(
            (moduleGroup) =>
                moduleGroup.name.toLowerCase().includes(query) ||
                moduleGroup.modules.some((moduleItem) => moduleItem.name.toLowerCase().includes(query))
        );
    });

    const selectedPermissions = ref<Set<number>>(new Set());
    const savedPermissions = ref<Set<number>>(new Set());

    const stats = computed<RolePermissionStats>(() => {
        const allIds = new Set<number>();
        permissionGroups.value.forEach((group) =>
            group.permissions?.forEach((permission) => allIds.add(permission.id))
        );
        moduleGroups.value.forEach((moduleGroup) =>
            moduleGroup.modules?.forEach((moduleItem) =>
                moduleItem.permissions?.forEach((permission) => allIds.add(permission.id))
            )
        );
        const all = allIds.size;
        const granted = savedPermissions.value.size;
        return { all, granted, revoked: all - granted };
    });

    const isPermissionsDirty = computed(() => {
        if (selectedPermissions.value.size !== savedPermissions.value.size) return true;
        for (const id of selectedPermissions.value) {
            if (!savedPermissions.value.has(id)) return true;
        }
        return false;
    });

    function buildTree(flat: RolePermissionGroup[]): RolePermissionGroup[] {
        const map = new Map<number, RolePermissionGroup & { children: RolePermissionGroup[] }>();
        const roots: (RolePermissionGroup & { children: RolePermissionGroup[] })[] = [];
        flat.forEach((group) => map.set(group.id, { ...group, children: [] }));
        flat.forEach((group) => {
            const node = map.get(group.id)!;
            if (group.permission_group_id && map.has(group.permission_group_id)) {
                map.get(group.permission_group_id)!.children.push(node);
            } else {
                roots.push(node);
            }
        });
        return roots;
    }

    function findGroupById(groups: RolePermissionGroup[], id: number | null): RolePermissionGroup | null {
        if (!id) return null;
        for (const group of groups) {
            if (group.id === id) return group;
            if (group.children?.length) {
                const found = findGroupById(group.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    const groupGrantedCount = (group: RolePermissionGroup): string => {
        const collect = (group: RolePermissionGroup): number[] => {
            const ids = (group.permissions ?? []).map((permission) => permission.id);
            return [...ids, ...(group.children ?? []).flatMap((child) => collect(child))];
        };
        const all = collect(group);
        const granted = all.filter((id) => selectedPermissions.value.has(id)).length;
        return `${granted}/${all.length}`;
    };

    const moduleGrantedCount = (mod: RoleModule): string => {
        const granted = (mod.permissions ?? []).filter((permission) =>
            selectedPermissions.value.has(permission.id)
        ).length;
        return `${granted}/${mod.permissions?.length ?? 0}`;
    };

    const moduleGroupGrantedCount = (moduleGroup: RoleModuleGroup): string => {
        const allPerms = moduleGroup.modules.flatMap((moduleItem) => moduleItem.permissions ?? []);
        const granted = allPerms.filter((permission) => selectedPermissions.value.has(permission.id)).length;
        return `${granted}/${allPerms.length}`;
    };

    const toggleExpand = (id: number) => {
        if (expandedGroups.value.has(id)) expandedGroups.value.delete(id);
        else expandedGroups.value.add(id);
    };

    const togglePermission = (id: number) => {
        if (selectedPermissions.value.has(id)) selectedPermissions.value.delete(id);
        else selectedPermissions.value.add(id);
    };

    const allPermissionIds = computed(() => {
        const ids = new Set<number>();
        permissionGroups.value.forEach((group) => group.permissions?.forEach((permission) => ids.add(permission.id)));
        moduleGroups.value.forEach((moduleGroup) =>
            moduleGroup.modules?.forEach((moduleItem) =>
                moduleItem.permissions?.forEach((permission) => ids.add(permission.id))
            )
        );
        return ids;
    });

    const selectAllPermissions = () => {
        allPermissionIds.value.forEach((id) => selectedPermissions.value.add(id));
    };

    const clearAllPermissions = () => {
        selectedPermissions.value.clear();
    };

    const isGroupAllSelected = computed(() => {
        if (!selectedGroup.value) return false;
        return selectedGroup.value.permissions.every((permission) => selectedPermissions.value.has(permission.id));
    });

    const isModuleAllSelected = computed(() => {
        if (!selectedModule.value) return false;
        return selectedModule.value.permissions.every((permission) => selectedPermissions.value.has(permission.id));
    });

    const toggleGroupSelectAll = () => {
        if (!selectedGroup.value) return;
        if (isGroupAllSelected.value) {
            selectedGroup.value.permissions.forEach((permission) => selectedPermissions.value.delete(permission.id));
        } else {
            selectedGroup.value.permissions.forEach((permission) => selectedPermissions.value.add(permission.id));
        }
    };

    const toggleModuleSelectAll = () => {
        if (!selectedModule.value) return;
        if (isModuleAllSelected.value) {
            selectedModule.value.permissions.forEach((permission) => selectedPermissions.value.delete(permission.id));
        } else {
            selectedModule.value.permissions.forEach((permission) => selectedPermissions.value.add(permission.id));
        }
    };

    const fetchForRole = async (roleId: number) => {
        isLoading.value = true;
        selectedPermissions.value.clear();
        try {
            const pgRes = await axiosInstance.get(`/role/${roleId}/permission-groups`);

            const rawPg: any[] = pgRes.data.data ?? [];
            permissionGroups.value = rawPg.map(
                (group: any, index: number): RolePermissionGroup => ({
                    id: group.id ?? index + 1,
                    name: group.name ?? group.group ?? '',
                    code: group.code ?? '',
                    level: group.level ?? 1,
                    permission_group_id: group.permission_group_id ?? null,
                    permissions: (group.permission ?? group.permissions ?? []).map((permission: any) => ({
                        id: permission.id,
                        name: permission.name,
                        key: permission.key ?? '',
                        is_permitted: permission.is_permitted ?? false
                    }))
                })
            );

            moduleGroups.value = [];

            [...permissionGroups.value].forEach((group) => {
                group.permissions?.forEach((permission) => {
                    if (permission.is_permitted) selectedPermissions.value.add(permission.id);
                });
            });

            savedPermissions.value = new Set(selectedPermissions.value);

            if (permissionGroups.value.length > 0) {
                selectedGroupId.value = permissionGroups.value[0]?.id ?? null;
            }
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ?? customizeLanguageData('somethingWentWrong', 'Something went wrong')
            );
        } finally {
            isLoading.value = false;
        }
    };

    const savePermissions = async (roleId: number) => {
        isSaving.value = true;
        try {
            await axiosInstance.post(`/role/${roleId}/permissions/set`, {
                permissions: Array.from(selectedPermissions.value)
            });
            savedPermissions.value = new Set(selectedPermissions.value);
            toast.success(customizeLanguageData('permissionsSuccessfullyUpdated', 'Permissions updated'));
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ?? customizeLanguageData('somethingWentWrong', 'Something went wrong')
            );
        } finally {
            isSaving.value = false;
        }
    };

    return {
        isLoading,
        isSaving,
        stats,

        permissionGroups,
        selectedGroupId,
        selectedGroup,
        pgSearchQuery,
        expandedGroups,
        filteredPgTree,
        moduleGroups,
        selectedModuleGroupId,
        selectedModuleGroup,
        selectedModuleId,
        selectedModule,
        mgSearchQuery,
        filteredModuleGroups,
        expandedModuleGroups,
        isModuleAllSelected,
        isGroupAllSelected,
        selectedPermissions,
        savedPermissions,
        isPermissionsDirty,

        togglePermission,
        selectAllPermissions,
        clearAllPermissions,
        groupGrantedCount,
        moduleGrantedCount,
        moduleGroupGrantedCount,
        toggleExpand,
        toggleGroupSelectAll,
        toggleModuleSelectAll,
        fetchForRole,
        savePermissions
    };
}
