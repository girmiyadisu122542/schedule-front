<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { STATE_INACTIVE } from '@/constants/statusOptions';
import { useCommonData } from '@/composables/common/useCommonData';
import { useRegisterUser } from '@/modules/user/composables/AccessManagement/User/useRegisterUser';
import { useUserManagement } from '@/modules/user/composables/AccessManagement/User/useUserManagement';
import { useUserRoleBinding } from '@/modules/user/composables/AccessManagement/User/useUserRoleBinding';
import type { User } from '@/modules/user/types/AccessManagement/User/UserType';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MonitorIcon from '@/assets/icons/MonitorIcon.vue';
import CopyIcon from '@/assets/icons/CopyIcon.vue';
import ExpandIcon from '@/assets/icons/ExpandIcon.vue';
import MainTable from '@/components/common/MainTable.vue';
import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

import UserHeader from '@/modules/user/components/AccessManagement/Users/UserHeader.vue';
import MiniUserForm from '@/modules/user/components/AccessManagement/Users/MiniUserForm.vue';
import RoleTreeDialog from '@/modules/user/components/AccessManagement/Role/RoleTreeDialog.vue';
import UserRoleBindingForm from '@/modules/user/components/AccessManagement/Users/UserRoleBindingForm.vue';
import UserProfileCard from '@/modules/user/components/AccessManagement/Users/UserProfileCard.vue';
import UserPermissionsDialog from '@/modules/user/components/AccessManagement/Users/UserPermissionsDialog.vue';

const {
    selectedUser,
    openRoleTreeDialog,
    fetchUserRoleBinding,
    openUserRoleRevocationDialog,
    isRoleBindingModalOpen,
    showRoleTreeDialog,
    assignRoleToUser,
    userRoleBindingform,
    isAssigning
} = useUserRoleBinding();
const {
    forceLogoutPopup,
    selectedUserId,
    fetchingUsers,
    tableColumns,
    filterFields,
    searchQuery,
    users,
    fetchUsers,
    fetchRoles,
    forceLogout,
    handleFilterChange,
    showPermissionsModal,
    isLoadingOverrides,
    permissionsModalUser,
    permissionOverrides,
    openUserPermissions
} = useUserManagement();

const { toastMessage, showToast, copy } = useCommonData();
const {
    showViewProfileModal,
    showRegisterModal,
    selectedViewUser,
    selectedUsers,
    confirmState,
    handleAddUser,
    getBulkActions,
    getActionOptions,
    openUserFullDetail,
    handleUserFormSubmit,
    resetUserForm,
    // Aliased because useUserManagement exposes an `isLoading` of its own.
    isLoading: isSavingUser
} = useRegisterUser();

const openRegisterModal = () => {
    resetUserForm();
    showRegisterModal.value = true;
};

const onRegisterModalVisibility = (visible: boolean) => {
    showRegisterModal.value = visible;
    if (!visible) resetUserForm();
};

const saveRoleBinding = () => {
    if (selectedUser.value?.id) {
        assignRoleToUser(selectedUser.value.id, userRoleBindingform);
    }
};

