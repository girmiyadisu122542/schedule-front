<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { roomLabel } from '@/modules/scheduling/utils/roomLabel';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useClassSchedule } from '@/modules/scheduling/composables/useClassSchedule';
import { useScheduleFilters } from '@/modules/scheduling/composables/useScheduleFilters';
import { updateClassSchedule } from '@/modules/scheduling/services/classScheduleService';
import { CLASS_SCHEDULE_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import { readApiErrorMessage } from '@/utils/apiError';

import StatusBadge from '@/components/common/StatusBadge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import BulkResultDialog from '@/components/common/BulkResultDialog.vue';
import type { BulkAction } from '@/components/common/MainTable.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import InlineSelect from '@/components/common/InlineSelect.vue';
import TimePickerField from '@/components/common/TimePickerField.vue';
import ClassScheduleFormDialog from '@/modules/scheduling/components/ClassScheduleFormDialog.vue';
import GenerationRunPanel from '@/modules/scheduling/components/GenerationRunPanel.vue';
import WeekTimeGrid from '@/modules/scheduling/components/WeekTimeGrid.vue';
import MasterTimetableGrid from '@/modules/scheduling/components/MasterTimetableGrid.vue';
import ScheduleExportMenu from '@/modules/scheduling/components/ScheduleExportMenu.vue';
import ScheduleViewToggle from '@/modules/scheduling/components/ScheduleViewToggle.vue';
import ScheduleFilterPanel from '@/modules/scheduling/components/ScheduleFilterPanel.vue';
import ScheduleCalendarToolbar from '@/modules/scheduling/components/ScheduleCalendarToolbar.vue';
import ScheduleEventDialog from '@/modules/scheduling/components/ScheduleEventDialog.vue';
import type { EventField } from '@/modules/scheduling/components/ScheduleEventDialog.vue';

import Calendar from '@/assets/icons/Calendar.vue';
import { useMasterTimetable } from '@/modules/scheduling/composables/useMasterTimetable';
import { useScheduleExport } from '@/modules/scheduling/composables/useScheduleExport';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DEFAULT_PAGE_LIMIT, DROPDOWN_PARAM_KEY, FIRST_PAGE } from '@/config/appConfig';
import { CALENDAR_PAGE_LIMIT, SCHEDULE_VIEW } from '@/modules/scheduling/constants/scheduleView';
import type { ScheduleViewMode } from '@/modules/scheduling/constants/scheduleView';
import type { ClassSchedule } from '@/modules/scheduling/types/classSchedule';
import type { ScheduleEvent } from '@/modules/scheduling/types/calendar';
import type { DropdownOption } from '@/types/CommonTypes';

const { customizeLanguageData } = useLanguageStore();
const allowedRoutesStore = useAllowedRoutesStore();
const {
    isLoading,
    schedules,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    limit,
    fetchSchedules,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    runBulkAction,
    bulkResultVisible,
    bulkResult,
    openCreateDialog,
    saveScheduleForm,
    isEditable,
    saveInlineEdit,
    savingRowId,

    searchQuery,
    calendarEvents,
    gridDays,
    axisBounds,
    currentSemesterFilter,
    semesterDropdown,
    currentSemester,
    statusFlow,
    schedulingConstants,
    hasActiveFilters
} = useClassSchedule();

/** College → Department → Program → Section, shared across the scheduling module. */
const scheduleFilters = useScheduleFilters();

/** Catalogues the inline room / instructor cells pick from. */
const roomDropdown = useDropdownOptions<DropdownOption>('/rooms', { [DROPDOWN_PARAM_KEY]: true });
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', {
    [DROPDOWN_PARAM_KEY]: true,
    can_teach: true
});

/**
 * A session was dragged onto another day (C16).
 *
 * Written straight through the ordinary update endpoint, so every EXCLUDE
 * constraint still applies — a drop onto an occupied slot comes back as a
 * translated 422 and the list is refetched, which puts the block back where it
 * was. That refetch IS the revert: no optimistic local mutation to unwind, and
 * no way for the screen to disagree with the database.
 */
