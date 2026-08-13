<script setup lang="ts">
import { computed, ref, toRef, onMounted, onBeforeUnmount } from 'vue';

import {
    useWeekGridLayout,
    toClock,
    isoWeekday,
    DEFAULT_AXIS_START,
    DEFAULT_AXIS_END
} from '@/modules/scheduling/composables/useCalendarLayout';
import type { DayOption } from '@/modules/scheduling/types/classSchedule';
import type { ScheduleEvent } from '@/modules/scheduling/types/calendar';

import Skeleton from '@/components/common/Skeleton.vue';

/**
 * The standard weekly time grid: an hour axis down the left, one column per
 * weekday, and every meeting drawn as a block whose height IS its duration.
 *
 * It knows nothing about class meetings — the host maps its rows onto
 * `ScheduleEvent` and gets the original back on `select`. Overlapping blocks are
 * laid out side by side rather than stacked, so nothing is ever hidden.
 */
const props = withDefaults(
    defineProps<{
        /** The columns, in order. */
        days: DayOption[];
        events: ScheduleEvent[];
        loading?: boolean;
        /** Clock bounds the axis covers even when nothing is scheduled then. */
        bounds?: { start?: string; end?: string };
        /** Whether a block responds to a click. */
        selectable?: boolean;
        /** Shown over the grid when there is nothing to place. */
        emptyLabel?: string;
        /** Tint today's column and draw the current-time line. */
        highlightToday?: boolean;
    }>(),
    {
        loading: false,
        bounds: () => ({ start: DEFAULT_AXIS_START, end: DEFAULT_AXIS_END }),
        selectable: false,
        emptyLabel: '',
        highlightToday: true
    }
);

const emit = defineEmits<{ (e: 'select', event: ScheduleEvent): void }>();

/** One hour of the axis, in pixels. Everything else is a percentage of the span. */
const HOUR_HEIGHT = 68;
/** How often the current-time line catches up, in milliseconds. */
const NOW_TICK_MS = 60_000;

const { axisStart, axisEnd, hourMarks, columns } = useWeekGridLayout(
    toRef(props, 'events'),
    toRef(props, 'days'),
    toRef(props, 'bounds')
);

const gridTemplate = computed(() => `4.5rem repeat(${props.days.length || 1}, minmax(9rem, 1fr))`);
const bodyHeight = computed(() => `${((axisEnd.value - axisStart.value) / 60) * HOUR_HEIGHT}px`);
const isEmpty = computed(() => !props.loading && props.events.length === 0);

// ---- the current-time line ------------------------------------------------
const now = ref(new Date());
let ticker: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
    ticker = setInterval(() => (now.value = new Date()), NOW_TICK_MS);
});

onBeforeUnmount(() => {
    if (ticker) clearInterval(ticker);
});

const todayWeekday = computed(() => isoWeekday(now.value));
const isToday = (dayId: number) => props.highlightToday && dayId === todayWeekday.value;

const nowMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes());

/** Where the current-time line sits, or null when now is outside the axis. */
const nowOffset = computed(() => {
    if (!props.highlightToday) return null;
    if (nowMinutes.value < axisStart.value || nowMinutes.value > axisEnd.value) return null;

    const span = Math.max(axisEnd.value - axisStart.value, 1);

    return ((nowMinutes.value - axisStart.value) / span) * 100;
});

/** A block short enough that only its title fits. */
const isCompact = (heightPercent: number) => {
    const span = Math.max(axisEnd.value - axisStart.value, 1);

    return (heightPercent / 100) * span < 60;
};

const onSelect = (event: ScheduleEvent) => {
    if (props.selectable) emit('select', event);
};
</script>

