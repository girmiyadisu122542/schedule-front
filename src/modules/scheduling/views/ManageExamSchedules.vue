<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useExamSchedule } from '@/modules/scheduling/composables/useExamSchedule';
import { useScheduleFilters } from '@/modules/scheduling/composables/useScheduleFilters';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import TextArea from '@/components/common/TextArea.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ExamScheduleFormDialog from '@/modules/scheduling/components/ExamScheduleFormDialog.vue';
import GenerationRunPanel from '@/modules/scheduling/components/GenerationRunPanel.vue';
import MonthCalendarGrid from '@/modules/scheduling/components/MonthCalendarGrid.vue';
import MasterTimetableGrid from '@/modules/scheduling/components/MasterTimetableGrid.vue';
import ScheduleExportMenu from '@/modules/scheduling/components/ScheduleExportMenu.vue';
import ScheduleViewToggle from '@/modules/scheduling/components/ScheduleViewToggle.vue';
import ScheduleFilterPanel from '@/modules/scheduling/components/ScheduleFilterPanel.vue';
import ScheduleCalendarToolbar from '@/modules/scheduling/components/ScheduleCalendarToolbar.vue';
import ScheduleEventDialog from '@/modules/scheduling/components/ScheduleEventDialog.vue';
import type { EventField } from '@/modules/scheduling/components/ScheduleEventDialog.vue';

import CalendarCheckIcon from '@/assets/icons/CalendarCheckIcon.vue';
import { useDatedMasterTimetable } from '@/modules/scheduling/composables/useMasterTimetable';
import { useScheduleExport } from '@/modules/scheduling/composables/useScheduleExport';
import { DEFAULT_PAGE_LIMIT, FIRST_PAGE, STATUS_LIGHT } from '@/config/appConfig';
import { CALENDAR_PAGE_LIMIT, SCHEDULE_VIEW } from '@/modules/scheduling/constants/scheduleView';
import type { ScheduleViewMode } from '@/modules/scheduling/constants/scheduleView';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';
import type { ScheduleEvent } from '@/modules/scheduling/types/calendar';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    exams,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    limit,
    searchQuery,
    fetchExams,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveExamForm,

    calendarEvents,
    weekdayNames,
    currentSemesterFilter,
    semesterDropdown,
    currentSemester,
    schedulingConstants,
    statusFlow,
    isSavingAction,
    confirmDialogVisible,
    confirmTarget,
    confirmRemark,
    submitConfirmation
} = useExamSchedule();

/** College → Department → Program → Section, shared across the scheduling module. */
const scheduleFilters = useScheduleFilters();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('examSchedules', 'Exam Timetable') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const statusChip = (schedule: ExamSchedule) => statusFlow.resolve(schedule.status_code);

// ---- calendar / master / table -------------------------------------------
const viewMode = ref<ScheduleViewMode>(SCHEDULE_VIEW.CALENDAR);
const isCalendar = computed(() => viewMode.value === SCHEDULE_VIEW.CALENDAR);
/** Both grids read the whole exam period, so they share one page size. */
const isGrid = computed(() => viewMode.value !== SCHEDULE_VIEW.TABLE);

const master = useDatedMasterTimetable(calendarEvents, () => customizeLanguageData('unassignedCohort', 'Unassigned'));

const { isExporting, exportSchedule } = useScheduleExport(() => ({
    filePrefix: 'exam-timetable',
    title: customizeLanguageData('examSchedules', 'Exam Timetable'),
    subtitle: currentSemester.semester.value?.name
}));

/**
 * A month is the unit the grid draws, so it takes the whole exam period in one
 * page; the table goes back to normal paging. Both go through the same
 * `fetchItems`, which is what keeps the current search and filters applied.
 */
const setViewMode = (mode: ScheduleViewMode) => {
    if (mode === viewMode.value) return;

    viewMode.value = mode;
    fetchExams({
        page: FIRST_PAGE,
        perPage: mode === SCHEDULE_VIEW.TABLE ? DEFAULT_PAGE_LIMIT : CALENDAR_PAGE_LIMIT
    });
};

// ---- the sitting a reader clicked ----------------------------------------
const peekVisible = ref(false);
const peekTarget = ref<ExamSchedule | null>(null);

const openPeek = (event: ScheduleEvent) => {
    peekTarget.value = event.record as ExamSchedule;
    peekVisible.value = true;
};

const peekStatus = computed(() => (peekTarget.value ? statusChip(peekTarget.value) : null));