const moveToDay = async ({ event, day }: { event: ScheduleEvent; day: number }) => {
    const schedule = schedules.value.data.find((row: ClassSchedule) => row.id === event.id);
    if (!schedule) return;

    // A published session is not moved by a gesture. People have been told
    // when to turn up, and a drag is too easy to do by accident.
    if (schedule.status_code === CLASS_SCHEDULE_STATUS.PUBLISHED) {
        toast.error(
            customizeLanguageData(
                'cannotDragPublished',
                'A published session cannot be dragged. Cancel it and schedule again.'
            )
        );

        return;
    }

    try {
        const result = await updateClassSchedule(schedule.id, {
            course_offering_id: schedule.course_offering_id,
            instructor_id: schedule.instructor_id ?? null,
            room_id: schedule.room_id ?? null,
            session_type_lookup_value_id: schedule.session_type_lookup_value_id ?? null,
            day_of_week: day,
            start_time: schedule.start_time,
            end_time: schedule.end_time
        });

        toast.success(result.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
    } catch (error: unknown) {
        toast.error(readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong')));
    } finally {
        // Whether it stuck or not, the grid is redrawn from the server.
        await fetchSchedules();
    }
};

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('classSchedules', 'Class Timetable') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const statusChip = (schedule: ClassSchedule) => statusFlow.resolve(schedule.status_code);

/**
 * Whether this row's cells accept an edit right now: only drafts are editable,
 * and only when no save is already in flight for the row.
 */
const canEditInline = (schedule: ClassSchedule) =>
    isEditable(schedule) && allowedRoutesStore.can('updateClassSchedule') && savingRowId.value !== schedule.id;

// ---- calendar / master / table -------------------------------------------
const viewMode = ref<ScheduleViewMode>(SCHEDULE_VIEW.CALENDAR);
const isCalendar = computed(() => viewMode.value === SCHEDULE_VIEW.CALENDAR);
const isMaster = computed(() => viewMode.value === SCHEDULE_VIEW.MASTER);
/** Both grids read the whole semester, so they share one page size. */
const isGrid = computed(() => isCalendar.value || isMaster.value);

const master = useMasterTimetable(calendarEvents, gridDays, schedulingConstants.timeSlots, () =>
    customizeLanguageData('unassignedCohort', 'Unassigned')
);

const { isExporting, exportSchedule } = useScheduleExport(() => ({
    filePrefix: 'class-timetable',
    title: customizeLanguageData('classSchedules', 'Class Timetable'),
    subtitle: currentSemester.semester.value?.name,
    days: gridDays.value,
    slots: schedulingConstants.timeSlots.value
}));

/**
 * A week is the unit the grid draws, so it takes the whole semester in one
 * page; the table goes back to normal paging. Both go through the same
 * `fetchItems`, which is what keeps the current search and filters applied.
 */
const setViewMode = (mode: ScheduleViewMode) => {
    if (mode === viewMode.value) return;

    viewMode.value = mode;
    fetchSchedules({
        page: FIRST_PAGE,
        perPage: mode === SCHEDULE_VIEW.TABLE ? DEFAULT_PAGE_LIMIT : CALENDAR_PAGE_LIMIT
    });
};

// ---- the block a reader clicked ------------------------------------------
const peekVisible = ref(false);
const peekTarget = ref<ClassSchedule | null>(null);

const openPeek = (event: ScheduleEvent) => {
    peekTarget.value = event.record as ClassSchedule;
    peekVisible.value = true;
};

/** The open block's status chip, or null when nothing is open. */
const peekStatus = computed(() => (peekTarget.value ? statusChip(peekTarget.value) : null));

/** The session in full — everything the table's columns would have shown. */
const peekFields = computed<EventField[]>(() => {
    const schedule = peekTarget.value;
    if (!schedule) return [];

    return [
        { label: customizeLanguageData('dayOfWeek', 'Day'), value: schedulingConstants.dayName(schedule.day_of_week) },
        { label: customizeLanguageData('time', 'Time'), value: schedule.time_range },
        { label: customizeLanguageData('room', 'Room'), value: roomLabel(schedule.room) },
        { label: customizeLanguageData('instructor', 'Instructor'), value: schedule.instructor?.name || '—' },
        { label: customizeLanguageData('sessionType', 'Session'), value: schedule.session_type?.name || '—' },
        { label: customizeLanguageData('section', 'Section'), value: schedule.section?.name || '—' }
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

/** The panel applies itself — no Apply click between it and the grid. */
watch(() => scheduleFilters.params.value, refetchWithFilters);

/** The generator just wrote rows; show that semester's timetable. */
const onGenerated = (semesterId: number) => {
    applyFilters({ semester_id: semesterId });
};

onMounted(async () => {
    // The calendar leads, so the whole semester arrives in one page — set the
    // size before the first fetch rather than paying for a second one.
    limit.value = CALENDAR_PAGE_LIMIT;

    // useStatusFlow lives inside a shared composable, so its auto-fetch never
    // fires — pull the status catalogue and transition edges explicitly.
    statusFlow.refetch();
    schedulingConstants.load();
    semesterDropdown.fetchOptions();
    roomDropdown.fetchOptions();
    instructorDropdown.fetchOptions();
    scheduleFilters.load();

    applyFilters(await currentSemesterFilter());
});

/**
 * Lifecycle decisions over the selected rows.
 *
 * Each action is offered only when the user holds its permission — the same
 * keys the single-row menu checks. The server still re-checks per row, so this
 * is about not showing a button that would always be refused, not about
 * enforcement.
 */
const allowedRoutes = useAllowedRoutesStore();

const bulkActions = computed<BulkAction[]>(() => {
    const actions: BulkAction[] = [];

    if (allowedRoutes.can('publishClassSchedule')) {
        actions.push({
            label: customizeLanguageData('publish', 'Publish'),
            onClick: (rows: unknown[]) => runBulkAction(rows as ClassSchedule[], 'publish')
        });
    }

    if (allowedRoutes.can('confirmClassSchedule')) {
        actions.push({
            label: customizeLanguageData('confirm', 'Confirm'),
            onClick: (rows: unknown[]) => runBulkAction(rows as ClassSchedule[], 'confirm')
        });
    }

    if (allowedRoutes.can('cancelClassSchedule')) {
        actions.push({
            label: customizeLanguageData('cancel', 'Cancel'),
            onClick: (rows: unknown[]) => runBulkAction(rows as ClassSchedule[], 'cancel')
        });
    }

    if (allowedRoutes.can('deleteClassSchedule')) {
        actions.push({
            label: customizeLanguageData('delete', 'Delete'),
            onClick: (rows: unknown[]) => runBulkAction(rows as ClassSchedule[], 'delete')
        });
    }

    return actions;
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
            <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 class="text-text-primary text-xl font-semibold">
                        {{ $lang.classSchedules || 'Class Timetable' }}
                    </h1>
                    <p class="text-md text-text-tertiary font-normal">
                        {{
                            $lang.classSchedulesDesc ||
                            'The weekly grid for the semester. Generate a draft timetable, adjust it, then publish — a published schedule is cancelled rather than deleted.'
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
                v-if="$can('runClassScheduleGeneration')"
                class="mb-6"
                @generated="onGenerated" />

            <!-- Scopes both views: the grid and the table read one fetch. -->
            <ScheduleFilterPanel
                class="mb-4"
                :hint="
                    $lang.classFilterHint || 'Narrow the timetable to a college, department, programme or section.'
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
                    :search-placeholder="$lang.searchSchedules || 'Search by course code, title or room...'"
                    :can-add="$can('createClassSchedule')"
                    :add-label="$lang.createClassSchedule || 'Create Class Schedule'"
                    @search="handleSearch"
                    @filter-change="applyFilters"
                    @refresh="fetchSchedules()"
                    @add="openCreateDialog" />

                <WeekTimeGrid
                    v-if="isCalendar"
                    selectable
                    :days="gridDays"
                    :events="calendarEvents"
                    :loading="isLoading"
                    :bounds="axisBounds"
                    :draggable="$can('updateClassSchedule')"
                    :empty-label="$lang.noClassSessionsYet || 'No class schedules for this semester yet'"
                    @select="openPeek"
                    @move="moveToDay" />

                <!-- Every cohort on one sheet, banded by department › programme. -->
                <MasterTimetableGrid
                    v-else
                    selectable
                    :columns="master.columns.value"
                    :day-bands="master.dayBands.value"
                    :groups="master.groups.value"
                    :loading="isLoading"
                    :empty-label="$lang.noClassSessionsYet || 'No class schedules for this semester yet'"
                    @select="openPeek" />
            </div>

            <!-- ---- the table: filters, inline edits, paging ---- -->
            <MainTable
                v-else
                :columns="tableColumns"
                :items="schedules"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchSchedules || 'Search by course code, title or room...'"
                :show-add-button="$can('createClassSchedule')"
                :show-refresh="true"
                selectable
                :bulk-actions="bulkActions"
                @refresh="fetchSchedules"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchSchedules({ page })"
                @update:limit="(value: number) => fetchSchedules({ perPage: value })">
                <template #empty>
                    <EmptyState
                        :title="$lang.noClassSessionsYet || 'No class schedules for this semester yet'"
                        :hint="
                            $lang.noClassSessionsYetHint ||
                            'Generate the timetable from approved offerings, or add a session by hand.'
                        "
                        :action-label="$can('createClassSchedule') ? $lang.createClassSession || 'Add a session' : ''"
                        :is-filtered="hasActiveFilters"
                        @action="openCreateDialog" />
                </template>

                <template #cell-course_offering="{ item }">
                    <div class="min-w-0">
                        <span class="text-text-primary font-medium">
                            {{ (item as ClassSchedule).course_offering?.course_code || '—' }}
                        </span>
                        <p
                            v-if="(item as ClassSchedule).course_offering?.section_label"
                            class="text-text-tertiary truncate text-xs">
                            {{ (item as ClassSchedule).course_offering?.section_label }}
                        </p>
                    </div>
                </template>

                <!--
                    Draft rows are edited in place. A published or cancelled row
                    renders no edit control at all — the backend refuses the
                    write, so offering it would only mislead.
                -->
                <template #cell-day_of_week="{ item }">
                    <InlineSelect
                        v-if="canEditInline(item as ClassSchedule)"
                        :model-value="(item as ClassSchedule).day_of_week"
                        :options="schedulingConstants.dayOptions.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectDay || 'Select a day'"
                        size="small"
                        @update:modelValue="
                            (value: unknown) => saveInlineEdit(item as ClassSchedule, { day_of_week: Number(value) })
                        " />
                    <span
                        v-else
                        class="text-text-secondary">
                        {{ schedulingConstants.dayName((item as ClassSchedule).day_of_week) }}
                    </span>
                </template>

                <template #cell-time_range="{ item }">
                    <div
                        v-if="canEditInline(item as ClassSchedule)"
                        class="flex items-center gap-1">
                        <TimePickerField
                            use24h
                            :minute-step="5"
                            :model-value="(item as ClassSchedule).start_time"
                            :placeholder="$lang.selectStartTime || '08:00'"
                            @update:modelValue="
                                (value: string) => saveInlineEdit(item as ClassSchedule, { start_time: value })
                            " />
                        <span class="text-text-tertiary">–</span>
                        <TimePickerField
                            use24h
                            :minute-step="5"
                            :model-value="(item as ClassSchedule).end_time"
                            :placeholder="$lang.selectEndTime || '09:30'"
                            @update:modelValue="
                                (value: string) => saveInlineEdit(item as ClassSchedule, { end_time: value })
                            " />
                    </div>
                    <span
                        v-else
                        class="text-text-secondary tabular-nums">
                        {{ (item as ClassSchedule).time_range }}
                    </span>
                </template>

                <template #cell-room="{ item }">
                    <InlineSelect
                        v-if="canEditInline(item as ClassSchedule)"
                        :model-value="(item as ClassSchedule).room_id"
                        :options="roomDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectRoom || 'Select a room'"
                        size="small"
                        search
                        show-clear
                        :loading="roomDropdown.loading.value"
                        @update:modelValue="
                            (value: unknown) =>
                                saveInlineEdit(item as ClassSchedule, {
                                    room_id: value === null ? null : Number(value)
                                })
                        " />
                    <span
                        v-else
                        class="text-text-secondary">
                        {{ roomLabel((item as ClassSchedule).room) }}
                    </span>
                </template>

                <template #cell-instructor="{ item }">
                    <InlineSelect
                        v-if="canEditInline(item as ClassSchedule)"
                        :model-value="(item as ClassSchedule).instructor_id"
                        :options="instructorDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectInstructor || 'Select an instructor'"
                        size="small"
                        search
                        show-clear
                        :loading="instructorDropdown.loading.value"
                        @update:modelValue="
                            (value: unknown) =>
                                saveInlineEdit(item as ClassSchedule, {
                                    instructor_id: value === null ? null : Number(value)
                                })
                        " />
                    <span
                        v-else
                        class="text-text-secondary">
                        {{ (item as ClassSchedule).instructor?.name || '—' }}
                    </span>
                </template>

                <template #cell-session_type_code="{ item }">
                    <StatusBadge
                        v-if="(item as ClassSchedule).session_type"
                        :value="(item as ClassSchedule).session_type" />
                    <span v-else>—</span>
                </template>

                <template #cell-status_code="{ item }">
                    <StatusBadge
                        :value="statusChip(item as ClassSchedule)"
                        :fallback="(item as ClassSchedule).status?.name" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as ClassSchedule)" />
                </template>
            </MainTable>
        </div>

        <!--
            A block opens into the session in full, with the same actions the
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

        <ClassScheduleFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveScheduleForm" />

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

        <BulkResultDialog
            v-model:visible="bulkResultVisible"
            :succeeded="bulkResult.succeeded"
            :failed="bulkResult.failed" />
    </div>
</template>
