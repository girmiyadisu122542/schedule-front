import { toast } from 'vue-sonner';
import { reactive, ref, watch, computed } from 'vue';
import axiosInstance from '@/api/axiosInstance';

import type { User } from '@/modules/user/types/AccessManagement/User/UserType';
import type { Role as UserRole } from '@/modules/user/types/AccessManagement/User/UserType';
import { firstServerError, normalizeErrors, validateFormWithZod, type NormalizedErrors } from '@/utils/errorFormatter';

const todayDateString = (): string => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

import type {
    AssignRolePayload,
    FetchedRolesResponse,
    FetchedUserRoleBindingResponse
} from '@/modules/user/types/AccessManagement/User/userRoleBindingType';
import {
    userRoleBindingSchema,
    type UserRoleBinding,
    type UserRoleBindingFields
} from '@/modules/user/schemas/AccessManagement/User/userRoleBindingSchema';
import type { Role } from '@/modules/user/types/AccessManagement/role';
import { useUserActivation } from '@/modules/user/composables/AccessManagement/User/useUserActivation';

const isLoading = ref<boolean>(false);
const isAssigned = ref<boolean>(false);
const isAssigning = ref<boolean>(false);
const isRoleLoading = ref<boolean>(false);
const isChildrenLoading = ref<boolean>(false);
const showUserDetailView = ref<boolean>(false);
const showRoleTreeDialog = ref<boolean>(false);
const isRoleBindingModalOpen = ref<boolean>(false);
const showUserRoleRevocationDialog = ref<boolean>(false);

const roles = ref<Role[]>();
const errorMessage = ref<string>('');
const selectedUser = ref<User | null>(null);
const selectedUserRoleId = ref<number | null>(null);
const userRoleBindingToDelete = ref<UserRole | null>(null);
const validationErrors = ref<NormalizedErrors<UserRoleBindingFields>>({});

const userRoleBindingform = reactive<AssignRolePayload>({
    role_id: null as unknown as number,
    starts_at: todayDateString(),
    ends_at: null
});

const isRoleBindingDirty = computed(() => !!userRoleBindingform.role_id);

const clearRoleBindingForm = () => {
    userRoleBindingform.role_id = null as unknown as number;
    userRoleBindingform.starts_at = todayDateString();
    userRoleBindingform.ends_at = null;
};