/** The sitting in full — everything the table's columns would have shown. */
const peekFields = computed<EventField[]>(() => {
    const exam = peekTarget.value;
    if (!exam) return [];

    return [
        { label: customizeLanguageData('examType', 'Type'), value: exam.exam_type?.name || exam.exam_type_code || '—' },
        { label: customizeLanguageData('examDate', 'Date'), value: exam.exam_date },
        { label: customizeLanguageData('time', 'Time'), value: exam.time_range },
        { label: customizeLanguageData('room', 'Hall'), value: exam.room?.name || '—' },
        {
            label: customizeLanguageData('invigilators', 'Invigilators'),
            value: String(exam.required_invigilators)
        },
        { label: customizeLanguageData('section', 'Section'), value: exam.section?.name || '—' }
    ];
});

/**
 * What the toolbar shows as applied — semester and status. The screen opens
 * scoped to a semester, and the toolbar unmounts on a view switch, so it has to
 * be told what is in force.
 *
 * The academic scope is kept apart because it lives in a shared composable: the
 * two are merged only at the moment of fetching.
 */
const appliedFilters = ref<Record<string, unknown>>({});

const refetchWithFilters = () => handleFilterChange({ ...appliedFilters.value, ...scheduleFilters.params.value });

const applyFilters = (value: Record<string, unknown>) => {
    appliedFilters.value = value;
    refetchWithFilters();
};

/** The panel applies itself — no Apply click between it and the calendar. */
watch(() => scheduleFilters.params.value, refetchWithFilters);

/** The generator just wrote sittings; show that semester's calendar. */
const onGenerated = (semesterId: number) => {
    applyFilters({ semester_id: semesterId });
};

