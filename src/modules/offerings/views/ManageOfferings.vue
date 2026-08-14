<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useOffering } from '@/modules/offerings/composables/useOffering';

import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainSearch from '@/components/common/MainSearch.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import Pagination from '@/components/common/Pagination.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ExportMenu from '@/components/common/ExportMenu.vue';
import ImportDialog from '@/components/common/ImportDialog.vue';
import OfferingFormDialog from '@/modules/offerings/components/OfferingFormDialog.vue';
import OfferingCard from '@/modules/offerings/components/OfferingCard.vue';
import DecisionDialog from '@/modules/offerings/components/DecisionDialog.vue';
import OfferingBoard from '@/modules/offerings/components/OfferingBoard.vue';
import OfferingViewToggle from '@/modules/offerings/components/OfferingViewToggle.vue';
import MainTable from '@/components/common/MainTable.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';

import FileText from '@/assets/icons/FileText.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import ImportIcon from '@/assets/icons/ImportIcon.vue';

import type { Offering } from '@/modules/offerings/types/offering';
import { OFFERING_VIEW } from '@/modules/offerings/constants/offeringView';
import router from '@/router';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    offerings,
    groupedOfferings,
    hasActiveFilters,
    confirmState,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    fetchOfferings,
    handleSearch,
    getActionOptions,
    openCreateDialog,
    saveOfferingForm,

    statusFlow,
    filters,

    viewMode,
    isBoard,
    setViewMode,

    tableColumns,
    activeQueue,
    queueTabs,
    selectQueue,
    applyFilters,
    clearFilters,

    canDecide,
    tierIndex,
    decisionDialogVisible,
    decisionTarget,
    decisionCode,
    decisionRemark,
    isDeciding,
    openDecision,
    closeDecision,
    submitDecision,

    canExport,
    canImport,
    isExporting,
    isUploading,
    isDownloadingTemplate,
    importDialogVisible,
    mode,
    report,
    hasPreviewed,
    canCommit,
    rowsToWrite,
    entityLabel,
    importOrderHint,
    openImportDialog,
    closeImportDialog,
    setFile,
    setMode,
    previewImport,
    confirmImport,
    exportList,
    downloadTemplate
} = useOffering();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('courseOfferings', 'Course Offerings') }]);

const isEmpty = computed(() => !isLoading.value && offerings.value.data.length === 0);

