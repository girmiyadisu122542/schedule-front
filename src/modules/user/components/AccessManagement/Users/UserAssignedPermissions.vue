<script setup lang="ts">
import { toRef, ref, computed } from 'vue';

import { STATUS_SUCCESS, STATUS_ERROR, STATUS_INFO, PERMISSION_OVERRIDE_STATUS } from '@/config/appConfig';
import { useLanguageStore } from '@/stores/languageStore';
import type { User } from '@/modules/user/types/AccessManagement/User/UserType';
import UserHeader from '@/modules/user/components/AccessManagement/Users/UserHeader.vue';
import {
    useAssignedPermissions,
    ASSIGNED_SUB_TAB,
    type DirectGrantGroup,
    type DirectGrantPeriod,
    type RoleInheritedGroup
} from '@/modules/user/composables/AccessManagement/User/useAssignedPermissions';

import Badge from '@/components/common/Badge.vue';
import TabList from '@/components/common/TabList.vue';
import MainTable from '@/components/common/MainTable.vue';
import MainButton from '@/components/common/MainButton.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import RotateCcw from '@/assets/icons/RotateCcw.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import RightChevronIcon from '@/assets/icons/RightChevronIcon.vue';

const props = defineProps<{
    user?: User | null;
}>();

const { customizeLanguageData } = useLanguageStore();

const {
    selectedUser,
    activeSubTab,
    subTabOptions,
    roleInherited,
    directGrants,
    confirmVisible,
    confirmLoading,
    pendingAction,
    revokeInherited,
    restoreInherited,
    removePeriod,
    cancelConfirm,
    runConfirm
} = useAssignedPermissions(toRef(props, 'user'));

const expandedRoles = ref<Set<number>>(new Set());
const expandedPermissions = ref<Set<number>>(new Set());

const toggle = (set: Set<number>, id: number) => {
    if (set.has(id)) {
        set.delete(id);
    } else {
        set.add(id);
    }
};

const totalDirectGrants = computed(() => directGrants.value.length);

const roleColumns = [
    { key: 'name', label: customizeLanguageData('permission', 'Permission') },
    { key: 'start_date', label: customizeLanguageData('startDate', 'Start date') },
    { key: 'end_date', label: customizeLanguageData('endDate', 'End date') },
    { key: 'status', label: customizeLanguageData('status', 'Status') },
    { key: 'action', label: customizeLanguageData('action', 'Action') }
];
</script>