<template>
    <div class="schedule-card border-border-default overflow-hidden rounded-2xl border">
        <Skeleton
            v-if="loading && !events.length"
            height="24rem" />

        <div
            v-else
            class="relative overflow-x-auto">
            <div class="min-w-208">
                <!-- ---- day headers ---- -->
                <div
                    class="border-border-default bg-surface-elevated grid border-b"
                    :style="{ gridTemplateColumns: gridTemplate }">
                    <div class="border-border-subtle border-r" />
                    <div
                        v-for="column in columns"
                        :key="column.id"
                        class="border-border-subtle border-r px-3 py-2.5 text-center last:border-r-0"
                        :class="isToday(column.id) ? 'week-grid-head--today' : ''">
                        <p
                            class="text-sm font-semibold"
                            :class="isToday(column.id) ? 'text-schedule-icon-brand' : 'text-text-primary'">
                            {{ column.name }}
                        </p>
                        <p class="text-text-tertiary mt-0.5 text-xs">
                            {{ column.events.length }}
                        </p>
                    </div>
                </div>

                <!-- ---- axis + day columns ---- -->
                <div
                    class="grid"
                    :style="{ gridTemplateColumns: gridTemplate }">
                    <!--
                        The axis labels sit ON the hour lines, so each one is
                        nudged up half a line-height and the first is clipped.
                    -->
                    <div
                        class="border-border-subtle relative border-r"
                        :style="{ height: bodyHeight }">
                        <span
                            v-for="mark in hourMarks"
                            :key="mark"
                            class="text-text-tertiary absolute right-2 -translate-y-1/2 text-xs tabular-nums"
                            :style="{ top: `${((mark - axisStart) / (axisEnd - axisStart)) * 100}%` }">
                            {{ toClock(mark) }}
                        </span>
                    </div>

                    <div
                        v-for="column in columns"
                        :key="column.id"
                        class="week-grid-column border-border-subtle relative border-r last:border-r-0"
                        :class="isToday(column.id) ? 'week-grid-column--today' : ''"
                        :style="{ height: bodyHeight, '--hour-height': `${HOUR_HEIGHT}px` }">
                        <!-- the current-time line, on today's column only -->
                        <div
                            v-if="isToday(column.id) && nowOffset !== null"
                            class="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                            :style="{ top: `${nowOffset}%` }">
                            <span class="bg-schedule-error-500 -ml-1 h-2 w-2 rounded-full" />
                            <span class="bg-schedule-error-500 h-px flex-1" />
                        </div>

                        <button
                            v-for="placed in column.events"
                            :key="placed.event.id"
                            type="button"
                            class="week-grid-event"
                            :class="[
                                placed.event.isMuted ? 'week-grid-event--muted' : '',
                                placed.event.isTentative ? 'week-grid-event--tentative' : '',
                                selectable ? 'cursor-pointer' : 'cursor-default'
                            ]"
                            :style="{
                                top: `${placed.top}%`,
                                height: `${placed.height}%`,
                                left: `calc(${placed.left}% + 2px)`,
                                width: `calc(${placed.width}% - 4px)`,
                                '--event-color': placed.event.color || 'var(--color-schedule-brand-blue)'
                            }"
                            :title="`${placed.event.tooltip || placed.event.title} · ${placed.event.start}–${placed.event.end}`"
                            @click="onSelect(placed.event)">
                            <span class="week-grid-event__time">{{ placed.event.start }}–{{ placed.event.end }}</span>
                            <span class="week-grid-event__title">{{ placed.event.title }}</span>
                            <span
                                v-if="placed.event.subtitle && !isCompact(placed.height)"
                                class="week-grid-event__meta">
                                {{ placed.event.subtitle }}
                            </span>
                            <span
                                v-if="placed.event.badge && !isCompact(placed.height)"
                                class="week-grid-event__badge">
                                {{ placed.event.badge }}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- The grid still renders: an empty week is a real answer, not a blank page. -->
            <div
                v-if="isEmpty"
                class="pointer-events-none absolute inset-0 top-12 flex items-center justify-center">
                <p class="bg-surface-card text-text-tertiary border-border-subtle rounded-xl border px-4 py-2 text-sm">
                    {{ emptyLabel || 'Nothing scheduled' }}
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/*
   Hour rules are painted as a background gradient rather than as 10 more
   elements per column — the grid stays one DOM node deep whatever the axis.
*/
.week-grid-column {
    background-image: repeating-linear-gradient(
        to bottom,
        var(--color-border-subtle) 0,
        var(--color-border-subtle) 1px,
        transparent 1px,
        transparent var(--hour-height)
    );
}

.week-grid-column--today {
    background-color: color-mix(in srgb, var(--color-schedule-brand-blue) 5%, transparent);
}

/*
   Today's header tint is mixed rather than taken from a `*-surface` token:
   those are light-mode literals, and this has to hold up on a slate card too.
*/
.week-grid-head--today {
    background-color: color-mix(in srgb, var(--color-schedule-brand-blue) 9%, transparent);
}

.week-grid-event {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    overflow: hidden;
    min-height: 1.75rem;
    padding: 0.3rem 0.45rem;
    text-align: left;
    border-radius: 0.5rem;
    border: 1px solid color-mix(in srgb, var(--event-color) 45%, transparent);
    border-left: 3px solid var(--event-color);
    background-color: color-mix(in srgb, var(--event-color) 14%, var(--surface-card));
    transition: box-shadow var(--transition-fast, 0.15s ease-in-out);
}

.week-grid-event:hover {
    box-shadow: 0 1px 8px color-mix(in srgb, var(--event-color) 35%, transparent);
}

.week-grid-event__time {
    font-size: 0.65rem;
    line-height: 1rem;
    font-variant-numeric: tabular-nums;
    color: var(--text-tertiary);
}

.week-grid-event__title {
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.week-grid-event__meta,
.week-grid-event__badge {
    font-size: 0.65rem;
    line-height: 0.9rem;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.week-grid-event__badge {
    margin-top: auto;
    color: var(--event-color);
    font-weight: 600;
}

/* Not published yet — the same dashed edge every calendar uses for tentative. */
.week-grid-event--tentative {
    border-style: dashed;
    border-left-style: solid;
    background-color: color-mix(in srgb, var(--event-color) 7%, var(--surface-card));
}

/* Cancelled work is shown crossed out, never removed. */
.week-grid-event--muted {
    opacity: 0.55;
}

.week-grid-event--muted .week-grid-event__title {
    text-decoration: line-through;
}
</style>