onMounted(() => {
    fetchOfferings();
    // `useStatusFlow` lives inside a shared composable, so its auto-fetch never
    // fires — pull the status catalogue explicitly.
    statusFlow.refetch();
    filters.load();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="FileText" />
        </div>

        <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.courseOfferings || 'Course Offerings' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageOfferingsDesc ||
                        'Committee → Department Head → College → Registrar. Only registrar-approved offerings can be scheduled.'
                    }}
                </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
                <OfferingViewToggle
                    :model-value="viewMode"
                    @update:model-value="setViewMode" />

                <ExportMenu
                    v-if="canExport"
                    :is-exporting="isExporting"
                    @export="exportList" />
                <MainButton
                    v-if="canImport"
                    :label="$lang.import || 'Import'"
                    :icon="ImportIcon"
                    outlined
                    size="small"
                    @click="openImportDialog" />
                <MainButton
                    v-if="$can('createCourseOffering')"
                    :label="$lang.newDraft || 'New draft'"
                    :icon="PlusIcon"
                    size="small"
                    @click="openCreateDialog" />
            </div>
        </div>

        <!-- Queue tabs. "Awaiting me" is the whole reason this screen exists:
             it is resolved server-side from the tiers this user holds and the
             departments they may act on. -->
        <div
            v-if="!isBoard"
            class="border-border-default flex flex-wrap gap-1 border-b">
            <button
                v-for="tab in queueTabs"
                :key="tab.value"
                type="button"
                class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition"
                :class="
                    activeQueue === tab.value
                        ? 'border-schedule-brand-blue text-schedule-brand-blue'
                        : 'text-text-tertiary hover:text-text-secondary border-transparent'
                "
                @click="selectQueue(tab.value)">
                {{ tab.label }}
                <span
                    v-if="tab.count"
                    class="bg-surface-subtle text-text-secondary ml-1 rounded-full px-2 py-0.5 text-xs">
                    {{ tab.count }}
                </span>
            </button>
        </div>

        <!-- College → Department → Programme → Course cascade, plus the axes
             that narrow a different dimension and so never clear it. -->
        <div class="border-border-default bg-surface-muted space-y-3 rounded-xl border p-3">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <MainSelect
                    v-if="filters.showCollege.value"
                    v-model="filters.collegeId.value"
                    :label-text="$lang.college || 'College'"
                    :options="filters.collegeDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.allColleges || 'All colleges'"
                    size="normal"
                    @update:model-value="applyFilters" />
                <MainSelect
                    v-if="filters.showDepartment.value"
                    v-model="filters.departmentId.value"
                    :label-text="$lang.department || 'Department'"
                    :options="filters.departmentOptions.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.allDepartments || 'All departments'"
                    size="normal"
                    @update:model-value="applyFilters" />
                <MainSelect
                    v-model="filters.programId.value"
                    :label-text="$lang.program || 'Program'"
                    :options="filters.programDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.allPrograms || 'All programs'"
                    size="normal"
                    @update:model-value="applyFilters" />
                <MainSelect
                    v-model="filters.sectionId.value"
                    :label-text="$lang.section || 'Section'"
                    :options="filters.sectionDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.allSections || 'All sections'"
                    size="normal"
                    @update:model-value="applyFilters" />
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Course and instructor hang off the DEPARTMENT, not the
                     programme, so they narrow with it and are disabled until one
                     is chosen — offering every course in the institution is a
                     list nobody can find anything in. -->
                <MainSelect
                    v-model="filters.courseId.value"
                    :label-text="$lang.course || 'Course'"
                    :options="filters.courseDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="
                        filters.departmentId.value
                            ? $lang.allCourses || 'All courses'
                            : $lang.selectDepartmentFirst || 'Select a department first'
                    "
                    :disabled="!filters.departmentId.value"
                    size="normal"
                    search
                    :loading="filters.courseDropdown.loading.value"
                    @update:model-value="applyFilters" />
                <MainSelect
                    v-model="filters.instructorId.value"
                    :label-text="$lang.instructor || 'Instructor'"
                    :options="filters.instructorDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="
                        filters.departmentId.value
                            ? $lang.allInstructors || 'All instructors'
                            : $lang.selectDepartmentFirst || 'Select a department first'
                    "
                    :disabled="!filters.departmentId.value"
                    size="normal"
                    search
                    :loading="filters.instructorDropdown.loading.value"
                    @update:model-value="applyFilters" />
                <div class="flex items-end">
                    <MainButton
                        :label="$lang.clearFilters || 'Clear filters'"
                        text
                        size="small"
                        @click="clearFilters" />
                </div>
            </div>

            <!-- Free text stays, but as a search across code and title — not as
                 the only way to reach a course. -->
            <!-- `is-server-side` is required, not decorative: without it
                 MainSearch emits `update:modelValue` and never `search`, so the
                 box types but filters nothing. -->
            <MainSearch
                :placeholder="$lang.searchOfferings || 'Search by course code or title...'"
                is-server-side
                @search="handleSearch" />
        </div>

        <Skeleton
            v-if="isLoading"
            :rows="4" />

        <EmptyState
            v-else-if="isEmpty"
            :is-filtered="hasActiveFilters || filters.hasAny.value"
            :title="$lang.noOfferingsHere || 'Nothing offered here yet.'" />

        <!-- BOARD — every column at once, so a tall one names the bottleneck. -->
        <OfferingBoard
            v-else-if="isBoard"
            :offerings="offerings.data"
            :can-decide="canDecide"
            @decide="openDecision"
            @open="(item: Offering) => router.push(`/offerings/${item.uuid}`)" />

        <!-- CARDS — grouped by department, then section: the two axes a plan is
             read by. Repeating the department on every row would be noise. -->
        <div
            v-else-if="viewMode === OFFERING_VIEW.CARDS"
            class="space-y-6">
            <section
                v-for="group in groupedOfferings"
                :key="group.key"
                class="space-y-3">
                <h2 class="text-text-secondary text-sm font-semibold">
                    {{ group.label }}
                    <span class="text-text-tertiary font-normal">· {{ group.offerings.length }}</span>
                </h2>

                <div class="space-y-2">
                    <OfferingCard
                        v-for="offering in group.offerings"
                        :key="offering.id"
                        :offering="offering"
                        :tier-index="tierIndex(offering)"
                        :can-decide="canDecide(offering)"
                        :actions="getActionOptions(offering)"
                        :status-value="statusFlow.resolve(offering.status_code)"
                        @decide="openDecision"
                        @open="(item: Offering) => router.push(`/offerings/${item.uuid}`)" />
                </div>
            </section>

            <Pagination
                :pagination="offerings.pagination"
                @update:currentPage="(page: number) => fetchOfferings({ page })"
                @update:limit="(value: number) => fetchOfferings({ perPage: value })" />
        </div>

        <!-- TABLE — dense and comparable, for paging through a whole faculty. -->
        <MainTable
            v-else
            :columns="tableColumns"
            :items="offerings"
            :loading="isLoading"
            css-clases="rounded-2xl"
            :show-search="false"
            :show-filter="false"
            :show-add-button="false"
            @update:currentPage="(page: number) => fetchOfferings({ page })"
            @update:limit="(value: number) => fetchOfferings({ perPage: value })">
            <template #cell-course="{ item }">
                <div class="flex flex-col">
                    <span class="text-text-primary font-medium">{{ (item as Offering).course?.code }}</span>
                    <span class="text-text-tertiary text-xs">{{ (item as Offering).course?.name }}</span>
                </div>
            </template>

            <template #cell-section="{ item }">
                <span class="text-text-secondary">
                    {{ (item as Offering).section?.name || (item as Offering).program?.name || '—' }}
                </span>
            </template>

            <template #cell-instructor="{ item }">
                <span class="text-text-secondary">{{ (item as Offering).instructor?.name || '—' }}</span>
            </template>

            <template #cell-status_code="{ item }">
                <StatusBadge
                    :value="statusFlow.resolve((item as Offering).status_code)"
                    :fallback="(item as Offering).status_code ?? ''" />
            </template>

            <template #action="{ item }">
                <ActionMenu :options="getActionOptions(item as Offering)" />
            </template>
        </MainTable>

        <OfferingFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveOfferingForm" />

        <DecisionDialog
            :visible="decisionDialogVisible"
            :offering="decisionTarget"
            :decision="decisionCode"
            :remark="decisionRemark"
            :is-saving="isDeciding"
            @update:visible="closeDecision"
            @update:remark="(value: string) => (decisionRemark = value)"
            @confirm="submitDecision" />

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

        <ConfirmDialog
            v-model:show="confirmState.show"
            :title="confirmState.title"
            :message="confirmState.message"
            :item-label="confirmState.itemLabel"
            :item-name="confirmState.itemName"
            :confirm-label="confirmState.confirmLabel"
            :cancel-label="$lang.cancel"
            :type="confirmState.type"
            :loading="confirmState.loading"
            @confirm="confirmState.onConfirm" />
    </div>
</template>
