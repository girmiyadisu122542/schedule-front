<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useCollege } from '@/modules/masterData/composables/useCollege';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import CollegeFormDialog from '@/modules/masterData/components/College/CollegeFormDialog.vue';

import BuildingCityIcon from '@/assets/icons/BuildingCityIcon.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { College } from '@/modules/masterData/types/college';

const { customizeLanguageData } = useLanguageStore();
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
    confirmState,
    fetchColleges,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveCollegeForm
} = useCollege();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('collegesOrSchools', 'Colleges / Schools') }]);

onMounted(() => {
    fetchColleges();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="BuildingCityIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageColleges || 'Manage Colleges / Schools' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageCollegesDesc ||
                        'Colleges own departments and act as the College-Dean tier of the offering approval chain.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="colleges"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchColleges || 'Search colleges...'"
                :show-add-button="$can('createCollege')"
                :show-refresh="true"
                @refresh="fetchColleges"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchColleges({ page })"
                @update:limit="(value: number) => fetchColleges({ perPage: value })">
                <template #cell-dean="{ item }">
                    <span class="text-text-secondary">{{ (item as College).dean?.full_name || '—' }}</span>
                </template>

                <template #cell-departments_count="{ item }">
                    <span
                        class="bg-surface-subtle text-text-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                        {{ (item as College).departments_count ?? 0 }}
                    </span>
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as College).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="
                            (item as College).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'
                        " />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as College)" />
                </template>
            </MainTable>
        </div>

        <CollegeFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveCollegeForm" />

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
