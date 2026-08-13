<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useTimetable } from '@/modules/scheduling/composables/useTimetable';
import { useDropdownOptions } from '@/composables/useDropdownOptions';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import WeekTimeGrid from '@/modules/scheduling/components/WeekTimeGrid.vue';
import MasterTimetableGrid from '@/modules/scheduling/components/MasterTimetableGrid.vue';
import ScheduleViewToggle from '@/modules/scheduling/components/ScheduleViewToggle.vue';
import ScheduleExportMenu from '@/modules/scheduling/components/ScheduleExportMenu.vue';
import ScheduleFilterPanel from '@/modules/scheduling/components/ScheduleFilterPanel.vue';

import GridIcon from '@/assets/icons/GridIcon.vue';
import { useMasterTimetable } from '@/modules/scheduling/composables/useMasterTimetable';
import { useScheduleExport } from '@/modules/scheduling/composables/useScheduleExport';
import { SCHEDULE_VIEW, type ScheduleViewMode } from '@/modules/scheduling/constants/scheduleView';
import { DROPDOWN_PARAM_KEY, STATUS_LIGHT } from '@/config/appConfig';
import type { DropdownOption } from '@/types/CommonTypes';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    events,
    gridDays,
    axisBounds,
    meetings,
    instructorId,
    currentSemester,
    scheduleFilters,
    schedulingConstants,
    load
} = useTimetable();

const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', { [DROPDOWN_PARAM_KEY]: true });

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('timetable', 'Timetable') }]);

// ---- per-cohort grid / master timetable ----------------------------------
const viewMode = ref<ScheduleViewMode>(SCHEDULE_VIEW.CALENDAR);

const master = useMasterTimetable(events, gridDays, schedulingConstants.timeSlots, () =>
    customizeLanguageData('unassignedCohort', 'Unassigned')
);

// ---- export ---------------------------------------------------------------
const { isExporting, exportSchedule } = useScheduleExport(() => ({
    filePrefix: 'class-timetable',
    title: customizeLanguageData('timetable', 'Timetable'),
    subtitle: currentSemester.semester.value?.name,
    days: gridDays.value,
    slots: schedulingConstants.timeSlots.value
}));

/**
 * The session types actually on this timetable, as a legend. Built from what is
 * on screen rather than from the whole catalogue — a legend for a session type
 * nothing uses is noise.
 */
const legend = computed(() => {
    const seen = new Map<string, string>();

    meetings.value.forEach((meeting) => {
        const type = meeting.session_type;
        if (type?.name && !seen.has(type.name)) {
            seen.set(type.name, type.color || 'var(--color-schedule-brand-blue)');
        }
    });

    return [...seen.entries()].map(([name, color]) => ({ name, color }));
});

onMounted(() => {
    load();
    scheduleFilters.load();
    instructorDropdown.fetchOptions();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="GridIcon" />
        </div>

        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="text-text-primary text-xl font-semibold">{{ $lang.timetable || 'Timetable' }}</h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.timetableDesc ||
                        'The published weekly timetable for the current semester. Read-only — adjustments are made on the scheduling screen.'
                    }}
                </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <Badge
                    v-if="currentSemester.semester.value"
                    outlined
                    :variant="STATUS_LIGHT"
                    :label="currentSemester.semester.value.name" />

                <ScheduleViewToggle
                    v-model="viewMode"
                    show-master />

                <ScheduleExportMenu
                    :loading="isExporting"
                    @export="(format: string) => exportSchedule(format, events)" />
            </div>
        </div>

        <!-- ---- narrow it to a cohort, or to one teacher ---- -->
        <ScheduleFilterPanel
            :hint="$lang.timetableFilterHint || 'Narrow the week to a college, department, programme or cohort.'">
            <!-- The teacher's own week — the one dimension outside the hierarchy. -->
            <MainSelect
                v-model="instructorId"
                :label-text="$lang.instructor || 'Instructor'"
                :options="instructorDropdown.options.value"
                option-label="name"
                option-value="id"
                :placeholder="$lang.allInstructors || 'All instructors'"
                size="normal"
                search
                show-clear
                :loading="instructorDropdown.loading.value" />
        </ScheduleFilterPanel>

        <!-- ---- what the block colours mean ---- -->
        <div
            v-if="legend.length"
            class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span
                v-for="entry in legend"
                :key="entry.name"
                class="text-text-tertiary flex items-center gap-1.5 text-xs">
                <span
                    class="h-2.5 w-2.5 rounded-sm"
                    :style="{ backgroundColor: entry.color }" />
                {{ entry.name }}
            </span>
        </div>

        <WeekTimeGrid
            v-if="viewMode === SCHEDULE_VIEW.CALENDAR"
            :days="gridDays"
            :events="events"
            :loading="isLoading"
            :bounds="axisBounds"
            :empty-label="$lang.noPublishedMeetings || 'Nothing published for this semester yet'" />

        <!-- Every cohort on one sheet, banded by department › programme. -->
        <MasterTimetableGrid
            v-else
            :columns="master.columns.value"
            :day-bands="master.dayBands.value"
            :groups="master.groups.value"
            :loading="isLoading"
            :empty-label="$lang.noPublishedMeetings || 'Nothing published for this semester yet'" />
    </div>
</template>
