<script setup lang="ts">
import { toRef, ref, markRaw } from 'vue';

import Badge from '@/components/common/Badge.vue';
import TabList from '@/components/common/TabList.vue';
import InputText from '@/components/common/InputText.vue';
import MainTable from '@/components/common/MainTable.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import Collapsible from '@/components/common/Collapsible.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import DateTimePicker from '@/components/common/DateTimePicker.vue';

import InfoAltIcon from '@/assets/icons/InfoAltIcon.vue';
import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import FolderIcon from '@/assets/icons/FolderIcon.vue';
import BentArrowIcon from '@/assets/icons/BentArrowIcon.vue';
import FolderOpenIcon from '@/assets/icons/FolderOpenIcon.vue';
import FilterFunnelIcon from '@/assets/icons/FilterFunnelIcon.vue';
import SearchIcon from '@/assets/icons/Search.vue';

import type { User } from '@/modules/user/types/AccessManagement/User/UserType';
import { usePermissionOverride } from '@/modules/user/composables/AccessManagement/User/usePermissionOverriding';
import { STATUS_SUCCESS } from '@/config/appConfig';

const props = defineProps<{
    user?: User | null;
}>();

const {
    permissionGroupSearchQuery,
    userPermissionOverrideform,
    groupFilterId,
    groupFilterOptions,
    clearGroupFilter,
    validationErrors,
    totalPermissions,
    displayedGroups,
    currentGroupId,
    currentGroupName,
    selectedCount,
    selectedUser,
    tableColumns,
    permissions,
    tabOptions,
    isLoading,
    isDirty,
    activeTab,
    handleSearch,
    handleExpand,
    onLeafClicked,
    handleSelectedItems,
    handleToggleChange,
    assignPermissions,
    revokePermissions,
    savePermissionChanges,
    clearPendingChanges,
    handleTabChange,
    fetchPermissions
} = usePermissionOverride(toRef(props, 'user'));

const folderIcon = markRaw(FolderIcon);
const folderOpenIcon = markRaw(FolderOpenIcon);
const leafIcon = markRaw(BentArrowIcon);

const isGroupFilterVisible = ref(false);

const handleAssignSelected = () => assignPermissions();
const handleRevokeSelected = () => revokePermissions();

defineExpose({ save: savePermissionChanges, clearChanges: clearPendingChanges, isDirty });
</script>

