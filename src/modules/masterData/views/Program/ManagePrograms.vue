<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useProgram } from '@/modules/masterData/composables/useProgram';
import { useLookupValues } from '@/composables/useLookupValues';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ImportDialog from '@/components/common/ImportDialog.vue';
import ProgramFormDialog from '@/modules/masterData/components/Program/ProgramFormDialog.vue';

import BookIcon from '@/assets/icons/BookIcon.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { Program } from '@/modules/masterData/types/program';

const { customizeLanguageData } = useLanguageStore();
const degreeLevels = useLookupValues(LOOKUP_TYPE.DEGREE_LEVEL);
const {
    isLoading,
    programs,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchPrograms,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveProgramForm,
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
} = useProgram();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('programs', 'Programs') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const degreeLevelChip = (program: Program) => degreeLevels.resolve(program.degree_level_code);

onMounted(() => {
    fetchPrograms();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="BookIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.managePrograms || 'Manage Programs' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageProgramsDesc ||
                        'A program gives a section its cohort identity — "BSc CS Year 2 Section A".'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="programs"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchPrograms || 'Search programs...'"
                :show-add-button="$can('createProgram')"
                :show-refresh="true"
                :show-import="canImport"
                :show-export="canExport"
                :export-formats="exportFormats"
                :export-loading="isExporting"
                @import="openImportDialog"
                @export="exportList"
                @refresh="fetchPrograms"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchPrograms({ page })"
                @update:limit="(value: number) => fetchPrograms({ perPage: value })">
                <template #cell-department="{ item }">
                    <span class="text-text-secondary">{{ (item as Program).department?.name || '—' }}</span>
                </template>

                <!-- Which generation grid this programme is scheduled into. -->
                <template #cell-study_mode="{ item }">
                    <Badge
                        v-if="(item as Program).study_mode"
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: (item as Program).study_mode?.color ?? undefined,
                            borderColor: (item as Program).study_mode?.color ?? undefined
                        }"
                        :label="(item as Program).study_mode?.name ?? ''" />
                    <span
                        v-else
                        class="text-text-tertiary">
                        {{ $lang.regular || 'Regular' }}
                    </span>
                </template>

                <template #cell-degree_level="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: degreeLevelChip(item as Program)?.color ?? undefined,
                            borderColor: degreeLevelChip(item as Program)?.color ?? undefined
                        }"
                        :label="
                            degreeLevelChip(item as Program)?.name || (item as Program).degree_level?.name || '—'
                        " />
                </template>

                <template #cell-duration_years="{ item }">
                    <span class="text-text-secondary">
                        {{ (item as Program).duration_years }} {{ $lang.years || 'yrs' }}
                    </span>
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as Program).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="
                            (item as Program).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'
                        " />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Program)" />
                </template>
            </MainTable>
        </div>

        <ProgramFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveProgramForm" />

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
