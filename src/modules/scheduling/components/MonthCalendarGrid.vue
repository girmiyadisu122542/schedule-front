<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { buildMonthCells, shiftMonth, todayIso } from '@/modules/scheduling/composables/useCalendarLayout';
import type { MonthCell, ScheduleEvent } from '@/modules/scheduling/types/calendar';

import Skeleton from '@/components/common/Skeleton.vue';
import MainButton from '@/components/common/MainButton.vue';

import ChevronArrowLeft from '@/assets/icons/ChevronArrowLeft.vue';
import ChevronArrowRight from '@/assets/icons/ChevronArrowRight.vue';

/**
 * The standard month calendar, with the selected day's sittings listed
 * underneath it.
 *
 * Exams are dated events spread over an exam period, not a repeating weekly
 * pattern — a month grid is how a reader finds "what am I sitting next week",
 * and the agenda under it is where the times, halls and duty counts live.
 *
 * Like the week grid, it knows nothing about exams: the host maps its rows onto
 * `ScheduleEvent` and gets the original back on `select`.
 */
const props = withDefaults(
    defineProps<{
        /** Every event to place; those without a `date` are ignored. */
        events: ScheduleEvent[];
        loading?: boolean;
        /** Whether a chip or an agenda row responds to a click. */
        selectable?: boolean;
        /** Monday-first weekday labels; pass the backend's so they localize. */
        weekdayNames?: string[];
        emptyLabel?: string;
        /** Chips shown in a day cell before the rest collapse into "+ N". */
        maxChipsPerDay?: number;
    }>(),
    {
        loading: false,
        selectable: false,
        weekdayNames: () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        emptyLabel: '',
        maxChipsPerDay: 3
    }
);

const emit = defineEmits<{ (e: 'select', event: ScheduleEvent): void }>();

const { customizeLanguageData, currentLanguage } = useLanguageStore();

/** The month on screen, as the first of that month. */
const anchor = ref(shiftMonth(todayIso(), 0));
const selectedDate = ref<string>(todayIso());
/**
 * Once the reader has moved the month themselves, a refetch must not yank them
 * back to wherever the data happens to start.
 */
const hasNavigated = ref(false);

const monthLabel = computed(() =>
    new Date(`${anchor.value}T00:00:00`).toLocaleDateString(currentLanguage || 'en', {
        month: 'long',
        year: 'numeric'
    })
);

const cells = computed<MonthCell[]>(() => buildMonthCells(anchor.value, props.events));
const isEmpty = computed(() => !props.loading && props.events.length === 0);

/** The selected day's events, or the first day that has any. */
const selectedCell = computed<MonthCell | null>(
    () => cells.value.find((cell) => cell.date === selectedDate.value) ?? null
);

const selectedLabel = computed(() =>
    selectedDate.value
        ? new Date(`${selectedDate.value}T00:00:00`).toLocaleDateString(currentLanguage || 'en', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
          })
        : ''
);

/** Open the month the exam period actually starts in, not whatever month it is. */
watch(
    () => props.events,
    (events) => {
        if (hasNavigated.value || !events.length) return;

        const earliest = events
            .map((event) => event.date)
            .filter((date): date is string => !!date)
            .sort((a, b) => a.localeCompare(b))[0];

        if (!earliest) return;

        anchor.value = shiftMonth(earliest, 0);
        selectedDate.value = earliest;
    },
    { immediate: true }
);

const goToMonth = (delta: number) => {
    hasNavigated.value = true;
    anchor.value = shiftMonth(anchor.value, delta);
};

const goToToday = () => {
    hasNavigated.value = true;
    anchor.value = shiftMonth(todayIso(), 0);
    selectedDate.value = todayIso();
};

const selectDay = (cell: MonthCell) => {
    selectedDate.value = cell.date;

    // Clicking a padding day is a request for that month, not just that day.
    if (!cell.isCurrentMonth) {
        hasNavigated.value = true;
        anchor.value = shiftMonth(cell.date, 0);
    }
};

const onSelect = (event: ScheduleEvent) => {
    if (props.selectable) emit('select', event);
};
</script>