<template>
    <div
        v-if="selectedUser"
        class="space-y-6">
        <div
            class="border-schedule-active dark:bg-schedule-brand-blue/10 dark:border-border-strong space-y-4 rounded-2xl border bg-white p-4">
            <div
                class="border-schedule-info-subtle bg-schedule-info-subtle dark:border-schedule-info-500/20 dark:bg-schedule-info-500/10 flex gap-4 rounded-2xl border p-6">
                <InfoAltIcon class="text-schedule-info-500 dark:text-schedule-info-300 mt-0.5 h-6 w-6 shrink-0" />
                <div class="space-y-2">
                    <h4 class="text-schedule-text-info dark:text-schedule-info-300 text-base font-bold">
                        {{ $lang.permissionLifecycle || 'Permission Lifecycle' }}
                    </h4>
                    <p class="text-schedule-text-info dark:text-schedule-info-300/90 text-sm leading-6">
                        {{
                            $lang.permissionLifecycleDescriptionLead ||
                            'Grant permissions directly to a user. You can assign the same permission multiple times with different effective date ranges. After granting permissions, you can review, edit, or revoke them from the'
                        }}
                        <span class="font-bold">{{ $lang.assignedPermissionsTab || 'Assigned Permissions tab' }}</span>
                        {{ $lang.permissionLifecycleDescriptionTrail || "without changing the user's assigned role." }}
                    </p>
                </div>
            </div>

            <div>
                <h2 class="text-lg font-semibold">{{ $lang.permissionManagement || 'Permission Management' }}</h2>
                <p class="dark:text-text-secondary text-sm text-gray-600">
                    {{ $lang.managePermissionGroupAndPermission || 'Manage Permission grant and revoke permission.' }}
                </p>
            </div>

            <div class="mb-4">
                <TabList
                    v-model="activeTab"
                    :options="tabOptions"
                    @update:modelValue="handleTabChange($event)" />
            </div>
        </div>

        <div
            class="border-schedule-active dark:bg-schedule-brand-blue/10 dark:border-border-strong rounded-2xl border bg-white p-4">
            <h3 class="mb-3 text-lg font-semibold">{{ $lang.validityPeriod || 'Validity Period' }}</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateTimePicker
                    v-model="userPermissionOverrideform.starts_at"
                    :labelText="$lang.startedDate || 'Started Date'"
                    :placeholder="$lang.startedDate"
                    :invalid="!!validationErrors.starts_at"
                    :message="validationErrors.starts_at || ''"
                    messageType="error"
                    class="w-full" />

                <DateTimePicker
                    v-model="userPermissionOverrideform.ends_at"
                    :labelText="$lang.endDate || 'End date'"
                    :placeholder="$lang.endDate"
                    :invalid="!!validationErrors.ends_at"
                    :message="validationErrors.ends_at || ''"
                    messageType="error"
                    class="w-full" />
            </div>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div
                class="border-schedule-active dark:bg-schedule-brand-blue/10 dark:border-border-strong space-y-4 rounded-2xl border bg-white px-4 py-8 lg:col-span-1">
                <div class="flex items-center justify-between">
                    <h3 class="font-medium">{{ $lang.permissionGroup || 'Permission Group' }}</h3>
                    <button
                        type="button"
                        class="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-base font-medium transition-colors"
                        :class="
                            isGroupFilterVisible || groupFilterId
                                ? 'border-schedule-brand-blue bg-schedule-brand-blue-subtle text-schedule-text-brand-primary dark:bg-schedule-brand-blue/15 dark:text-schedule-text-brand-secondary'
                                : 'border-schedule-border-subtle text-schedule-text-tertiary dark:border-border-strong dark:text-text-tertiary dark:hover:bg-surface-hover hover:bg-gray-50'
                        "
                        @click="isGroupFilterVisible = !isGroupFilterVisible">
                        <component
                            :is="isGroupFilterVisible ? XmarkIcon : FilterFunnelIcon"
                            :size="18"
                            class="h-5 w-5" />
                        {{ isGroupFilterVisible ? $lang.hideFilter || 'Hide Filter' : $lang.filter || 'Filter' }}
                    </button>
                </div>

                <div
                    v-if="isGroupFilterVisible"
                    class="border-schedule-border-subtle dark:border-border-strong space-y-3 rounded-xl border p-3">
                    <MainSelect
                        :modelValue="groupFilterId"
                        :options="groupFilterOptions"
                        optionLabel="label"
                        optionValue="value"
                        size="small"
                        variant="outlined"
                        search
                        :showClear="!!groupFilterId"
                        :labelText="$lang.permissionGroups || 'Permission Group'"
                        :placeholder="`${$lang.all || 'All'} ${$lang.permissionGroups || 'Permission Groups'}`"
                        @update:modelValue="(val: number | null) => (groupFilterId = val)" />

                    <div
                        v-if="groupFilterId"
                        class="flex justify-end">
                        <button
                            type="button"
                            class="text-schedule-brand-blue flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80"
                            @click="clearGroupFilter">
                            <XmarkIcon class="h-4 w-4" />
                            {{ $lang.resetFilter || 'Reset Filter' }}
                        </button>
                    </div>
                </div>

                <InputText
                    v-model="permissionGroupSearchQuery"
                    :icon="SearchIcon"
                    :placeholder="$lang.search || 'Search...'"
                    type="search"
                    class="mb-4" />

                <div class="max-h-screen space-y-1 overflow-y-auto pr-1">
                    <Collapsible
                        v-for="group in displayedGroups"
                        :key="group.id"
                        :node="group"
                        :isRoot="true"
                        :parentIcon="folderIcon"
                        :parentOpenIcon="folderOpenIcon"
                        :childIcon="leafIcon"
                        :iconPosition="'left'"
                        :hideChevron="true"
                        :chevronPosition="'left'"
                        :countBadgePosition="'end'"
                        :needCountBadge="false"
                        :needActiveColor="true"
                        :activeNodeId="currentGroupId"
                        activeClass="bg-schedule-surface-subtle text-schedule-text-secondary font-semibold shadow-sm dark:bg-schedule-brand-blue-subtle dark:text-white/90"
                        :needChevronIconOnLeafNode="false"
                        class="dark:bg-schedule-brand-blue/10 dark:hover:bg-surface-hover rounded-md bg-white hover:bg-gray-50"
                        @expand="handleExpand"
                        @leafClicked="onLeafClicked" />
                </div>
            </div>

            <div
                class="border-schedule-active dark:bg-schedule-brand-blue/10 dark:border-border-strong space-y-4 rounded-2xl border bg-white px-4 py-8 lg:col-span-3">
                <div class="flex flex-wrap items-center justify-start gap-3">
                    <h3 class="text-lg font-semibold">
                        {{ currentGroupName || $lang.userManagement || 'User Management' }}
                    </h3>
                    <Badge
                        outlined
                        :label-direction="'right'"
                        :label="`${permissions?.pagination?.total ?? totalPermissions} ${$lang.totalPermissions || 'Total Permissions'}`" />
                </div>
                <div
                    v-if="selectedCount > 0"
                    class="border-schedule-border-subtle bg-schedule-surface-subtle dark:border-border-default dark:bg-surface-subtle flex flex-col gap-3 border-b p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <span class="text-schedule-text-primary dark:text-text-tertiary text-sm font-medium">
                        {{ selectedCount }}&nbsp;{{ $lang.permissionsSelected || 'Permissions Selected' }}
                    </span>
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            class="text-schedule-text-primary dark:text-text-tertiary dark:border-border-strong dark:hover:bg-surface-hover w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto dark:bg-transparent"
                            :disabled="selectedCount === 0"
                            @click="handleAssignSelected">
                            {{ $lang.assignSelected || 'Assign Selected' }}
                        </button>
                        <button
                            type="button"
                            class="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 sm:w-auto dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                            :disabled="selectedCount === 0"
                            @click="handleRevokeSelected">
                            {{ $lang.revokeSelected || 'Revoke Selected' }}
                        </button>
                    </div>
                </div>

                <MainTable
                    :items="permissions ? permissions : { data: [], pagination: null }"
                    :showAddButton="false"
                    :showFilter="false"
                    :showSearch="true"
                    :showSort="false"
                    :showColumnToggle="false"
                    :isFullScreenOn="false"
                    :columns="tableColumns"
                    :total-entries="null"
                    :loading="isLoading"
                    :needActionColumn="false"
                    cssClases="border-0"
                    :selectable="true"
                    @search="handleSearch"
                    @update:selectedItems="handleSelectedItems"
                    @update:currentPage="(page) => fetchPermissions({ page })"
                    @update:limit="(val) => fetchPermissions({ perPage: val })">
                    <template #cell-name="{ item }">
                        <span class="text-schedule-text-primary dark:text-text-tertiary font-medium">
                            {{ item.name }}
                        </span>
                    </template>
                    <template #cell-state="{ item }">
                        <ToggleSwitch
                            :variant="STATUS_SUCCESS"
                            :modelValue="item.granted"
                            @update:modelValue="(val) => handleToggleChange(item, val)" />
                    </template>
                </MainTable>
            </div>
        </div>
    </div>

    <div
        v-else
        class="py-8 text-center">
        <p>{{ $lang.noUserSelected || 'No User Selected' }}</p>
    </div>
</template>
