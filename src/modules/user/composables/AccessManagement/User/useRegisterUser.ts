import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { createSharedComposable } from '@vueuse/core';
import { computed, onMounted, ref, toRaw, watch } from 'vue';

import axiosInstance from '@/api/axiosInstance';
import {
    ACTIVE_STATUS,
    INACTIVE_STATUS,
    TYPE_OBJECT,
    STATUS_INFO,
    STATUS_DANGER,
    STATUS_ACTIVATE,
    STATUS_DEACTIVATE,
    USER_FORM_TAB
} from '@/config/appConfig';
import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import type { AllowedAction } from '@/constants/allowedActions';
import { attachPermissions } from '@/utils/attachPermissionsToParams';
import type { AddressFieldsType, ConfirmState } from '@/types/CommonTypes';
import { validateFormWithZod, normalizeErrors, firstServerError } from '@/utils/errorFormatter';
import { useUserManagement } from '@/modules/user/composables/AccessManagement/User/useUserManagement';
import { useUserRoleBinding } from '@/modules/user/composables/AccessManagement/User/useUserRoleBinding';

import {
    useUserRegistrationSchema,
    type UserRegistrationFields,
    type UserRegistrationSchema
} from '@/modules/user/schemas/AccessManagement/UserRegistrationSchema';
import {
    useUserSchema,
    type userFormField,
    type userSchema
} from '@/modules/user/schemas/AccessManagement/User/MiniUserRegistrationSchema';
import type {
    User,
    UserDetail,
    UserRoleBinding,
    UserPermissionOverride,
    Role
} from '@/modules/user/types/AccessManagement/User/UserType';
import { ACTIVATE, DEACTIVATE, DELETE } from '@/modules/user/constants/fixedValues';

import EyeIcon from '@/assets/icons/EyeIcon.vue';
import EditIcon from '@/assets/icons/EditIcon.vue';
import UsersIcon from '@/assets/icons/UsersIcon.vue';
import UserProfileIcon from '@/assets/icons/UserProfileIcon.vue';
import ActiveToggleIcon from '@/assets/icons/ActiveToggleIcon.vue';
import InactiveToggleIcon from '@/assets/icons/InactiveToggleIcon.vue';
import ShieldCheckAltIcon from '@/assets/icons/ShieldCheckAltIcon.vue';
import UserProfileSetting from '@/assets/icons/UserProfileSetting.vue';
import ShieldProtectedCheckmark from '@/assets/icons/ShieldProtectedCheckmark.vue';
import KeyIcon from '@/assets/icons/KeyIcon.vue';

export interface userType extends UserRegistrationSchema {
    id?: number;
    name?: string;
    username?: string;
    full_name?: string;
    gender_?: string;
    updated_at?: string;
    created_at?: string;
    display_name?: string;
    is_logged_in?: boolean;
    user_id?: number | null;
    email_verified_at?: string | null;
    has_permission_override?: boolean;
}