onMounted(async () => {
    // The calendar leads, so the whole exam period arrives in one page — set
    // the size before the first fetch rather than paying for a second one.
    limit.value = CALENDAR_PAGE_LIMIT;

    // useStatusFlow lives inside a shared composable, so its auto-fetch never
    // fires — pull the status catalogue and transition edges explicitly.
    statusFlow.refetch();
    schedulingConstants.load();
    semesterDropdown.fetchOptions();
    scheduleFilters.load();

    applyFilters(await currentSemesterFilter());
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="CalendarCheckIcon" />
        </div>

        <div>
            <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 class="text-text-primary text-xl font-semibold">
                        {{ $lang.examSchedules || 'Exam Timetable' }}
                    </h1>
                    <p class="text-md text-text-tertiary font-normal">
                        {{
                            $lang.examSchedulesDesc ||
                            'The exam period, day by day. An exam can go straight to publication, or via the department for confirmation first.'
                        }}
                    </p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <ScheduleViewToggle
                        show-master
                        :model-value="viewMode"
                        @update:modelValue="setViewMode" />

                    <ScheduleExportMenu
                        :loading="isExporting"
                        @export="(format: string) => exportSchedule(format, calendarEvents)" />
                </div>
            </div>

            <GenerationRunPanel
                v-if="$can('runExamScheduleGeneration')"
                class="mb-6"
                mode="exam"
                :title="$lang.generateExamTimetable || 'Generate the exam timetable'"
                :hint="
                    $lang.generateExamTimetableHint ||
                    'Every registrar-approved offering gets a schedule in a free hall and window. Halls are judged on exam capacity, and clashes are refused by the database.'
                "
                @generated="onGenerated" />

            <!-- Scopes both views: the calendar and the table read one fetch. -->
            <ScheduleFilterPanel
                class="mb-4"
                :hint="
                    $lang.examFilterHint || 'Narrow the exam period to a college, department, programme or cohort.'
                " />

            <!-- ---- the calendar ---- -->
            <div
                v-if="isGrid"
                class="space-y-4">
                <ScheduleCalendarToolbar
                    :filter-fields="filterFields"
                    :loading="isLoading"
                    :initial-search="searchQuery"
                    :initial-filters="appliedFilters"
                    :search-placeholder="$lang.searchSittings || 'Search by course code, title or hall...'"
                    :can-add="$can('createExamSchedule')"
                    :add-label="$lang.createExamSchedule || 'Create Exam Schedule'"
                    @search="handleSearch"
                    @filter-change="applyFilters"
                    @refresh="fetchExams()"
                    @add="openCreateDialog" />

                <MonthCalendarGrid
                    v-if="isCalendar"
                    selectable
                    :events="calendarEvents"
                    :loading="isLoading"
                    :weekday-names="weekdayNames"
                    :empty-label="$lang.noSittingsYet || 'No exam schedules for this semester yet'"
                    @select="openPeek" />

                <!-- Every cohort against every exam date, banded by department › programme. -->
                <MasterTimetableGrid
                    v-else
                    selectable
                    :columns="master.columns.value"
                    :day-bands="master.dayBands.value"
                    :groups="master.groups.value"
                    :loading="isLoading"
                    :empty-label="$lang.noSittingsYet || 'No exam schedules for this semester yet'"
                    @select="openPeek" />
            </div>

            <!-- ---- the table: filters, paging, bulk reading ---- -->
            <MainTable
                v-else
                :columns="tableColumns"
                :items="exams"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchSittings || 'Search by course code, title or hall...'"
                :show-add-button="$can('createExamSchedule')"
                :show-refresh="true"
                @refresh="fetchExams"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchExams({ page })"
                @update:limit="(value: number) => fetchExams({ perPage: value })">
                <template #cell-course_offering="{ item }">
                    <div class="min-w-0">
                        <span class="text-text-primary font-medium">
                            {{ (item as ExamSchedule).course_offering?.course_code || '—' }}
                        </span>
                        <p
                            v-if="(item as ExamSchedule).course_offering?.section_label"
                            class="text-text-tertiary truncate text-xs">
                            {{ (item as ExamSchedule).course_offering?.section_label }}
                        </p>
                    </div>
                </template>

                <template #cell-exam_type_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: (item as ExamSchedule).exam_type?.color ?? undefined,
                            borderColor: (item as ExamSchedule).exam_type?.color ?? undefined
                        }"
                        :label="
                            (item as ExamSchedule).exam_type?.name || (item as ExamSchedule).exam_type_code || '—'
                        " />
                </template>

                <template #cell-exam_date="{ item }">
                    <span class="text-text-secondary tabular-nums">{{ (item as ExamSchedule).exam_date }}</span>
                </template>

                <template #cell-time_range="{ item }">
                    <span class="text-text-secondary tabular-nums">{{ (item as ExamSchedule).time_range }}</span>
                </template>

                <template #cell-room="{ item }">
                    <span class="text-text-secondary">{{ (item as ExamSchedule).room?.name || '—' }}</span>
                </template>

                <template #cell-required_invigilators="{ item }">
                    <span
                        class="bg-surface-subtle text-text-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                        {{ (item as ExamSchedule).required_invigilators }}
                    </span>
                </template>

                <template #cell-status_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: statusChip(item as ExamSchedule)?.color ?? undefined,
                            borderColor: statusChip(item as ExamSchedule)?.color ?? undefined
                        }"
                        :label="statusChip(item as ExamSchedule)?.name || (item as ExamSchedule).status?.name || '—'" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as ExamSchedule)" />
                </template>
            </MainTable>
        </div>

        <!--
            A chip opens into the sitting in full, with the same actions the
            table's row menu offers — one definition, two ways in.
        -->
        <ScheduleEventDialog
            v-model:visible="peekVisible"
            :title="peekTarget?.course_offering?.name || peekTarget?.name || ''"
            :subtitle="peekTarget?.semester?.name"
            :status-label="peekStatus?.name || peekTarget?.status?.name"
            :status-color="peekStatus?.color"
            :fields="peekFields"
            :actions="peekTarget ? getActionOptions(peekTarget) : []" />

        <ExamScheduleFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveExamForm" />

        <!--
            The department's own decision carries a remark; asking for it does
            not, so only this half gets a dialog.
        -->
        <MainDialog
            v-model:visible="confirmDialogVisible"
            :header="$lang.confirmSitting || 'Confirm schedule'"
            max-width="max-w-xl">
            <div class="mx-4 space-y-4 py-1">
                <p class="text-text-secondary text-sm">{{ confirmTarget?.name }}</p>
                <TextArea
                    v-model="confirmRemark"
                    :label="$lang.confirmationRemark || 'Confirmation remark'"
                    :rows="3"
                    :placeholder="$lang.enterConfirmationRemark || 'Optional note on what was agreed'" />
            </div>

            <template #footer>
                <div class="mx-2 flex items-center justify-end gap-3">
                    <MainButton
                        outlined
                        :label="$lang.cancel || 'Cancel'"
                        @click="confirmDialogVisible = false" />
                    <MainButton
                        severity="primary"
                        :label="$lang.confirmSitting || 'Confirm schedule'"
                        :loading="isSavingAction"
                        @click="submitConfirmation" />
                </div>
            </template>
        </MainDialog>

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
