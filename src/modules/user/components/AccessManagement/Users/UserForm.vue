<script setup lang="ts">
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

import TabList from '@/components/common/TabList.vue';
import MonitorIcon from '@/assets/icons/MonitorIcon.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainButton from '@/components/common/MainButton.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import RotateCcw from '@/assets/icons/RotateCcw.vue';
import MoreVerticalIcon from '@/assets/icons/MoreVerticalIcon.vue';

import { USER_FORM_TAB, STATUS_SUCCESS, STATUS_WARNING } from '@/config/appConfig';
import type { User, UserDetail } from '@/modules/user/types/AccessManagement/User/UserType';
import UserDetailTab from '@/modules/user/components/AccessManagement/Users/UserDetailTab.vue';
import { useRegisterUser } from '@/modules/user/composables/AccessManagement/User/useRegisterUser';
import UserRoleBindingForm from '@/modules/user/components/AccessManagement/Users/UserRoleBindingForm.vue';
import UserPermissionOverriding from '@/modules/user/components/AccessManagement/Users/UserPermissionOverriding.vue';
import UserAssignedPermissions from '@/modules/user/components/AccessManagement/Users/UserAssignedPermissions.vue';

const route = useRoute();
const editUserId = route.query.edit ? Number(route.query.edit) : undefined;

const {
    breadcrumbItems,
    userDetailForm,
    tabOptions,
    activeTab,
    isLoading,
    isFormDirty,
    errors,
    form,
    user,
    submitForm,
    clearError,
    clearChanges,
    fetchUserForEdit,
    handleUserUpdate,
    handlePhotoFileUpdate,
    handleUserDetailUpdate,
    handleVerifyNationalId
} = useRegisterUser();
const isUserSaved = computed(() => !!user.value);

const permissionTabRef = ref<InstanceType<typeof UserPermissionOverriding> | null>(null);
const roleTabRef = ref<InstanceType<typeof UserRoleBindingForm> | null>(null);
const isSavingPermissions = ref(false);
const permissionDirty = computed(() => permissionTabRef.value?.isDirty ?? false);
const roleDirty = computed(() => roleTabRef.value?.isDirty ?? false);

const savePermissions = async () => {
    if (!permissionTabRef.value) return;
    isSavingPermissions.value = true;
    try {
        await permissionTabRef.value.save();
    } finally {
        isSavingPermissions.value = false;
    }
};

const hasUnsavedChanges = computed(() => {
    if (activeTab.value === USER_FORM_TAB.ASSIGN_PERMISSION) return permissionDirty.value;
    if (activeTab.value === USER_FORM_TAB.ASSIGN_ROLE) return roleDirty.value;
    if (activeTab.value === USER_FORM_TAB.ASSIGNED_PERMISSIONS) return false;
    return isFormDirty.value;
});

const clearAllChanges = async () => {
    if (activeTab.value === USER_FORM_TAB.ASSIGN_PERMISSION) {
        permissionTabRef.value?.clearChanges();
    } else if (activeTab.value === USER_FORM_TAB.ASSIGN_ROLE) {
        roleTabRef.value?.clearChanges();
    } else {
        await clearChanges();
    }
};

onMounted(() => {
    if (editUserId) {
        fetchUserForEdit(editUserId);
    }
    if (route.query.tab) {
        activeTab.value = route.query.tab as string;
    }
});

const showLeaveConfirm = ref(false);
let resolveLeave: ((value: boolean) => void) | null = null;

const confirmLeave = () => {
    resolveLeave?.(true);
    resolveLeave = null;
    showLeaveConfirm.value = false;
};

const cancelLeave = () => {
    resolveLeave?.(false);
    resolveLeave = null;
    showLeaveConfirm.value = false;
};

onBeforeRouteLeave(() => {
    if (!hasUnsavedChanges.value) return true;
    showLeaveConfirm.value = true;
    return new Promise<boolean>((resolve) => {
        resolveLeave = resolve;
    });
});

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges.value) return;
    event.preventDefault();
    event.returnValue = '';
};

onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload));
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="pb-2">
                <Breadcrumb
                    :items="breadcrumbItems"
                    :icon="MonitorIcon"
                    :status="{
                        type: isUserSaved ? STATUS_SUCCESS : STATUS_WARNING,
                        text: isUserSaved ? $lang.saved || 'Saved' : $lang.notSaved || 'Not Saved'
                    }" />
            </div>

            <div class="flex items-center gap-3">
                <button
                    type="button"
                    class="border-schedule-border-subtle text-schedule-text-tertiary dark:border-border-strong dark:text-text-tertiary dark:hover:bg-surface-hover flex h-11 w-11 items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
                    :title="$lang.moreActions || 'More actions'">
                    <MoreVerticalIcon class="h-5 w-5" />
                </button>

                <MainButton
                    v-if="activeTab !== USER_FORM_TAB.ASSIGNED_PERMISSIONS"
                    outlined
                    type="button"
                    :disabled="!hasUnsavedChanges"
                    @click="clearAllChanges">
                    <span class="flex items-center gap-2">
                        <RotateCcw class="h-4 w-4" />
                        {{ $lang.clearChange || 'Clear Change' }}
                    </span>
                </MainButton>

                <MainButton
                    v-if="activeTab === USER_FORM_TAB.USER_DETAIL || activeTab === USER_FORM_TAB.ASSIGN_ROLE"
                    :loading="isLoading"
                    type="button"
                    @click="submitForm"
                    :disabled="activeTab !== USER_FORM_TAB.USER_DETAIL && !user">
                    {{
                        activeTab === USER_FORM_TAB.USER_DETAIL
                            ? form.id
                                ? $lang.update || 'Update User'
                                : $lang.create || 'Create User'
                            : $lang.assignRoles || 'Assign Roles'
                    }}
                </MainButton>

                <MainButton
                    v-else-if="activeTab === USER_FORM_TAB.ASSIGN_PERMISSION"
                    :loading="isSavingPermissions"
                    type="button"
                    @click="savePermissions"
                    :disabled="!user || !permissionDirty">
                    {{ $lang.save || 'Save' }}
                </MainButton>
            </div>
        </div>

        <TabList
            v-model="activeTab"
            :options="tabOptions" />

        <div>
            <UserDetailTab
                v-if="activeTab === USER_FORM_TAB.USER_DETAIL"
                :user="form"
                :userDetail="userDetailForm"
                :errors="errors"
                :clearError="clearError"
                @update:user="handleUserUpdate"
                @update:userDetail="handleUserDetailUpdate"
                @update:photoFile="handlePhotoFileUpdate"
                @verify-national-id="handleVerifyNationalId" />

            <UserRoleBindingForm
                v-if="activeTab === USER_FORM_TAB.ASSIGN_ROLE"
                ref="roleTabRef"
                :user="user" />

            <UserPermissionOverriding
                v-if="activeTab === USER_FORM_TAB.ASSIGN_PERMISSION"
                ref="permissionTabRef"
                :user="user" />

            <UserAssignedPermissions
                v-if="activeTab === USER_FORM_TAB.ASSIGNED_PERMISSIONS"
                :user="user" />
        </div>

        <ConfirmDialog
            :show="showLeaveConfirm"
            :title="$lang.unsavedChanges || 'Unsaved Changes'"
            :message="
                $lang.unsavedChangesMessage ||
                'You have unsaved changes that will be lost. Are you sure you want to leave this page?'
            "
            type="warning"
            :confirm-label="$lang.leave || 'Leave'"
            :cancel-label="$lang.stay || 'Stay'"
            @confirm="confirmLeave"
            @update:show="(val: boolean) => !val && cancelLeave()" />
    </div>
</template>