function registerUserInstance() {
    const router = useRouter();
    const { users } = useUserManagement();
    const languageStore = useLanguageStore();
    const { translations } = storeToRefs(languageStore) as any;
    const { customizeLanguageData } = languageStore;
    const allowedRoutesStore = useAllowedRoutesStore();

    const isLoading = ref<boolean>(false);
    const loadingGender = ref<boolean>(true);
    const showRegisterModal = ref<boolean>(false);
    const showViewProfileModal = ref<boolean>(false);
    const showChangeStatusModal = ref<boolean>(false);
    const showDeleteConfirmModal = ref<boolean>(false);

    const user = ref<User | null>(null);
    const selectedUsers = ref<any[]>([]);
    const roles = ref<Role[] | null>(null);
    const selectedViewUser = ref<User | null>(null);
    const selectedChangeUser = ref<User | null>(null);
    const selectedDeleteUser = ref<User | null>(null);

    const userId = ref<number | null>(null);
    const errors = ref<Record<string, any>>({});
    const userErrors = ref<Record<string, any>>({});
    const selectedStatus = ref<number | null>(null);
    const genderOptions = ref<{ id: number; name: string }[]>([]);

    const addressOptions = ref<AddressFieldsType[]>([]);
    const relationshipOptions = ref<AddressFieldsType[]>([]);
    const emergencyContactFields = ref<AddressFieldsType[]>([]);
    const userForm = ref<userSchema>({
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 1,
        email: '',
        phone: ''
    });

    const userDetailForm = ref<UserDetail>({
        user_id: 0,
        birth_date: '',
        national_id: '',
        phone: '',
        bio: '',
        email: '',
        gender: 1,
        gender_: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        photo: ''
    });

    const roleBindingsForm = ref<UserRoleBinding[]>([]);
    const permissionOverridesForm = ref<UserPermissionOverride[]>([]);

    const form = ref<userType>({
        national_id: '',
        photo: null as unknown as File,
        gender: 1,
        gender_: '',
        phone: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        email: '',
        birth_date: '',
        bio: '',
        mfa_enabled: false
    });

    const serializeUserDetailForm = () =>
        JSON.stringify({
            first_name: form.value.first_name,
            middle_name: form.value.middle_name,
            last_name: form.value.last_name,
            email: form.value.email,
            phone: form.value.phone,
            gender: form.value.gender,
            national_id: form.value.national_id,
            birth_date: form.value.birth_date,
            bio: form.value.bio,
            mfa_enabled: form.value.mfa_enabled
        });

    const userFormBaseline = ref(serializeUserDetailForm());
    const isFormDirty = computed(() => serializeUserDetailForm() !== userFormBaseline.value);

    const confirmState = ref<ConfirmState>({
        show: false,
        title: '',
        message: '',
        type: STATUS_INFO,
        confirmLabel: '',
        loading: false,
        onConfirm: () => {}
    });

    const { userRoleBindingform, selectedUser, assignRoleToUser } = useUserRoleBinding();

    const activeTab = ref<string>(USER_FORM_TAB.USER_DETAIL);
    const photoFile = ref<File | null>(null);

    const breadcrumbItems = computed(() => [
        {
            label: customizeLanguageData('users', 'Users'),
            href: router.resolve({ name: 'UserManagement' }).href,
            clickable: true
        },
        {
            label: form.value.id
                ? customizeLanguageData('editUser', 'Edit User')
                : customizeLanguageData('newUser', 'New User')
        }
    ]);

    const createUserFirstHint = () =>
        customizeLanguageData('createUserFirstToAssign', 'First create the user in order to assign role or permission');

    const tabOptions = computed(() => [
        {
            label: customizeLanguageData('userDetail', 'User Detail'),
            value: USER_FORM_TAB.USER_DETAIL,
            icon: UsersIcon
        },
        {
            label: customizeLanguageData('assignRole', 'Assign Role'),
            value: USER_FORM_TAB.ASSIGN_ROLE,
            disabled: !user.value,
            tooltip: !user.value ? createUserFirstHint() : undefined,
            icon: UserProfileIcon
        },
        {
            label: customizeLanguageData('grantPermissions', 'Grant Permissions'),
            value: USER_FORM_TAB.ASSIGN_PERMISSION,
            disabled: !user.value,
            tooltip: !user.value ? createUserFirstHint() : undefined,
            icon: KeyIcon
        },
        {
            label: customizeLanguageData('assignedPermissions', 'Assigned Permissions'),
            value: USER_FORM_TAB.ASSIGNED_PERMISSIONS,
            disabled: !user.value,
            tooltip: !user.value ? createUserFirstHint() : undefined,
            icon: ShieldProtectedCheckmark
        }
    ]);

    function clearError(field: string) {
        if (userErrors.value && userErrors.value[field]) {
            delete userErrors.value[field];
        }
        if (errors.value && errors.value[field]) {
            delete errors.value[field];
        }
    }

    function resetUserForm() {
        userErrors.value = {};

        userForm.value = {
            first_name: '',
            middle_name: '',
            last_name: '',
            gender: 1,
            email: '',
            phone: ''
        };
    }

    function resetForm() {
        errors.value = {};

        form.value = {
            national_id: '',
            photo: null as unknown as File,
            gender: 1,
            phone: '',
            last_name: '',
            first_name: '',
            middle_name: '',
            email: '',
            birth_date: '',
            bio: '',
            mfa_enabled: false
        };
    }

    async function fetchGenders(actions: AllowedAction[]) {
        loadingGender.value = true;
        try {
            const res = await axiosInstance.get('/constants/gender', {
                params: {
                    permissions: attachPermissions(actions)
                }
            });

            genderOptions.value = res.data.gender || [];
        } catch {
        } finally {
            loadingGender.value = false;
        }
    }

    async function fetchRoles() {
        try {
            const res = await axiosInstance.get('/role', {
                params: {
                    dropdown: true
                }
            });
            roles.value = res.data.data || null;
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || customizeLanguageData('errorFetchingRoles', 'Error updating status')
            );
        }
    }

    async function handleSubmit(emit?: (event: string, user?: any) => void) {
        errors.value = {};

        const error = validateFormWithZod<UserRegistrationFields>(useUserRegistrationSchema.value, form.value);

        if (error) {
            errors.value = error;
            return false;
        }

        isLoading.value = true;

        try {
            const formData = new FormData();

            function appendFormData(formData: FormData, key: string, value: any) {
                if (value === undefined || value === null) return;

                const raw = toRaw(value);

                if (raw instanceof File || raw instanceof Blob) {
                    formData.append(key, raw);
                } else if (Array.isArray(raw)) {
                    raw.forEach((item, index) => {
                        appendFormData(formData, `${key}[${index}]`, item);
                    });
                } else if (typeof raw === TYPE_OBJECT) {
                    Object.entries(raw).forEach(([childKey, childValue]) => {
                        appendFormData(formData, `${key}[${childKey}]`, childValue);
                    });
                } else {
                    formData.append(key, String(raw));
                }
            }

            const rawForm = toRaw(form.value);

            Object.entries(rawForm).forEach(([key, value]) => {
                if (value === undefined || value === null) return;

                const rawValue = toRaw(value);

                if (rawValue instanceof File || rawValue instanceof Blob) {
                    console.log('Appending File:', rawValue);
                    formData.append(key, rawValue);
                } else if (typeof rawValue === TYPE_OBJECT) {
                    appendFormData(formData, key, rawValue);
                } else {
                    formData.append(key, String(rawValue));
                }
            });

            const isUpdate = !!form.value.id;

            const response = await axiosInstance.post('/user/create-new', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const savedUser = response.data.data;

            if (isUpdate) {
                if (users.value?.data) {
                    const index = users.value.data.findIndex((existing: User) => existing.id === savedUser.id);
                    if (index !== -1) users.value.data[index] = savedUser;
                }
            } else {
                users.value?.data.unshift(savedUser);
            }

            user.value = savedUser;
            if (savedUser.id) {
                await fetchUserForEdit(savedUser.id);
            }

            toast.success(
                response.data.message ||
                    (isUpdate
                        ? customizeLanguageData('userUpdatedSuccessfully', 'User updated successfully')
                        : customizeLanguageData('userRegisteredSuccessfully', 'User registered successfully'))
            );

            if (emit) emit('success');

            return true;
        } catch (error: any) {
            if (error.response?.data?.errors) {
                errors.value = normalizeErrors<UserRegistrationFields>(error.response.data.errors);
            } else {
                toast.error(
                    firstServerError(error) || customizeLanguageData('somethingWentWrong', 'Registration failed')
                );
            }
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function handleUserFormSubmit() {
        userErrors.value = {};
        const error = validateFormWithZod<userFormField>(useUserSchema.value, userForm.value);
        if (error) {
            userErrors.value = error;
            return;
        }

        isLoading.value = true;
        try {
            const response = await axiosInstance.post('/user/create-new', userForm.value);
            users.value?.data.unshift(response.data.data);
            toast.success(
                response.data.message ||
                    customizeLanguageData('userRegisteredSuccessfully', 'User registered successfully')
            );
        } catch (error: any) {
            if (error.response?.data?.errors) {
                userErrors.value = normalizeErrors<userFormField>(error.response.data.errors);
            } else {
                toast.error(
                    firstServerError(error) || customizeLanguageData('somethingWentWrong', 'Registration failed')
                );
            }
        } finally {
            isLoading.value = false;
        }

        if (shouldCloseMiniUserModal()) {
            showRegisterModal.value = false;
            resetUserForm();
        }
    }

    const handleFormSubmit = async (data: any): Promise<boolean> => {
        form.value = { ...form.value, ...data.user };
        form.value.photo = data.photoFile ? toRaw(data.photoFile) : null;
        return await handleSubmit();
    };

    const handleCancel = () => {
        router.push({ name: 'UserManagement' });
    };

    const fetchUserForEdit = async (userId: number) => {
        if (!userId) {
            return;
        }
        try {
            isLoading.value = true;
            const response = await axiosInstance.get(`/user/`, {
                params: {
                    id: userId
                }
            });
            const userData = response.data.data;

            if (userData.length > 0) {
                form.value = {
                    ...form.value,
                    id: userData[0].id,
                    first_name: userData[0].detail.first_name || '',
                    middle_name: userData[0].detail.middle_name || '',
                    last_name: userData[0].detail.last_name || '',
                    email: userData[0].email || '',
                    phone: userData[0].phone || '',
                    username: userData[0].username || '',
                    full_name: userData[0].full_name || '',
                    gender: userData[0].detail.gender || 1,
                    gender_: userData[0].detail.gender_ || '',
                    national_id: userData[0].detail.national_id || '',
                    birth_date: userData[0].detail.birth_date || '',
                    photo: userData[0].photo || userData[0].detail.photo || '',
                    mfa_enabled: userData[0].detail.mfa_enabled || false,
                    bio: userData[0].detail.bio || ''
                };
                user.value = userData[0];
                if (userData[0].detail) {
                    userDetailForm.value = {
                        user_id: userData[0].id,
                        birth_date: userData[0].detail.birth_date || '',
                        national_id: userData[0].detail.national_id || '',
                        phone: userData[0].detail.phone || '',
                        bio: userData[0].detail.bio || '',

                        email: userData[0].email || '',
                        gender: userData[0].gender || 1,
                        gender_: userData[0].gender_ || '',
                        first_name: userData[0].detail.first_name || '',
                        middle_name: userData[0].detail.middle_name || '',
                        last_name: userData[0].detail.last_name || '',
                        photo: userData[0].photo || userData[0].detail.photo || ''
                    };
                }
            }

            userFormBaseline.value = serializeUserDetailForm();

            roleBindingsForm.value = [];
            permissionOverridesForm.value = [];
        } catch (error: any) {
            console.error('Error fetching user for edit:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch user data');
        } finally {
            isLoading.value = false;
        }
    };

    const clearChanges = async () => {
        if (form.value.id) {
            await fetchUserForEdit(Number(form.value.id));
        } else {
            resetForm();
            userFormBaseline.value = serializeUserDetailForm();
        }
    };

    async function deleteUser(userId: number): Promise<void> {
        isLoading.value = true;
        try {
            const response = await axiosInstance.delete(`/user/destroy/${userId}`);
            if (users.value?.data) {
                users.value.data = users.value.data.filter((existing: User) => existing.id !== userId);
            }
            toast.success(response.data?.message || 'User deleted successfully');
            showDeleteConfirmModal.value = false;
            selectedDeleteUser.value = null;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            isLoading.value = false;
        }
    }

    const getActionOptions = (item: any) => {
        const options: any[] = [
            {
                label: customizeLanguageData('view', 'View'),
                icon: EyeIcon,
                onClick: () => {
                    selectedViewUser.value = item;
                    showViewProfileModal.value = true;
                }
            }
        ];

        if (allowedRoutesStore.can('updateUser')) {
            options.push({
                label: customizeLanguageData('edit', 'Edit'),
                icon: EditIcon,
                onClick: () => {
                    localStorage.setItem('selectedUser', JSON.stringify(item));
                    router.push({ name: 'AddUser', query: { edit: item.id } });
                }
            });
        }

        if (allowedRoutesStore.can('assignRoleToUser')) {
            options.push({
                label: customizeLanguageData('assignRole', 'Assign Role'),
                icon: UserProfileSetting,
                onClick: () => {
                    localStorage.setItem('selectedUser', JSON.stringify(item));
                    router.push({ name: 'AddUser', query: { edit: item.id, tab: USER_FORM_TAB.ASSIGN_ROLE } });
                }
            });
        }

        if (allowedRoutesStore.can('assignPermissionToUser')) {
            options.push({
                label: customizeLanguageData('managePermission', 'Manage Permission'),
                icon: ShieldCheckAltIcon,
                onClick: () => {
                    localStorage.setItem('selectedUser', JSON.stringify(item));
                    router.push({ name: 'AddUser', query: { edit: item.id, tab: USER_FORM_TAB.ASSIGN_PERMISSION } });
                }
            });
        }

        if (allowedRoutesStore.can('changeUserState')) {
            options.push({
                label:
                    item.state === ACTIVE_STATUS
                        ? customizeLanguageData('deactivate')
                        : customizeLanguageData('activate', 'activate'),
                icon: item.state === ACTIVE_STATUS ? InactiveToggleIcon : ActiveToggleIcon,
                onClick: () => initiateToggleState(item)
            });
        }

        return options;
    };

    const initiateDelete = (item: User) => {
        if (!item.id) {
            return;
        }
        selectedUser.value = item;

        confirmState.value = {
            show: true,
            title: `${customizeLanguageData('deleteConfirmTitle')}`,
            message: `${customizeLanguageData('deleteConfirmMessage')} ${item.name}?`,
            type: STATUS_DANGER,
            confirmLabel: customizeLanguageData('delete', 'Delete'),
            loading: false,
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    item.id && (await deleteUser(item.id));
                    toast.success(customizeLanguageData('deletedSuccessfully'));
                    confirmState.value.show = false;
                } catch (error) {
                    toast.error(customizeLanguageData('errorDeleting'));
                    confirmState.value.show = false;
                } finally {
                    confirmState.value.loading = false;
                }
            }
        };
    };

    const initiateToggleState = (item: User) => {
        if (!item.id) {
            return;
        }
        const userId = item.id;
        selectedUser.value = item;
        const isActivating = item.state !== ACTIVE_STATUS;
        confirmState.value = {
            show: true,
            title: isActivating
                ? `${customizeLanguageData('activate', 'Activate')} ${customizeLanguageData('user', 'User')}`
                : `${customizeLanguageData('deactivate', 'Deactivate')} ${customizeLanguageData('user', 'User')}`,
            message: isActivating
                ? `${customizeLanguageData('areYouSureYouWantTo', 'Are you sure you want to')} ${customizeLanguageData('activate', 'Activate')} ${item.full_name}?`
                : `${customizeLanguageData('areYouSureYouWantTo', 'Are you sure you want to')} ${customizeLanguageData('deactivate', 'Deactivate')}  ${item.full_name}?`,
            type: isActivating ? STATUS_ACTIVATE : STATUS_DEACTIVATE,
            confirmLabel: isActivating
                ? customizeLanguageData('activate', 'Activate')
                : customizeLanguageData('deactivate', 'Deactivate'),
            loading: false,
            statusTransition: isActivating
                ? {
                      from: customizeLanguageData('deactivate', 'Deactivate'),
                      to: customizeLanguageData('activate', 'Activate')
                  }
                : {
                      from: customizeLanguageData('activate', 'Activate'),
                      to: customizeLanguageData('deactivate', 'Deactivate')
                  },
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    await toggleUserState(userId);
                    confirmState.value.show = false;
                } catch (error) {
                    confirmState.value.show = false;
                } finally {
                    confirmState.value.loading = false;
                }
            }
        };
    };

    function shouldCloseMiniUserModal() {
        return !userErrors.value || Object.keys(userErrors.value).length === 0;
    }

    function shouldCloseModal() {
        return !errors.value || Object.keys(errors.value).length === 0;
    }

    const handleUserUpdate = (user: User) => {
        if (user.first_name !== undefined) form.value.first_name = user.first_name;
        if (user.middle_name !== undefined) form.value.middle_name = user.middle_name;
        if (user.last_name !== undefined) form.value.last_name = user.last_name;
        if (user.email !== undefined) form.value.email = user.email;
        if (user.phone !== undefined) form.value.phone = user.phone;
        if (user.username !== undefined) form.value.username = user.username;
        if (user.full_name !== undefined) form.value.full_name = user.full_name;
        if (user.photo !== undefined) form.value.photo = user.photo as any;
        if (user.gender !== undefined) form.value.gender = user.gender;
    };

    const handleUserDetailUpdate = (userDetail: UserDetail) => {
        userDetailForm.value = { ...userDetail };
        if (userDetail.birth_date !== undefined) form.value.birth_date = userDetail.birth_date;
        if (userDetail.national_id !== undefined) form.value.national_id = userDetail.national_id;
        if (userDetail.bio !== undefined) form.value.bio = userDetail.bio;
    };

    const handlePhotoFileUpdate = (file: File | null) => {
        photoFile.value = file;
    };

    const handleVerifyNationalId = (nationalId: string) => {
        console.log('Verifying national ID:', nationalId);
        // Call API here
    };

    const submitForm = async () => {
        if (activeTab.value === USER_FORM_TAB.USER_DETAIL) {
            const data = {
                user: form.value,
                userDetail: userDetailForm.value,
                roleBindings: roleBindingsForm.value,
                permissionOverrides: permissionOverridesForm.value,
                photoFile: photoFile.value
            };
            const success = await handleFormSubmit(data);
            if (success) activeTab.value = USER_FORM_TAB.ASSIGN_ROLE;
        } else if (activeTab.value === USER_FORM_TAB.ASSIGN_ROLE) {
            if (user.value?.id) {
                selectedUser.value = user.value;

                try {
                    await assignRoleToUser(user.value.id, userRoleBindingform);
                    activeTab.value = USER_FORM_TAB.ASSIGN_PERMISSION;
                } catch {}
            }
        } else if (activeTab.value === USER_FORM_TAB.ASSIGN_PERMISSION) {
            router.push({ name: 'UserManagement' });
        }
    };

    const handleAddUser = () => {
        form.value = { ...form.value, first_name: userForm.value.first_name, middle_name: userForm.value.middle_name };
        localStorage.setItem('userDetailForm', JSON.stringify(userForm.value));
        router.push({ name: 'AddUser' });
    };

    /**
     * Close the quick-view modal and open the user's full detail (User Detail tab).
     */
    const openUserFullDetail = (user: User) => {
        if (!user?.id) return;
        localStorage.setItem('selectedUser', JSON.stringify(user));
        showViewProfileModal.value = false;
        router.push({ name: 'AddUser', query: { edit: user.id } });
    };

    /**
     * Toggle a user’s state (Active / Inactive)
     */
    async function toggleUserState(userId: number): Promise<void> {
        try {
            const user = (users.value as any).data.find((item: User) => item.id === userId);
            const newState = user.state === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;

            const response = await axiosInstance.put(`/user/change-state/${userId}`, { state: newState });

            const updatedUser: User = response.data.data;
            const index = (users.value as any).data.findIndex((item: User) => item.id === userId);
            if (index !== -1) {
                (users.value as any).data[index] = updatedUser;
            }

            toast.success(response.data.message);
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message);
        }
    }

    async function handleBulkAction(selectedItems: User[], action_type: string, onSuccess?: () => void): Promise<void> {
        const user_ids = selectedItems.map((item) => item.id).filter((id) => id !== undefined) as number[];

        if (user_ids.length === 0) return;

        try {
            const response = await axiosInstance.post('/user/bulk-action', {
                user_ids,
                action_type
            });

            toast.success(response.data.message);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Bulk action failed');
        }
    }

    const initiateBulkAction = (selectedItems: User[], actionType: string, onSuccess?: () => void) => {
        if (selectedItems.length === 0) return;

        let title = '';
        let message = '';
        let confirmLabel = '';
        let type: ConfirmState['type'] = STATUS_INFO;
        const userCount = selectedItems.length;

        switch (actionType) {
            case ACTIVATE:
                title = `${customizeLanguageData('activate', 'Activate')} ${customizeLanguageData('users', 'Users')}`;
                message = `${customizeLanguageData('areYouSureYouWantTo', 'Are you sure you want to')} ${customizeLanguageData('activate', 'Activate')} ${userCount} ${customizeLanguageData('users', 'users')}?`;
                type = STATUS_ACTIVATE;
                confirmLabel = customizeLanguageData('activate', 'Activate');
                break;
            case DEACTIVATE:
                title = `${customizeLanguageData('deactivate', 'Deactivate')} ${customizeLanguageData('users', 'Users')}`;
                message = `${customizeLanguageData('areYouSureYouWantTo', 'Are you sure you want to')} ${customizeLanguageData('deactivate', 'Deactivate')} ${userCount} ${customizeLanguageData('users', 'users')}?`;
                type = STATUS_DEACTIVATE;
                confirmLabel = customizeLanguageData('deactivate', 'Deactivate');
                break;
            case DELETE:
                title = customizeLanguageData('deleteConfirmTitle', 'Delete Confirmation');
                message = `${customizeLanguageData('deleteConfirmMessage', 'Are you sure you want to delete')} ${userCount} ${customizeLanguageData('users', 'users')}?`;
                type = STATUS_DANGER;
                confirmLabel = customizeLanguageData('delete', 'Delete');
                break;
        }

        confirmState.value = {
            show: true,
            title,
            message,
            type,
            confirmLabel,
            loading: false,
            onConfirm: async () => {
                confirmState.value.loading = true;
                try {
                    await handleBulkAction(selectedItems, actionType, onSuccess);
                    confirmState.value.show = false;
                } catch (error) {
                    confirmState.value.show = false;
                } finally {
                    confirmState.value.loading = false;
                }
            }
        };
    };

    function getBulkActions(selectedUsers: User[], onSuccess?: () => void) {
        const actions: any[] = [];
        const hasActive = selectedUsers.some((user) => user.state === ACTIVE_STATUS);
        const hasInactive = selectedUsers.some((user) => user.state !== ACTIVE_STATUS);

        if (hasInactive) {
            actions.push({
                label: customizeLanguageData('activate', 'Activate'),
                icon: ActiveToggleIcon,
                onClick: (items: User[]) => initiateBulkAction(items, ACTIVATE, onSuccess)
            });
        }

        if (hasActive) {
            actions.push({
                label: customizeLanguageData('deactivate', 'Deactivate'),
                icon: InactiveToggleIcon,
                onClick: (items: User[]) => initiateBulkAction(items, DEACTIVATE, onSuccess)
            });
        }

        return actions;
    }

    watch(
        () => languageStore.translations,
        async () => {
            fetchGenders(['seeUser', 'createUser']);
            errors.value = {};
            await fetchUserForEdit(Number(user.value?.id));
        }
    );

    watch(
        () => userId,
        async (newId) => {
            if (newId) {
                await fetchUserForEdit(Number(newId));
            }
        },
        { immediate: true }
    );

    onMounted(async () => {
        fetchGenders(['seeUser', 'createUser']);
        const item = localStorage.getItem('userDetailForm');
        const selectedUser = localStorage.getItem('selectedUser');

        if (item) {
            form.value = { ...form.value, ...JSON.parse(item) };
            localStorage.removeItem('userDetailForm');
        }

        if (selectedUser) {
            user.value = { ...user.value, ...JSON.parse(selectedUser) };
            localStorage.removeItem('selectedUser');
        }
    });

    return {
        showRegisterModal,
        breadcrumbItems,
        isFormDirty,
        userErrors,
        tabOptions,
        activeTab,
        photoFile,
        userForm,
        submitForm,
        resetUserForm,
        handleUserUpdate,
        handleUserFormSubmit,
        handlePhotoFileUpdate,
        handleUserDetailUpdate,
        handleVerifyNationalId,
        shouldCloseMiniUserModal,

        permissionOverridesForm,
        showDeleteConfirmModal,
        emergencyContactFields,
        showChangeStatusModal,
        showViewProfileModal,
        relationshipOptions,
        selectedChangeUser,
        selectedDeleteUser,
        roleBindingsForm,
        selectedViewUser,
        userDetailForm,
        selectedStatus,
        addressOptions,
        loadingGender,
        genderOptions,
        selectedUsers,
        confirmState,
        isLoading,
        errors,
        roles,
        user,
        form,
        resetForm,
        clearChanges,
        deleteUser,
        clearError,
        handleSubmit,
        fetchGenders,
        handleCancel,
        handleAddUser,
        openUserFullDetail,
        getBulkActions,
        shouldCloseModal,
        handleFormSubmit,
        getActionOptions,
        fetchUserForEdit,
        handleBulkAction,
        initiateBulkAction,
        initiateToggleState
    };
}

export const useRegisterUser = createSharedComposable(registerUserInstance);
