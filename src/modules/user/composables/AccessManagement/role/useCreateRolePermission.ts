import { ref, reactive, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { useRouter } from 'vue-router';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import { roleSchema } from '@/modules/user/schemas/AccessManagement/role/roleSchema';
import { ROLE_PERMISSION_TAB, type RolePermissionTab, ACTIVE_STATUS } from '@/config/appConfig';
import { useRolePermissionAssign } from './useRolePermissionAssign';

export function useCreateRolePermission(initialRoleId: number | null = null) {
    const { customizeLanguageData } = useLanguageStore();
    const router = useRouter();

    const activeTab = ref<RolePermissionTab>(ROLE_PERMISSION_TAB.CREATE_ROLE);

    const isSavingRole = ref(false);
    const savedRoleId = ref<number | null>(initialRoleId);
    const savedRoleName = ref('');
    const savedRoleState = ref(ACTIVE_STATUS);
    const formErrors = ref<Record<string, string>>({});
    const isRoleSaved = computed(() => savedRoleId.value !== null);

    const roleForm = reactive({
        name: '',
        description: '',
        is_system: false,
        unique_per_user: false
    });

    const permAssign = useRolePermissionAssign();

    const serializeRoleForm = () =>
        JSON.stringify({
            name: roleForm.name,
            description: roleForm.description,
            is_system: roleForm.is_system,
            unique_per_user: roleForm.unique_per_user
        });

    const roleFormBaseline = ref(serializeRoleForm());
    const isRoleFormDirty = computed(() => serializeRoleForm() !== roleFormBaseline.value);
    const isDirty = computed(() => isRoleFormDirty.value || permAssign.isPermissionsDirty.value);

    watch(savedRoleId, async (id) => {
        if (id) await permAssign.fetchForRole(id);
    });

    const loadExistingRole = async (id: number) => {
        savedRoleId.value = id;
        activeTab.value = ROLE_PERMISSION_TAB.ASSIGN_PERMISSIONS;
        try {
            const res = await axiosInstance.get('/role', { params: { limit: 100 } });
            const found = (res.data.data ?? []).find((role: any) => role.id === id);
            if (found) {
                savedRoleName.value = found.name;
                savedRoleState.value = found.state;
                Object.assign(roleForm, {
                    name: found.name,
                    description: found.description ?? '',
                    is_system: found.is_system ?? false,
                    unique_per_user: found.unique_per_user ?? false
                });
                roleFormBaseline.value = serializeRoleForm();
            }
        } catch {}
        await permAssign.fetchForRole(id);
    };

    const saveRole = async (): Promise<boolean> => {
        formErrors.value = {};
        const schema = roleSchema().value;
        const result = schema.safeParse({ ...roleForm });

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                formErrors.value[issue.path[0] as string] = issue.message;
            });
            return false;
        }

        isSavingRole.value = true;
        try {
            if (savedRoleId.value) {
                await axiosInstance.post(`/role/update/${savedRoleId.value}`, result.data);
                toast.success(customizeLanguageData('roleSuccessfullyUpdated', 'Role updated'));
            } else {
                const res = await axiosInstance.post('/role/create', result.data);
                savedRoleId.value = res.data.data?.id ?? null;
                savedRoleName.value = res.data.data?.name ?? roleForm.name;
                savedRoleState.value = res.data.data?.state ?? ACTIVE_STATUS;
                toast.success(customizeLanguageData('roleSuccessfullyCreated', 'Role created'));
            }
            roleFormBaseline.value = serializeRoleForm();
            activeTab.value = ROLE_PERMISSION_TAB.ASSIGN_PERMISSIONS;
            return true;
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ?? customizeLanguageData('somethingWentWrong', 'Something went wrong')
            );
            return false;
        } finally {
            isSavingRole.value = false;
        }
    };

    const onSave = async () => {
        if (activeTab.value === ROLE_PERMISSION_TAB.CREATE_ROLE) {
            await saveRole();
        } else if (savedRoleId.value) {
            await permAssign.savePermissions(savedRoleId.value);
            router.push({ name: 'roles' });
        }
    };

    return {
        activeTab,
        isRoleSaved,
        isSavingRole,
        savedRoleId,
        savedRoleName,
        savedRoleState,
        roleForm,
        formErrors,
        isDirty,
        isRoleFormDirty,

        ...permAssign,

        loadExistingRole,
        saveRole,
        onSave
    };
}
