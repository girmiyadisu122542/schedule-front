<script setup lang="ts">
import { onMounted } from 'vue';

import { STATE_ACTIVE } from '@/constants/statusOptions';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import { useCollege } from '@/modules/masterData/composables/useCollege';

import Badge from '@/components/common/Badge.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import CollegeFormDialog from '@/modules/masterData/components/College/CollegeFormDialog.vue';
import CollegeDetailDialog from '@/modules/masterData/components/College/CollegeDetailDialog.vue';

const {
    isLoading,
    colleges,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    viewDialogVisible,
    viewingCollege,
    confirmState,
    selectedColleges,
    getBulkActions,
    fetchColleges,
    reloadColleges,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveCollegeForm
} = useCollege();

onMounted(() => {
    reloadColleges();
});
</script>

<template>
    <div>
        <MainTable
            :columns="tableColumns"
            :items="colleges"
            :loading="isLoading"
            :filter-fields="filterFields"
            :server-side-filter="true"
            css-clases="rounded-2xl"
            :add-button-label="$lang.createCollege || 'Create College'"
            :search-placeholder="$lang.searchColleges || 'Search colleges...'"
            :show-add-button="$can('createCollege')"
            :selectable="$can('changeCollegeStatus') || $can('deleteCollege')"
            :bulk-actions="getBulkActions(selectedColleges, reloadColleges)"
            :show-refresh="false"
            :show-export="true"
            @refresh="fetchColleges"
            @add="openCreateDialog"
            @search="handleSearch"
            @filter-change="handleFilterChange"
            @selection-change="(rows) => (selectedColleges = rows as any)"
            @update:currentPage="(page) => fetchColleges({ page })"
            @update:limit="(val) => fetchColleges({ perPage: val })">
            <template #cell-dean_name="{ item }">
                <span class="text-schedule-text-primary dark:text-text-tertiary font-medium">
                    {{ item?.dean_name || '—' }}
                </span>
            </template>

            <template #cell-departments_count="{ item }">
                <span
                    class="bg-surface-subtle text-text-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                    {{ item.departments_count ?? 0 }}
                </span>
            </template>

            <template #cell-state="{ item }">
                <Badge
                    outlined
                    :variant="item.state === STATE_ACTIVE ? STATUS_SUCCESS : STATUS_LIGHT"
                    :label="item.state === STATE_ACTIVE ? $lang.active || 'Active' : $lang.inactive || 'Inactive'" />
            </template>

            <template #action="{ item }">
                <ActionMenu :options="getActionOptions(item as any)" />
            </template>
        </MainTable>

        <CollegeFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveCollegeForm" />

        <CollegeDetailDialog
            v-model:visible="viewDialogVisible"
            :college="viewingCollege" />

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
