<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useBuilding } from '@/modules/masterData/composables/useBuilding';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ImportDialog from '@/components/common/ImportDialog.vue';
import BuildingFormDialog from '@/modules/masterData/components/Building/BuildingFormDialog.vue';

import ModernBuilding from '@/assets/icons/ModernBuilding.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { Building } from '@/modules/masterData/types/building';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    buildings,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchBuildings,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveBuildingForm,
    entityLabel,
    importOrderHint,
    canExport,
    canImport,
    exportFormats,
    isExporting,
    isUploading,
    isDownloadingTemplate,
    importDialogVisible,
    mode,
    report,
    hasPreviewed,
    canCommit,
    rowsToWrite,
    openImportDialog,
    closeImportDialog,
    setFile,
    setMode,
    previewImport,
    confirmImport,
    exportList,
    downloadTemplate
} = useBuilding();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('buildings', 'Buildings') }]);

onMounted(() => {
    fetchBuildings();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="ModernBuilding" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageBuildings || 'Manage Buildings' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageBuildingsDesc ||
                        'Buildings group rooms and locate them on a campus for timetables and exam venue lists.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="buildings"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :add-button-label="$lang.createBuilding || 'Create Building'"
                :search-placeholder="$lang.searchBuildings || 'Search buildings...'"
                :show-add-button="$can('createBuilding')"
                :show-refresh="true"
                :show-import="canImport"
                :show-export="canExport"
                :export-formats="exportFormats"
                :export-loading="isExporting"
                @import="openImportDialog"
                @export="exportList"
                @refresh="fetchBuildings"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchBuildings({ page })"
                @update:limit="(value: number) => fetchBuildings({ perPage: value })">
                <template #cell-campus="{ item }">
                    <span class="text-text-secondary">{{ (item as Building).campus?.name || '—' }}</span>
                </template>

                <template #cell-floors="{ item }">
                    <span class="text-text-secondary">{{ (item as Building).floors ?? '—' }}</span>
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as Building).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="
                            (item as Building).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'
                        " />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Building)" />
                </template>
            </MainTable>
        </div>

        <BuildingFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveBuildingForm" />

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

        <ImportDialog
            :visible="importDialogVisible"
            :entity-label="entityLabel"
            :import-order-hint="importOrderHint"
            :is-uploading="isUploading"
            :is-downloading-template="isDownloadingTemplate"
            :report="report"
            :has-previewed="hasPreviewed"
            :can-commit="canCommit"
            :rows-to-write="rowsToWrite"
            :mode="mode"
            @update:visible="closeImportDialog"
            @update:mode="setMode"
            @file="setFile"
            @preview="previewImport"
            @confirm="confirmImport"
            @template="downloadTemplate" />
    </div>
</template>