<template>
    <div
        v-if="selectedUser"
        class="space-y-6">
        <div
            class="border-schedule-active dark:border-border-strong dark:bg-surface-card rounded-2xl border bg-white p-4">
            <UserHeader
                :cssClass="'bg-white dark:bg-surface-subtle'"
                :photo="selectedUser.photo"
                :full_name="selectedUser.full_name"
                :email="selectedUser.email"
                :status="selectedUser.status"
                :state="selectedUser.state"
                :roles="selectedUser.roles"
                :key="selectedUser.id" />
        </div>

        <div
            class="border-schedule-active dark:border-border-strong dark:bg-surface-card space-y-4 rounded-2xl border bg-white p-4">
            <div>
                <h2 class="text-lg font-semibold">
                    {{ $lang.assignedPermissionsMatrix || 'Assigned Permissions Matrix' }}
                </h2>
                <p class="dark:text-text-tertiary text-sm text-gray-600">
                    {{
                        $lang.assignedPermissionsMatrixDescription ||
                        'A tree representing all user authorizations. Permissions derived from active roles can be individually revoked. Special direct grants support multiple active date ranges.'
                    }}
                </p>
            </div>

            <TabList
                v-model="activeSubTab"
                :options="subTabOptions" />
        </div>

        <template v-if="activeSubTab === ASSIGNED_SUB_TAB.ROLE_INHERITED">
            <div
                v-if="!roleInherited.length"
                class="border-schedule-active dark:border-border-strong dark:bg-surface-card rounded-2xl border bg-white p-8 text-center text-sm text-gray-400">
                {{ $lang.noRoleInheritedPermissions || 'This user has no role-inherited permissions.' }}
            </div>

            <div
                v-for="group in roleInherited as RoleInheritedGroup[]"
                :key="group.role_id"
                class="border-schedule-active dark:border-border-strong dark:bg-surface-card overflow-hidden rounded-2xl border bg-white">
                <button
                    type="button"
                    class="flex w-full items-center justify-between px-4 py-4 text-left"
                    @click="toggle(expandedRoles, group.role_id)">
                    <span class="text-schedule-text-primary dark:text-text-tertiary font-semibold">
                        {{ $lang.role || 'Role' }}: {{ group.role_name }}
                    </span>
                    <RightChevronIcon
                        class="h-6 w-6 transition-transform"
                        :class="{ 'rotate-90': expandedRoles.has(group.role_id) }" />
                </button>

                <div
                    v-if="expandedRoles.has(group.role_id)"
                    class="dark:border-border-default border-t border-gray-100">
                    <MainTable
                        :items="{ data: group.permissions, pagination: null }"
                        :columns="roleColumns"
                        :showSearch="false"
                        :showFilter="false"
                        :showSort="false"
                        :showAddButton="false"
                        :showColumnToggle="false"
                        :isFullScreenOn="false"
                        :showIndex="true"
                        :needActionColumn="false"
                        :total-entries="null"
                        cssClases="border-0">
                        <template #cell-start_date="{ item }">{{ item.start_date || '—' }}</template>
                        <template #cell-end_date="{ item }">{{ item.end_date || '—' }}</template>
                        <template #cell-status="{ item }">
                            <Badge
                                outlined
                                size="sm"
                                :variant="
                                    item.status === PERMISSION_OVERRIDE_STATUS.REVOKED ? STATUS_ERROR : STATUS_SUCCESS
                                "
                                :label="
                                    item.status === PERMISSION_OVERRIDE_STATUS.REVOKED
                                        ? $lang.revoked || 'Revoked'
                                        : $lang.allowed || 'Allowed'
                                " />
                        </template>
                        <template #cell-action="{ item }">
                            <MainButton
                                v-if="item.status === PERMISSION_OVERRIDE_STATUS.REVOKED"
                                outlined
                                size="small"
                                :icon="RotateCcw"
                                :label="$lang.restore || 'Restore'"
                                @click="restoreInherited(group.role_name, item)" />
                            <MainButton
                                v-else
                                outlined
                                size="small"
                                :icon="XmarkIcon"
                                :label="$lang.revoke || 'Revoke'"
                                @click="revokeInherited(group.role_name, item)" />
                        </template>
                    </MainTable>
                </div>
            </div>
        </template>

        <template v-else>
            <div
                v-if="!directGrants.length"
                class="border-schedule-active dark:border-border-strong dark:bg-surface-card rounded-2xl border bg-white p-8 text-center text-sm text-gray-400">
                {{ $lang.noDirectGrants || 'This user has no direct permission grants.' }}
            </div>

            <div
                v-else
                class="border-schedule-active dark:border-border-strong dark:bg-surface-card rounded-2xl border bg-white">
                <div class="flex items-center gap-2 px-5 py-4">
                    <span class="font-semibold text-gray-900 dark:text-white">
                        {{ totalDirectGrants }}
                        {{ $lang.directlyGrantedPermissions || 'Directly Granted Permissions' }}
                    </span>
                    <RightChevronIcon class="h-4 w-4 rotate-90 text-gray-400" />
                </div>

                <div
                    class="dark:divide-border-default dark:border-border-default divide-y divide-gray-100 border-t border-gray-100">
                    <div
                        v-for="group in directGrants as DirectGrantGroup[]"
                        :key="group.permission_id">
                        <button
                            type="button"
                            class="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40"
                            @click="toggle(expandedPermissions, group.permission_id)">
                            <span class="flex items-center gap-2">
                                <RightChevronIcon
                                    class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
                                    :class="{ 'rotate-90': expandedPermissions.has(group.permission_id) }" />
                                <span class="font-medium text-gray-900 dark:text-white">
                                    {{ group.name }}
                                </span>
                            </span>
                            <span class="dark:text-text-muted text-sm text-gray-400">
                                {{ group.periods.length }}
                                {{ $lang.activePeriods || 'Active Periods' }}
                            </span>
                        </button>

                        <template v-if="expandedPermissions.has(group.permission_id)">
                            <div
                                v-for="period in group.periods as DirectGrantPeriod[]"
                                :key="period.override_id"
                                class="dark:border-border-default flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-8 py-3 dark:bg-gray-800/40">
                                <span class="dark:text-text-secondary text-sm text-gray-600">
                                    {{ group.name }}
                                </span>
                                <span class="dark:text-text-tertiary text-sm text-gray-500">
                                    {{ period.start_date || '—' }} - {{ period.end_date || '—' }}
                                </span>
                                <MainButton
                                    outlined
                                    size="small"
                                    :icon="TrashIcon"
                                    :label="$lang.revokeRemove || 'Revoke / Remove'"
                                    @click="removePeriod(group, period)" />
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </template>

        <ConfirmDialog
            :show="confirmVisible"
            :type="pendingAction?.type || STATUS_INFO"
            :title="pendingAction?.title || ''"
            :message="pendingAction?.message || ''"
            :confirmLabel="pendingAction?.confirmLabel || $lang.confirm || 'Confirm'"
            :cancelLabel="$lang.cancel || 'Cancel'"
            :loading="confirmLoading"
            @update:show="(value: boolean) => !value && cancelConfirm()"
            @confirm="runConfirm" />
    </div>

    <div
        v-else
        class="py-8 text-center">
        <p>{{ $lang.noUserSelected || 'No User Selected' }}</p>
    </div>
</template>
