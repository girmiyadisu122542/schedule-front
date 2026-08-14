<script setup lang="ts">
import { SCHEDULE_VIEW } from '@/modules/scheduling/constants/scheduleView';
import type { ScheduleViewMode } from '@/modules/scheduling/constants/scheduleView';

import Calendar from '@/assets/icons/Calendar.vue';
import GridIcon from '@/assets/icons/GridIcon.vue';
import ListIcon from '@/assets/icons/ListIcon.vue';

/**
 * Calendar / table switch for the scheduling screens.
 *
 * The calendar is what a timetable IS, so it leads; the table is still there
 * because that is where bulk work happens — filters, inline edits, paging
 * through a long semester.
 */
defineProps<{
    modelValue: ScheduleViewMode;
    calendarLabel?: string;
    tableLabel?: string;
    /** False on screens with no cohort dimension to lay out. */
    showMaster?: boolean;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: ScheduleViewMode): void }>();
</script>

<template>
    <div class="border-border-default bg-surface-subtle inline-flex items-center gap-1 rounded-lg border p-1">
        <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            :class="
                modelValue === SCHEDULE_VIEW.CALENDAR
                    ? 'bg-surface-card text-text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
            "
            :title="$lang.calendarViewHint || 'One section at a time, laid out by day and time'"
            @click="emit('update:modelValue', SCHEDULE_VIEW.CALENDAR)">
            <Calendar class="h-4 w-4" />
            {{ calendarLabel || $lang.calendarView || 'Calendar' }}
        </button>

        <button
            v-if="showMaster"
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            :class="
                modelValue === SCHEDULE_VIEW.MASTER
                    ? 'bg-surface-card text-text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
            "
            :title="$lang.masterViewHint || 'Every section on one sheet, to spot gaps and clashes'"
            @click="emit('update:modelValue', SCHEDULE_VIEW.MASTER)">
            <GridIcon class="h-4 w-4" />
            {{ $lang.masterView || 'All Sections' }}
        </button>

        <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            :class="
                modelValue === SCHEDULE_VIEW.TABLE
                    ? 'bg-surface-card text-text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
            "
            :title="$lang.tableViewHint || 'One row per schedule, for filtering and editing'"
            @click="emit('update:modelValue', SCHEDULE_VIEW.TABLE)">
            <ListIcon class="h-4 w-4" />
            {{ tableLabel || $lang.tableView || 'List' }}
        </button>
    </div>
</template>