<template>
    <div class="space-y-4">
        <div class="schedule-card border-border-default overflow-hidden rounded-2xl border">
            <!-- ---- month nav ---- -->
            <div class="border-border-default bg-surface-elevated flex items-center justify-between border-b px-4 py-3">
                <h2 class="text-text-primary text-base font-semibold">{{ monthLabel }}</h2>

                <div class="flex items-center gap-2">
                    <MainButton
                        outlined
                        size="small"
                        :icon="ChevronArrowLeft"
                        :tooltip="$lang.previousMonth || 'Previous month'"
                        @click="goToMonth(-1)" />
                    <MainButton
                        outlined
                        size="small"
                        :label="$lang.today || 'Today'"
                        @click="goToToday" />
                    <MainButton
                        outlined
                        size="small"
                        :icon="ChevronArrowRight"
                        :tooltip="$lang.nextMonth || 'Next month'"
                        @click="goToMonth(1)" />
                </div>
            </div>

            <Skeleton
                v-if="loading && !events.length"
                height="22rem" />

            <template v-else>
                <!-- ---- weekday header ---- -->
                <div class="border-border-default grid grid-cols-7 border-b">
                    <div
                        v-for="(name, index) in weekdayNames"
                        :key="index"
                        class="text-text-tertiary px-2 py-2 text-center text-xs font-medium">
                        {{ name }}
                    </div>
                </div>

                <!-- ---- the month ---- -->
                <div class="grid grid-cols-7">
                    <button
                        v-for="cell in cells"
                        :key="cell.date"
                        type="button"
                        class="month-cell border-border-subtle border-r border-b p-1.5 text-left last:border-r-0"
                        :class="[
                            cell.isCurrentMonth ? '' : 'month-cell--outside',
                            cell.date === selectedDate ? 'month-cell--selected' : ''
                        ]"
                        @click="selectDay(cell)">
                        <span
                            class="mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums"
                            :class="
                                cell.isToday
                                    ? 'bg-schedule-brand-blue font-semibold text-white'
                                    : cell.isCurrentMonth
                                      ? 'text-text-secondary'
                                      : 'text-text-muted'
                            ">
                            {{ cell.dayOfMonth }}
                        </span>

                        <span class="flex flex-col gap-0.5">
                            <span
                                v-for="event in cell.events.slice(0, maxChipsPerDay)"
                                :key="event.id"
                                class="month-chip"
                                :class="[
                                    event.isMuted ? 'month-chip--muted' : '',
                                    event.isTentative ? 'month-chip--tentative' : ''
                                ]"
                                :style="{ '--event-color': event.color || 'var(--color-schedule-brand-blue)' }"
                                :title="`${event.start}–${event.end} · ${event.tooltip || event.title}`"
                                @click.stop="onSelect(event)">
                                <span class="month-chip__dot" />
                                <span class="month-chip__time">{{ event.start }}</span>
                                <span class="month-chip__title">{{ event.title }}</span>
                            </span>

                            <span
                                v-if="cell.events.length > maxChipsPerDay"
                                class="text-text-tertiary pl-1 text-[0.65rem] font-medium">
                                + {{ cell.events.length - maxChipsPerDay }}
                            </span>
                        </span>
                    </button>
                </div>
            </template>
        </div>

        <!-- ---- the selected day, in full ---- -->
        <section class="schedule-card border-border-default rounded-2xl border p-5">
            <header class="border-border-subtle mb-3 flex items-center justify-between border-b pb-2">
                <h3 class="text-text-primary text-sm font-semibold">{{ selectedLabel }}</h3>
                <span class="text-text-tertiary text-xs">
                    {{ selectedCell?.events.length ?? 0 }}
                </span>
            </header>

            <p
                v-if="!selectedCell?.events.length"
                class="text-text-tertiary py-4 text-center text-sm">
                {{
                    isEmpty
                        ? emptyLabel || customizeLanguageData('nothingScheduled', 'Nothing scheduled')
                        : customizeLanguageData('nothingOnThisDay', 'Nothing on this day')
                }}
            </p>

            <ul
                v-else
                class="space-y-2">
                <li
                    v-for="event in selectedCell!.events"
                    :key="event.id">
                    <button
                        type="button"
                        class="agenda-row border-border-subtle w-full rounded-xl border px-3 py-2 text-left"
                        :class="[
                            event.isMuted ? 'opacity-60' : '',
                            event.isTentative ? 'agenda-row--tentative' : '',
                            selectable ? 'cursor-pointer' : 'cursor-default'
                        ]"
                        :style="{ '--event-color': event.color || 'var(--color-schedule-brand-blue)' }"
                        @click="onSelect(event)">
                        <div class="flex flex-wrap items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p
                                    class="text-text-primary text-sm font-medium"
                                    :class="event.isMuted ? 'line-through' : ''">
                                    {{ event.title }}
                                </p>
                                <p
                                    v-if="event.subtitle"
                                    class="text-text-tertiary mt-0.5 text-xs">
                                    {{ event.subtitle }}
                                </p>
                            </div>

                            <div class="flex shrink-0 items-center gap-2">
                                <span
                                    v-if="event.badge"
                                    class="agenda-row__badge">
                                    {{ event.badge }}
                                </span>
                                <span class="text-text-secondary text-xs tabular-nums">
                                    {{ event.start }}–{{ event.end }}
                                </span>
                            </div>
                        </div>
                    </button>
                </li>
            </ul>
        </section>
    </div>
</template>

<style scoped>
.month-cell {
    min-height: 6.5rem;
    transition: background-color var(--transition-fast, 0.15s ease-in-out);
}

.month-cell:hover {
    background-color: var(--surface-hover);
}

.month-cell--outside {
    background-color: color-mix(in srgb, var(--surface-subtle) 45%, transparent);
}

.month-cell--selected {
    background-color: color-mix(in srgb, var(--color-schedule-brand-blue) 8%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-schedule-brand-blue) 45%, transparent);
}

.month-chip {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    overflow: hidden;
    border-radius: 0.3rem;
    padding: 0.1rem 0.25rem;
    font-size: 0.65rem;
    line-height: 1rem;
    background-color: color-mix(in srgb, var(--event-color) 14%, transparent);
}

.month-chip__dot {
    height: 0.4rem;
    width: 0.4rem;
    flex-shrink: 0;
    border-radius: 9999px;
    background-color: var(--event-color);
}

.month-chip__time {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    color: var(--text-tertiary);
}

.month-chip__title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    color: var(--text-primary);
}

/* Not published yet — dashed, the way every calendar draws a tentative entry. */
.month-chip--tentative {
    border: 1px dashed color-mix(in srgb, var(--event-color) 55%, transparent);
    background-color: transparent;
}

.month-chip--muted {
    opacity: 0.55;
}

.month-chip--muted .month-chip__title {
    text-decoration: line-through;
}

.agenda-row {
    border-left: 3px solid var(--event-color);
    transition: background-color var(--transition-fast, 0.15s ease-in-out);
}

.agenda-row:hover {
    background-color: var(--surface-hover);
}

.agenda-row--tentative {
    border-left-style: dashed;
}

.agenda-row__badge {
    border-radius: 0.375rem;
    padding: 0.1rem 0.4rem;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--event-color);
    background-color: color-mix(in srgb, var(--event-color) 14%, transparent);
}
</style>