export function useUserRoleBinding() {
    const { ensureUserActive } = useUserActivation();

    const assignRoleToUser = async (userId: number, payload: AssignRolePayload) => {
        const errors = validateFormWithZod<UserRoleBindingFields>(userRoleBindingSchema.value, userRoleBindingform);
        validationErrors.value = {};
        if (errors) {
            validationErrors.value = errors;
            return;
        }

        const isActive = await ensureUserActive(selectedUser.value);
        if (!isActive) return;

        const payloadToSend: Record<string, any> = {};
        Object.entries(payload).forEach(([key, value]) => {
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
            isAssigning.value = true;
            errorMessage.value = '';
            const response = await axiosInstance.post(`/user/${userId}/assign-role`, payloadToSend);
            isAssigned.value = true;
            showRoleTreeDialog.value = false;
            clearRoleBindingForm();
            toast.success(response.data.message || 'Role assigned to user successfully');
        } catch (error: any) {
            if (error.response?.data?.errors) {
                validationErrors.value = normalizeErrors<UserRoleBindingFields>(error.response.data.errors);
            }
            errorMessage.value = firstServerError(error) || 'Unable to assign role to user';
            toast.error(errorMessage.value);
            throw error;
        } finally {
            isAssigning.value = false;
        }
    };

    const fetchRoles = async () => {
        try {
            isRoleLoading.value = true;
            errorMessage.value = '';
            resetFormData('role');
            const response = await axiosInstance.get<FetchedRolesResponse>('/role', {
                params: {
                    user_id: selectedUser.value?.id,
                    user_roles: selectedUser.value?.roles?.map((role) => role.id),
                    dropdown: true
                }
            });
            roles.value = response.data.data;
        } catch (error: any) {
            errorMessage.value = error.response?.data?.message || error.message || 'Unable to fetch constants';
            toast.error(errorMessage.value);
            throw error;
        } finally {
            isRoleLoading.value = false;
        }
    };

    const fetchUserRoleBinding = async (roleId: number) => {
        try {
            isLoading.value = true;
            errorMessage.value = '';
            selectedUserRoleId.value = roleId;
            openUserRoleBinding(selectedUser.value as User);
            const response = await axiosInstance.get<FetchedUserRoleBindingResponse>(
                `/user/role-binding/${roleId}`,
                {}
            );
            Object.assign(userRoleBindingform, {
                role_id: response.data.form.role_id,
                starts_at: response.data.form.starts_at
                    ? new Date(response.data.form.starts_at).toISOString().slice(0, 10)
                    : todayDateString(),
                ends_at: response.data.form.ends_at
                    ? new Date(response.data.form.ends_at).toISOString().slice(0, 10)
                    : null
            });
            if (response.data.roles) roles.value = response.data.roles;
        } catch (error: any) {
            errorMessage.value = error.response?.data?.message || error.message || 'Unable to fetch user role bindings';
            toast.error(errorMessage.value);
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    const closeModal = () => {
        isRoleBindingModalOpen.value = false;
        selectedUser.value = null;
        selectedUserRoleId.value = null;
    };

    const openUserRoleBinding = (user: User) => {
        selectedUser.value = user;
        isRoleBindingModalOpen.value = true;
    };
    const resetFormData = (level: 'role' | 'entityCode' | 'all' = 'role') => {
        if (level === 'all') {
            userRoleBindingform.role_id = null as unknown as number;
            userRoleBindingform.starts_at = todayDateString();
            userRoleBindingform.ends_at = null;
        }
        validationErrors.value = {};
    };

    const openUserRoleRevocationDialog = (role: UserRole) => {
        showUserRoleRevocationDialog.value = true;
        userRoleBindingToDelete.value = role;
    };

    const openRoleTreeDialog = (user: User) => {
        selectedUser.value = null;
        selectedUser.value = user;
        showRoleTreeDialog.value = true;
    };

    return {
        isRoleBindingDirty,
        clearRoleBindingForm,
        showUserRoleRevocationDialog,
        userRoleBindingToDelete,
        isRoleBindingModalOpen,
        userRoleBindingform,
        showRoleTreeDialog,
        showUserDetailView,
        isChildrenLoading,
        validationErrors,
        isRoleLoading,
        selectedUser,
        errorMessage,
        isAssigning,
        isAssigned,
        isLoading,
        roles,
        fetchRoles,
        closeModal,
        resetFormData,
        assignRoleToUser,
        openRoleTreeDialog,
        openUserRoleBinding,
        fetchUserRoleBinding,
        openUserRoleRevocationDialog
    };
}

export function useUserRoleBindings(
    props: {
        roleBindings: UserRoleBinding[];
        availableRoles: Role[];
        userId?: number;
    },
    emit: any
) {
    const roleBindingsForm = ref<UserRoleBinding[]>([...props.roleBindings]);

    watch(
        () => props.roleBindings,
        (val) => {
            roleBindingsForm.value = [...val];
        }
    );

    const removeRoleBinding = (index: number) => {
        roleBindingsForm.value.splice(index, 1);
        emit('update:roleBindings', roleBindingsForm.value);
    };

    const updateRoleBinding = (index: number, updates: Partial<UserRoleBinding>) => {
        roleBindingsForm.value[index] = {
            ...roleBindingsForm.value[index],
            ...updates
        } as UserRoleBinding;

        emit('update:roleBindings', roleBindingsForm.value);
    };

    const getRoleById = (roleId: number) => {
        return props.availableRoles.find((role) => role.id === roleId);
    };

    const getRoleDescendants = (roleId: number) => {
        const role = getRoleById(roleId);
        return role || [];
        // return role?.descendants || [];
    };

    return {
        roleBindingsForm,
        getRoleById,
        removeRoleBinding,
        updateRoleBinding,
        getRoleDescendants
    };
}
