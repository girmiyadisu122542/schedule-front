<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { STATE_ACTIVE } from '@/constants/statusOptions';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import { useRole } from '@/modules/user/composables/AccessManagement/role/useRole';

import Badge from '@/components/common/Badge.vue';
import MainTable from '@/components/common/MainTable.vue';
import MainBadge from '@/components/common/MainBadge.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import RoleFormDialog from '@/modules/user/components/AccessManagement/Role/RoleFormDialog.vue';
import RoleDetailDialog from '@/modules/user/components/AccessManagement/Role/RoleDetailDialog.vue';

const router = useRouter();

const {
    isLoading,
    roles,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editingRoleId,
    editForm,
    editErrors,
    isSavingEdit,
    viewDialogVisible,
    viewingRole,
    confirmState,
    selectedRoles,
    getBulkActions,
    fetchRoles,
    reloadRoles,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveRoleForm
} = useRole();

const onExpandFullForm = () => {
    dialogVisible.value = false;
    if (isEditingDialog.value && editingRoleId.value) {
        router.push({ name: 'rolePermissions', params: { id: editingRoleId.value } });
    } else {
        router.push({ name: 'createRolePermission' });
    }
};

const truncate = (text?: string, length = 20) => {
    if (!text) return '';
    return text.length > length ? text.slice(0, length) + '...' : text;
};

onMounted(() => {
    reloadRoles();
});
</script>

<template>
    <div>
        <MainTable
            :columns="tableColumns"
            :items="roles"
            :loading="isLoading"
            :filter-fields="filterFields"
            :server-side-filter="true"
            css-clases="rounded-2xl"
            :add-button-label="$lang.createRole"
            :search-placeholder="$lang.searchRoles || 'Search roles...'"
            :show-add-button="$can('createRole')"
            :selectable="$can('changeRoleState') || $can('deleteRole')"
            :bulk-actions="getBulkActions(selectedRoles, reloadRoles)"
            :show-refresh="true"
            @refresh="fetchRoles"
            @add="openCreateDialog"
            @search="handleSearch"
            @filter-change="handleFilterChange"
            @selection-change="(rows) => (selectedRoles = rows as any)"
            @update:currentPage="(page) => fetchRoles({ page })"
            @update:limit="(val) => fetchRoles({ perPage: val })">
            <template #cell-description="{ item }">
                <span class="text-schedule-text-primary dark:text-text-tertiary font-medium">
                    {{ truncate(item?.description) }}
                </span>
            </template>
            <template #cell-permissions_count="{ item }">
                <MainBadge
                    clickable
                    icon="fa-solid fa-arrow-right"
                    icon-position="after"
                    size="small"
                    :value="`${item.permissions_count ?? 0} ${item.permissions_count === 1 ? $lang.permission || 'Permission' : $lang.permissions || 'Permissions'}`"
                    @click="() => router.push({ name: 'rolePermissions', params: { id: item.id } })" />
            </template>

            <template #cell-users_count="{ item }">
                <span
                    class="bg-surface-subtle text-text-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                    <i class="fa-regular fa-user text-[10px] opacity-70"></i>
                    {{ item.users_count ?? 0 }}
                </span>
            </template>

            <template #cell-state="{ item }">
                <Badge
                    outlined
                    :variant="item.state === STATE_ACTIVE ? STATUS_SUCCESS : STATUS_LIGHT"
                    :label="item.state === STATE_ACTIVE ? $lang.active || 'Active' : $lang.inactive || 'Inactive'" />
            </template>

            <template #cell-created_at="{ item }">
                <span class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                    {{ item.created_at ? new Date(item.created_at).toLocaleDateString() : '-' }}
                </span>
            </template>

            <template #action="{ item }">
                <ActionMenu :options="getActionOptions(item as any)" />
            </template>
        </MainTable>

        <RoleFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveRoleForm"
            @expand="onExpandFullForm" />

        <RoleDetailDialog
            v-model:visible="viewDialogVisible"
            :role="viewingRole" />

        <ConfirmDialog
            v-model:show="confirmState.show"
            :title="confirmState.title"
            :message="confirmState.message"
            :item-label="confirmState.itemLabel"
            :item-name="confirmState.itemName"
            :item-names="confirmState.itemNames"
            :status-transition="confirmState.statusTransition"
            :confirm-label="confirmState.confirmLabel"
            :cancel-label="$lang.cancel"
            :type="confirmState.type"
            :loading="confirmState.loading"
            @confirm="confirmState.onConfirm" />
    </div>
</template>
