<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, ref } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { ROLE_PERMISSION_TAB, STATUS_SUCCESS, STATUS_WARNING } from '@/config/appConfig';
import { useCreateRolePermission } from '@/modules/user/composables/AccessManagement/role/useCreateRolePermission';

import Breadcrumb from '@/components/common/Breadcrumb.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import InputText from '@/components/common/InputText.vue';
import CheckBox from '@/components/common/CheckBox.vue';
import StatCard from '@/components/common/StatCard.vue';
import TabList from '@/components/common/TabList.vue';
import MonitorIcon from '@/assets/icons/MonitorIcon.vue';
import CalendarIcon from '@/assets/icons/Calendar.vue';
import CircleCheckIcon from '@/assets/icons/CircleCheckIcon.vue';
import ExclamationCircleIcon from '@/assets/icons/ExclamationCircleIcon.vue';
import ShieldProtectedCheckmark from '@/assets/icons/ShieldProtectedCheckmark.vue';
import RolePermissionPanel from '@/modules/user/components/AccessManagement/Role/RolePermissionPanel.vue';
import UserProfileSetting from '@/assets/icons/UserProfileSetting.vue';

const route = useRoute();
const router = useRouter();
const { customizeLanguageData } = useLanguageStore();

const initialRoleId = route.params.id ? Number(route.params.id) : null;
const showBanner = !!initialRoleId;

const {
    activeTab,
    isRoleSaved,
    isSavingRole,
    isSaving,
    savedRoleName,
    savedRoleState,
    roleForm,
    formErrors,
    isLoading,
    isDirty,
    stats,

    filteredPgTree,
    selectedGroupId,
    selectedGroup,
    pgSearchQuery,
    expandedGroups,
    isGroupAllSelected,
    groupGrantedCount,
    toggleExpand,
    toggleGroupSelectAll,

    filteredModuleGroups,
    selectedModuleGroupId,
    selectedModuleGroup,
    selectedModuleId,
    selectedModule,
    expandedModuleGroups,
    mgSearchQuery,
    isModuleAllSelected,
    moduleGrantedCount,
    moduleGroupGrantedCount,
    toggleModuleSelectAll,

    selectedPermissions,
    togglePermission,

    loadExistingRole,
    onSave
} = useCreateRolePermission(initialRoleId);

const tabOptions = computed(() => [
    {
        label: showBanner
            ? customizeLanguageData('editRole', 'Edit Role')
            : customizeLanguageData('createRole', 'Create Role'),
        value: ROLE_PERMISSION_TAB.CREATE_ROLE,
        icon: UserProfileSetting
    },
    {
        label: customizeLanguageData('assignPermissions', 'Assign Permissions'),
        value: ROLE_PERMISSION_TAB.ASSIGN_PERMISSIONS,
        icon: ShieldProtectedCheckmark,
        disabled: !isRoleSaved.value
    }
]);

onMounted(async () => {
    if (initialRoleId) await loadExistingRole(initialRoleId);
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
    if (!isDirty.value) return true;
    showLeaveConfirm.value = true;
    return new Promise<boolean>((resolve) => {
        resolveLeave = resolve;
    });
});

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value) return;
    event.preventDefault();
    event.returnValue = '';
};

onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload));
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <Breadcrumb
                    :items="[
                        { label: $lang.role || 'Role', href: '/users/manage-roles', clickable: true },
                        {
                            label:
                                activeTab === ROLE_PERMISSION_TAB.CREATE_ROLE
                                    ? showBanner
                                        ? $lang.editRole || 'Edit Role'
                                        : $lang.createRole || 'Create Role'
                                    : $lang.assignPermissions || 'Assign Permissions'
                        }
                    ]"
                    :icon="MonitorIcon"
                    :status="
                        isRoleSaved && !isDirty
                            ? { type: STATUS_SUCCESS, text: $lang.saved || 'Saved' }
                            : { type: STATUS_WARNING, text: $lang.notSaved || 'Not Saved' }
                    " />
            </div>
            <MainButton
                :label="$lang.save || 'Save'"
                severity="primary"
                :loading="isSavingRole || isSaving"
                @click="onSave" />
        </div>

        <TabList
            v-model="activeTab"
            :options="tabOptions" />

        <div v-if="activeTab === ROLE_PERMISSION_TAB.CREATE_ROLE">
            <div
                class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card rounded-2xl border bg-white p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-schedule-text-primary dark:text-text-primary text-lg font-semibold">
                        {{ showBanner ? $lang.editRole || 'Edit Role' : $lang.createRole || 'Create Role' }}
                    </h2>
                    <button
                        @click="router.back()"
                        class="text-schedule-text-tertiary hover:text-schedule-text-primary dark:text-text-tertiary">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label
                            class="text-schedule-text-secondary dark:text-text-secondary mb-1 block text-sm font-medium">
                            {{ $lang.name }}
                        </label>
                        <InputText
                            v-model="roleForm.name"
                            :placeholder="$lang.enterName"
                            :invalid="!!formErrors.name"
                            :message="formErrors.name" />
                    </div>
                    <div>
                        <label
                            class="text-schedule-text-secondary dark:text-text-secondary mb-1 block text-sm font-medium">
                            {{ $lang.description }}
                        </label>
                        <textarea
                            v-model="roleForm.description"
                            rows="5"
                            :placeholder="$lang.enterDescription"
                            class="border-schedule-border-primary text-schedule-text-primary placeholder:text-schedule-text-tertiary focus:border-schedule-brand-blue dark:border-border-strong dark:bg-surface-card dark:text-text-secondary dark:placeholder:text-text-muted w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div class="flex flex-col gap-3 pt-2">
                        <label class="flex cursor-pointer items-center gap-3">
                            <CheckBox
                                v-model="roleForm.unique_per_user"
                                :binary="true" />
                            <span class="dark:text-text-secondary text-sm font-medium text-gray-700">
                                {{ $lang.uniquePerUser || 'Unique Per User' }}
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-else
            class="space-y-6">
            <div
                v-if="!showBanner"
                class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card flex items-center justify-between rounded-xl border bg-white px-6 py-3">
                <div class="flex items-center gap-2 text-sm">
                    <span class="text-schedule-text-secondary dark:text-text-tertiary">{{ $lang.roleName }}:</span>
                    <span class="text-schedule-brand-blue font-semibold">{{ savedRoleName }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <span class="text-schedule-text-secondary dark:text-text-tertiary">{{ $lang.status }}:</span>
                    <span
                        :class="savedRoleState === 1 ? 'text-schedule-success-strong' : 'text-schedule-error-default'"
                        class="font-semibold">
                        {{ savedRoleState === 1 ? $lang.active : $lang.inactive }}
                    </span>
                </div>
            </div>

            <div
                v-if="showBanner"
                class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    :title="$lang.allPermission"
                    :value="stats.all"
                    :icon="CalendarIcon"
                    variant="primary" />
                <StatCard
                    :title="$lang.grantedPermission"
                    :value="stats.granted"
                    :icon="CircleCheckIcon"
                    variant="success" />
                <StatCard
                    :title="$lang.revokedPermission"
                    :value="stats.revoked"
                    :icon="ExclamationCircleIcon"
                    variant="error" />
            </div>

            <div
                class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card rounded-2xl border bg-white p-6">
                <div class="mb-4">
                    <h2 class="text-schedule-text-primary dark:text-text-primary text-lg font-semibold">
                        {{ $lang.permissionManagement }}
                    </h2>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                        {{ $lang.managePermissionGroupAndPermission }}
                    </p>
                </div>

                <div
                    v-if="isLoading"
                    class="flex justify-center py-12">
                    <div
                        class="border-schedule-brand-blue h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                </div>

                <RolePermissionPanel
                    v-else
                    :role-name="savedRoleName"
                    :show-banner="showBanner"
                    :permission-groups="[]"
                    :filtered-pg-tree="filteredPgTree"
                    :selected-group-id="selectedGroupId"
                    :selected-group="selectedGroup"
                    :pg-search-query="pgSearchQuery"
                    :expanded-groups="expandedGroups"
                    :is-group-all-selected="isGroupAllSelected"
                    :group-granted-count="groupGrantedCount"
                    :filtered-module-groups="filteredModuleGroups"
                    :selected-module-group-id="selectedModuleGroupId"
                    :selected-module-group="selectedModuleGroup"
                    :selected-module-id="selectedModuleId"
                    :selected-module="selectedModule"
                    :expanded-module-groups="expandedModuleGroups"
                    :mg-search-query="mgSearchQuery"
                    :is-module-all-selected="isModuleAllSelected"
                    :module-granted-count="moduleGrantedCount"
                    :module-group-granted-count="moduleGroupGrantedCount"
                    :selected-permissions="selectedPermissions"
                    @update:selectedGroupId="(id) => (selectedGroupId = id)"
                    @update:selectedModuleGroupId="(id) => (selectedModuleGroupId = id)"
                    @update:selectedModuleId="(id) => (selectedModuleId = id)"
                    @update:pgSearchQuery="(v) => (pgSearchQuery = v)"
                    @update:mgSearchQuery="(v) => (mgSearchQuery = v)"
                    @toggleExpand="toggleExpand"
                    @toggleModuleGroup="
                        (id) =>
                            expandedModuleGroups.has(id)
                                ? expandedModuleGroups.delete(id)
                                : expandedModuleGroups.add(id)
                    "
                    @togglePermission="togglePermission"
                    @toggleGroupSelectAll="toggleGroupSelectAll"
                    @toggleModuleSelectAll="toggleModuleSelectAll" />
            </div>
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
