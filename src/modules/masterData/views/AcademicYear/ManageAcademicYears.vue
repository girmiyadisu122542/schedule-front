<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useAcademicYear } from '@/modules/masterData/composables/useAcademicYear';

import BoolChip from '@/components/common/BoolChip.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import AcademicYearFormDialog from '@/modules/masterData/components/AcademicYear/AcademicYearFormDialog.vue';

import Calendar from '@/assets/icons/Calendar.vue';
import type { AcademicYear } from '@/modules/masterData/types/academicYear';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    academicYears,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchAcademicYears,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveAcademicYearForm
} = useAcademicYear();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('academicYears', 'Academic Years') }]);

onMounted(() => {
    fetchAcademicYears();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="Calendar" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageAcademicYears || 'Manage Academic Years' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageAcademicYearsDesc ||
                        'Academic years group semesters and scope student cohorts. Exactly one year is current at a time.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="academicYears"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchAcademicYears || 'Search academic years...'"
                :show-add-button="$can('createAcademicYear')"
                :show-refresh="true"
                @refresh="fetchAcademicYears"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchAcademicYears({ page })"
                @update:limit="(value: number) => fetchAcademicYears({ perPage: value })">
                <template #cell-is_current="{ item }">
                    <BoolChip :value="(item as AcademicYear).is_current" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as AcademicYear)" />
                </template>
            </MainTable>
        </div>

        <AcademicYearFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveAcademicYearForm" />

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
