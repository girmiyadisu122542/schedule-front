<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useSection } from '@/modules/masterData/composables/useSection';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import SectionFormDialog from '@/modules/masterData/components/Section/SectionFormDialog.vue';

import BusinessChart from '@/assets/icons/BusinessChart.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { Section } from '@/modules/masterData/types/section';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    sections,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchSections,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveSectionForm
} = useSection();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('sections', 'Sections') }]);

onMounted(() => {
    fetchSections();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="BusinessChart" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageSections || 'Manage Sections' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageSectionsDesc ||
                        'The student cohort — the unit every class and exam clash is checked against.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="sections"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchSections || 'Search sections...'"
                :show-add-button="$can('createSection')"
                :show-refresh="true"
                @refresh="fetchSections"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchSections({ page })"
                @update:limit="(value: number) => fetchSections({ perPage: value })">
                <template #cell-program="{ item }">
                    <span class="text-text-secondary">{{ (item as Section).program?.name || '—' }}</span>
                </template>

                <template #cell-year_level="{ item }">
                    <span class="text-text-secondary">{{ (item as Section).year_level }}</span>
                </template>

                <template #cell-academic_year="{ item }">
                    <span class="text-text-secondary">{{ (item as Section).academic_year?.code || '—' }}</span>
                </template>

                <template #cell-expected_students="{ item }">
                    <span
                        class="bg-surface-subtle text-text-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                        {{ (item as Section).expected_students }}
                    </span>
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as Section).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="
                            (item as Section).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'
                        " />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Section)" />
                </template>
            </MainTable>
        </div>

        <SectionFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveSectionForm" />

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
