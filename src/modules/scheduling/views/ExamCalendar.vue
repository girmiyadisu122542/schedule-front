<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useExamCalendar } from '@/modules/scheduling/composables/useExamCalendar';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MonthCalendarGrid from '@/modules/scheduling/components/MonthCalendarGrid.vue';
import MasterTimetableGrid from '@/modules/scheduling/components/MasterTimetableGrid.vue';
import ScheduleViewToggle from '@/modules/scheduling/components/ScheduleViewToggle.vue';
import ScheduleExportMenu from '@/modules/scheduling/components/ScheduleExportMenu.vue';
import ScheduleFilterPanel from '@/modules/scheduling/components/ScheduleFilterPanel.vue';

import TravelDatesCalendar from '@/assets/icons/TravelDatesCalendar.vue';
import { useDatedMasterTimetable } from '@/modules/scheduling/composables/useMasterTimetable';
import { useScheduleExport } from '@/modules/scheduling/composables/useScheduleExport';
import { SCHEDULE_VIEW, type ScheduleViewMode } from '@/modules/scheduling/constants/scheduleView';
import { STATUS_LIGHT } from '@/config/appConfig';

const { customizeLanguageData } = useLanguageStore();
const { isLoading, events, weekdayNames, sittings, currentSemester, scheduleFilters, load } = useExamCalendar();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('examCalendar', 'Exam Calendar') }]);

// ---- month calendar / master timetable -----------------------------------
const viewMode = ref<ScheduleViewMode>(SCHEDULE_VIEW.CALENDAR);

const master = useDatedMasterTimetable(events, () => customizeLanguageData('unassignedCohort', 'Unassigned'));

// Exams are dated, so the export prints a listing rather than a weekly grid.
const { isExporting, exportSchedule } = useScheduleExport(() => ({
    filePrefix: 'exam-calendar',
    title: customizeLanguageData('examCalendar', 'Exam Calendar'),
    subtitle: currentSemester.semester.value?.name
}));

/** The exam types actually on this calendar, as a legend. */
const legend = computed(() => {
    const seen = new Map<string, string>();

    sittings.value.forEach((sitting) => {
        const type = sitting.exam_type;
        if (type?.name && !seen.has(type.name)) {
            seen.set(type.name, type.color || 'var(--color-schedule-brand-blue)');
        }
    });

    return [...seen.entries()].map(([name, color]) => ({ name, color }));
});

onMounted(() => {
    load();
    scheduleFilters.load();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="TravelDatesCalendar" />
        </div>

        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="text-text-primary text-xl font-semibold">{{ $lang.examCalendar || 'Exam Calendar' }}</h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.examCalendarDesc ||
                        'The published exam calendar for the current semester, day by day. Read-only.'
                    }}
                </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <span
                    v-for="entry in legend"
                    :key="entry.name"
                    class="text-text-tertiary flex items-center gap-1.5 text-xs">
                    <span
                        class="h-2.5 w-2.5 rounded-sm"
                        :style="{ backgroundColor: entry.color }" />
                    {{ entry.name }}
                </span>

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

        <ScheduleFilterPanel
            :hint="
                $lang.examCalendarFilterHint || 'Narrow the exam period to a college, department, programme or cohort.'
            " />

        <MonthCalendarGrid
            v-if="viewMode === SCHEDULE_VIEW.CALENDAR"
            :events="events"
            :loading="isLoading"
            :weekday-names="weekdayNames"
            :empty-label="$lang.noPublishedExams || 'Nothing published for this semester yet'" />

        <!-- Every cohort against every exam date, banded by department › programme. -->
        <MasterTimetableGrid
            v-else
            :columns="master.columns.value"
            :day-bands="master.dayBands.value"
            :groups="master.groups.value"
            :loading="isLoading"
            :empty-label="$lang.noPublishedExams || 'Nothing published for this semester yet'" />
    </div>
</template>