onMounted(() => {
    fetchUsers();
    fetchRoles();
});
</script>
<template>
    <div class="flex flex-col text-black dark:text-white">
        <div class="pb-6">
            <Breadcrumb
                :items="[{ label: $lang.userManagement || 'User Management' }]"
                :icon="MonitorIcon" />
        </div>
        <MainTable
            :columns="tableColumns"
            :items="users && users.data ? users : { data: [], pagination: null }"
            :loading="fetchingUsers"
            :total-entries="null"
            :selectable="true"
            :bulk-actions="getBulkActions(selectedUsers, fetchUsers)"
            :title="$lang.manageUser || 'Manage User'"
            :subtitle="$lang.manageUsersAndTheirInformation || 'Configure and manage Users.'"
            :filter-fields="filterFields"
            :server-side-filter="true"
            :show-refresh="true"
            @refresh="fetchUsers"
            :search-placeholder="$lang.searchUsers || 'Search users...'"
            @filter-change="handleFilterChange"
            @search="(val) => (searchQuery = val)"
            @selection-change="(users) => (selectedUsers = users)"
            @update:currentPage="(page) => fetchUsers({ page })"
            @update:limit="(val) => fetchUsers({ perPage: val })"
            :add-button-label="$lang.createUser || 'Create User'"
            :show-add-button="$can('createUser')"
            @add="openRegisterModal">
            <template #cell-name="{ item }">
                <div class="flex items-center gap-2">
                    <UserHeader
                        cssClass="bg-transparent"
                        :photo="item.photo"
                        :full_name="item.full_name"
                        :email="item.email" />
                </div>
            </template>

            <template #cell-role="{ item }">
                <div
                    v-if="item.roles?.length > 0"
                    class="flex items-center gap-2">
                    <span class="dark:text-text-secondary text-gray-800">{{ item.roles[0].name }}</span>
                    <button
                        v-if="item.roles.length > 1"
                        @click="openRoleTreeDialog(item as User)"
                        class="text-schedule-brand-blue hover:text-schedule-brand-blue-subtle cursor-pointer dark:text-blue-400 dark:hover:text-blue-300">
                        +{{ item.roles.length - 1 }}
                    </button>
                </div>
                <span
                    v-else
                    class="text-gray-400">
                    -
                </span>
            </template>

            <template #cell-gender="{ item }">
                <span class="dark:text-text-secondary text-gray-600">{{ item.detail?.gender_ || '-' }}</span>
            </template>

            <template #cell-national_id="{ item }">
                <div class="flex items-center gap-2">
                    <p class="dark:text-text-secondary text-sm font-normal text-gray-600">
                        {{ item.detail?.national_id || '-' }}
                    </p>
                    <MainButton
                        v-if="item.detail?.national_id"
                        ghost
                        @click="copy(item.detail?.national_id)"
                        :icon="CopyIcon"
                        class="dark:text-text-tertiary dark:hover:text-text-secondary text-gray-400 hover:text-gray-600" />
                </div>
            </template>

            <template #cell-birth_date="{ item }">
                <div class="dark:text-text-secondary flex items-center gap-1.5 text-sm font-normal text-gray-600">
                    <span>{{ item.detail?.birth_date || '-' }}</span>
                </div>
            </template>

            <template #cell-permissions="{ item }">
                <div class="whitespace-nowrap">
                    <Badge
                        clickable
                        outlined
                        variant="primary"
                        :label="`${item.permission_overrides_count ?? 0} ${$lang.permissions || 'Permissions'}`"
                        @click="openUserPermissions(item as User)" />
                </div>
            </template>

            <template #cell-state="{ item }">
                <Badge
                    outlined
                    :variant="item.state === STATE_INACTIVE ? 'light' : 'success'"
                    :label="item.state === STATE_INACTIVE ? $lang.inactive || 'Inactive' : $lang.active || 'Active'" />
            </template>

            <template #action="{ item }">
                <ActionMenu
                    :options="getActionOptions(item)"
                    :cssClass="'bg-gray-100 dark:bg-surface-card hover:bg-gray-200 dark:hover:bg-surface-hover'"
                    :hasFooter="true" />
            </template>
        </MainTable>

        <transition name="fade">
            <div
                v-if="showToast"
                class="absolute right-4 bottom-4 rounded-lg bg-gray-900 px-4 py-2 text-xs text-white shadow-lg">
                {{ toastMessage }}
            </div>
        </transition>
    </div>

    <MainDialog
        :close-on-backdrop="false"
        :plain-background="true"
        :visible="showRegisterModal"
        :header="$lang.addNewUser || 'Add New User'"
        max-width="max-w-4xl"
        @update:visible="onRegisterModalVisibility">
        <MiniUserForm />
        <template #footer>
            <div class="py- flex justify-between">
                <MainButton
                    severity="secondary"
                    iconPos="right"
                    :icon="ExpandIcon"
                    :label="$lang.exapndFullForm || 'Expand Full Form'"
                    @click="handleAddUser" />
                <!--
                    Bound to the form's OWN submit state. This used to read
                    `fetchingUsers`, the users table's fetch flag, so Save was
                    disabled whenever the list happened to be reloading and gave
                    no feedback at all while the user was actually being saved.
                -->
                <MainButton
                    :label="$lang.save || 'Save'"
                    :loading="isSavingUser"
                    @click="handleUserFormSubmit" />
            </div>
        </template>
    </MainDialog>

    <MainDialog
        :visible="forceLogoutPopup"
        :header="$lang.areYouSureToLogThisUserOut"
        max-width="max-w-md"
        @update:visible="forceLogoutPopup = $event">
        <div class="py-4">
            <p>{{ $lang.cautionForForceLogout }}</p>
            <div class="mt-4 flex items-center justify-end gap-4">
                <MainButton
                    :disabled="fetchingUsers"
                    :label="$lang.cancel"
                    outlined
                    size="normal"
                    @click="forceLogoutPopup = false" />
                <MainButton
                    :loading="fetchingUsers"
                    :label="$lang.clear"
                    severity="danger"
                    size="normal"
                    @click="forceLogout(selectedUserId)" />
            </div>
        </div>
    </MainDialog>

    <MainDialog
        :visible="showViewProfileModal"
        :plain-background="true"
        :header="$lang.viewUser || 'View User'"
        max-width="max-w-3xl"
        @update:visible="showViewProfileModal = $event">
        <UserProfileCard
            v-if="selectedViewUser"
            :user="selectedViewUser" />
        <template #footer>
            <div class="flex justify-end">
                <MainButton
                    outlined
                    severity="secondary"
                    iconPos="right"
                    :icon="ExpandIcon"
                    :label="$lang.openFullDetail || 'Open Full Detail'"
                    @click="selectedViewUser && openUserFullDetail(selectedViewUser)" />
            </div>
        </template>
    </MainDialog>

    <UserPermissionsDialog
        v-model:visible="showPermissionsModal"
        :user="permissionsModalUser"
        :overrides="permissionOverrides"
        :loading="isLoadingOverrides" />

    <ConfirmDialog
        :cancelLabel="$lang.cancel || 'Cancel...'"
        v-model:show="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :item-label="$lang.user || 'User'"
        :item-name="selectedUser?.full_name || $lang.selectedUsers || 'Selected Users'"
        :type="confirmState.type"
        :confirm-label="confirmState.confirmLabel"
        :statusTransition="confirmState.statusTransition"
        :loading="confirmState.loading"
        @confirm="confirmState.onConfirm" />

    <RoleTreeDialog
        :roles="selectedUser?.roles"
        :on-edit="
            (binding) => {
                showRoleTreeDialog = false;
                fetchUserRoleBinding(binding.id);
            }
        "
        :on-delete="
            (binding) => {
                openUserRoleRevocationDialog(binding);
            }
        " />

    <MainDialog
        :plain-background="true"
        :visible="isRoleBindingModalOpen"
        :header="$lang.editRoleBinding || 'Edit Role Assignment'"
        max-width="max-w-4xl"
        @update:visible="isRoleBindingModalOpen = $event">
        <UserRoleBindingForm
            v-if="selectedUser"
            :user="selectedUser"
            @roleAssigned="
                () => {
                    isRoleBindingModalOpen = false;
                    fetchUsers();
                }
            " />
        <template #footer>
            <div class="flex justify-end gap-3 py-3">
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="isRoleBindingModalOpen = false" />
                <MainButton
                    :label="$lang.save || 'Save'"
                    :loading="isAssigning"
                    :disabled="!selectedUser"
                    @click="saveRoleBinding" />
            </div>
        </template>
    </MainDialog>
</template>
