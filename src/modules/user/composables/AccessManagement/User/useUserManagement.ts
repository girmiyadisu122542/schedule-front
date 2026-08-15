import { toast } from 'vue-sonner';
import axiosInstance from '@/api/axiosInstance';
import { computed, watch, ref } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import type { FetchParams, IdAndName } from '@/types/CommonTypes';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { createSharedComposable, useDebounceFn } from '@vueuse/core';
import type { FilterOption } from '@/components/common/MainTable.vue';
import { STATE_ACTIVE, STATE_INACTIVE } from '@/constants/statusOptions';
import type { Role, User } from '@/modules/user/types/AccessManagement/User/UserType';
import type { UserResponse } from '@/modules/user/types/AccessManagement/User/UserType';
import { storeToRefs } from 'pinia';

function userManagementInstance() {
    const allowedRoutesStore = useAllowedRoutesStore();
    const languageStore = useLanguageStore();
    const { translations } = storeToRefs(languageStore) as any;
    const { customizeLanguageData } = languageStore;
    const tableColumns = computed(() => [
        { key: 'name', label: customizeLanguageData('name', 'Name') },
        { key: 'role', label: customizeLanguageData('role', 'Role') },
        { key: 'gender', label: customizeLanguageData('gender', 'Gender') },
        { key: 'national_id', label: customizeLanguageData('nationalId', 'Phone') },
        { key: 'permissions', label: customizeLanguageData('permissions', 'Permissions') },
        { key: 'state', label: customizeLanguageData('state', 'State') }
    ]);

    const importLoading = ref(false);
    const users = ref<UserResponse>();
    const importResult = ref<any>(null);
    const statuses = ref<IdAndName[]>([]);
    const importFile = ref<File | null>(null);

    const limit = ref<number>(10);
    const currentPage = ref<number>(1);
    const selectedUserId = ref<number | null>(null);

    const isLoading = ref<boolean>(false);
    const fetchingUsers = ref<boolean>(false);
    const showImportModal = ref<boolean>(false);
    const forceLogoutPopup = ref<boolean>(false);
    const isUserLogLoading = ref<boolean>(false);
    const showUserLogDialog = ref<boolean>(false);
    const showRegisterModal = ref<boolean>(false);

    const searchQuery = ref<string>('');
    const roles = ref<Role[] | null>(null);
    const filters = ref<Record<string, any>>({});
    const errorMessage = ref<string | null>(null);
    const importFileError = ref<string | null>(null);
    const selectedUserEmail = ref<string | null>(null);
    const selectedFilters = ref<{ field: string; value: any }[]>([]);

    const filterFields = computed<FilterOption[]>(() => {
        return [
            {
                label: customizeLanguageData('state', 'State'),
                key: 'state',
                options: [
                    { label: customizeLanguageData('active', 'Active'), value: STATE_ACTIVE },
                    { label: customizeLanguageData('inactive', 'Inactive'), value: STATE_INACTIVE }
                ]
            },
            {
                label: customizeLanguageData('role', 'Role'),
                key: 'role_id',
                options: roles.value?.map((role) => ({ label: role.name, value: role.id })) || []
            }
        ];
    });

    const onFileChange = () => {
        importFileError.value = null;
        importResult.value = null;
    };

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
                error.response?.data?.message || customizeLanguageData('errorFetchingRoles', 'Error fetching Roles')
            );
        }
    }

    /**
     * Fetch paginated users with optional filters
     */
    async function fetchUsers(params: FetchParams = {}): Promise<void> {
        if (!allowedRoutesStore.can('seeUser')) {
            users.value = undefined;
            return;
        }

        try {
            fetchingUsers.value = true;
            const response = await axiosInstance.get<UserResponse & { statuses: IdAndName[] }>(`/user`, {
                params: {
                    page: params.page ?? currentPage.value,
                    limit: params.perPage ?? limit.value,
                    search: searchQuery.value || undefined,
                    ...filters.value,
                    ...Object.fromEntries(selectedFilters.value.map((filter) => [filter.field, filter.value]))
                }
            });
            users.value = response.data;
            statuses.value = response.data.statuses;
        } catch (error: any) {
            console.error('Error fetching users:>>>>', error);
            errorMessage.value = error.response?.data?.message || 'Error fetching users';
        } finally {
            fetchingUsers.value = false;
        }
    }

    // Force logout
    async function forceLogout(userId: number | null): Promise<void> {
        console.log;
        isLoading.value = true;
        try {
            const response = await axiosInstance.post(`/admin/force-logout/${userId}`);
            console.log(response);
            toast.success(response?.data?.message);
            forceLogoutPopup.value = false;
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message);
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchUsersDropDown(): Promise<void> {
        try {
            fetchingUsers.value = true;
            const response = await axiosInstance.get<UserResponse>(`/user`, {
                params: {
                    page: currentPage.value,
                    search: searchQuery.value || undefined,
                    limit: limit.value,
                    ...Object.fromEntries(selectedFilters.value.map((filter) => [filter.field, filter.value]))
                }
            });

            users.value = response.data;
        } catch (error: any) {
            console.error('Error fetching users for dropdown:', error);
            errorMessage.value = error.response?.data?.message || 'Error fetching users for dropdown';
        } finally {
            fetchingUsers.value = false;
        }
    }

    async function changeUserStatus(userId: number | undefined, statusId: number | null): Promise<void> {
        if (!statusId) {
            return;
        }
        try {
            isLoading.value = true;
            const response = await axiosInstance.put(`/user/change-status/${userId}`, { status: statusId });
            toast.success(response?.data?.message || 'Status changed successfully');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error changing status');
        } finally {
            isLoading.value = false;
        }
    }

    const handleFilterChange = (filterValues: Record<string, any>) => {
        filters.value = filterValues;
        fetchUsers({ page: 1 });
    };

    watch(
        () => languageStore.translations,
        () => {
            fetchUsers();
            fetchRoles();
        }
    );

    const showPermissionsModal = ref<boolean>(false);
    const isLoadingOverrides = ref<boolean>(false);
    const permissionsModalUser = ref<User | null>(null);
    const permissionOverrides = ref<any[]>([]);

    const openUserPermissions = async (user: User) => {
        permissionsModalUser.value = user;
        showPermissionsModal.value = true;
        permissionOverrides.value = [];
        isLoadingOverrides.value = true;
        try {
            const response = await axiosInstance.get(`/user/${user.id}/permission-overrides`);
            permissionOverrides.value = response.data.data ?? [];
        } catch (error: any) {
            toast.error(error.response?.data?.message || customizeLanguageData('somethingWentWrong', 'Error'));
        } finally {
            isLoadingOverrides.value = false;
        }
    };

    const debouncedFetch = useDebounceFn(() => {
        fetchUsers();
    }, 300);

    watch([searchQuery, currentPage, limit], () => {
        debouncedFetch();
    });

    return {
        showUserLogDialog,
        showRegisterModal,
        selectedUserEmail,
        isUserLogLoading,
        forceLogoutPopup,
        selectedFilters,
        showImportModal,
        importFileError,
        selectedUserId,
        importLoading,
        fetchingUsers,
        errorMessage,
        importResult,
        tableColumns,
        filterFields,
        searchQuery,
        currentPage,
        importFile,
        isLoading,
        statuses,
        filters,
        limit,
        users,
        fetchUsers,
        fetchRoles,
        forceLogout,
        onFileChange,
        changeUserStatus,
        fetchUsersDropDown,
        handleFilterChange,
        showPermissionsModal,
        isLoadingOverrides,
        permissionsModalUser,
        permissionOverrides,
        openUserPermissions
    };
}

export const useUserManagement = createSharedComposable(userManagementInstance);
