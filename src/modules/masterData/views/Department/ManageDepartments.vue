<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useDepartment } from '@/modules/masterData/composables/useDepartment';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import DepartmentFormDialog from '@/modules/masterData/components/Department/DepartmentFormDialog.vue';

import BuildingIcon from '@/assets/icons/BuildingIcon.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { Department } from '@/modules/masterData/types/department';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    departments,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchDepartments,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveDepartmentForm
} = useDepartment();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('departments', 'Departments') }]);

onMounted(() => {
    fetchDepartments();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="BuildingIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageDepartments || 'Manage Departments' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageDepartmentsDesc ||
                        'Departments own programs, courses, instructors and offerings, and act as the first two approval tiers.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="departments"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchDepartments || 'Search departments...'"
                :show-add-button="$can('createDepartment')"
                :show-refresh="true"
                @refresh="fetchDepartments"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchDepartments({ page })"
                @update:limit="(value: number) => fetchDepartments({ perPage: value })">
                <template #cell-college="{ item }">
                    <span class="text-text-secondary">{{ (item as Department).college?.name || '—' }}</span>
                </template>

                <template #cell-head="{ item }">
                    <span class="text-text-secondary">{{ (item as Department).head?.full_name || '—' }}</span>
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as Department).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="
                            (item as Department).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'
                        " />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Department)" />
                </template>
            </MainTable>
        </div>

        <DepartmentFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveDepartmentForm" />

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
