import { computed, type ComputedRef, type Ref } from 'vue';

import type { DayOption, TimeSlot } from '@/modules/scheduling/types/classSchedule';
import type { MonthCell, PositionedEvent, ScheduleEvent, WeekColumn } from '@/modules/scheduling/types/calendar';

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
/** A month never needs more than six rows of seven days. */
const MONTH_GRID_CELLS = 42;

/**
 * The window the week grid always covers, however little is scheduled. Without
 * it a semester with one 10:00 lecture would render a grid one hour tall, which
 * reads as a bug rather than as an empty timetable.
 */
export const DEFAULT_AXIS_START = '08:00';
export const DEFAULT_AXIS_END = '17:30';

/** Minutes past midnight for an `HH:mm` (or `HH:mm:ss`) clock string. */
export function toMinutes(time: string | null | undefined): number {
    if (!time) return 0;

    const [hours, minutes] = time.split(':');

    return (Number(hours) || 0) * MINUTES_PER_HOUR + (Number(minutes) || 0);
}

/** Minutes past midnight back to `HH:mm`. */
export function toClock(minutes: number): string {
    const hours = Math.floor(minutes / MINUTES_PER_HOUR) % HOURS_PER_DAY;
    const rest = minutes % MINUTES_PER_HOUR;

    return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** Today as `YYYY-MM-DD`, in the reader's own timezone rather than UTC. */
export function todayIso(): string {
    return toIsoDate(new Date());
}

/** A Date as `YYYY-MM-DD`, without the UTC shift `toISOString()` would apply. */
export function toIsoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** ISO weekday (1 = Monday … 7 = Sunday) for a Date — `getDay()` starts on Sunday. */
export function isoWeekday(date: Date): number {
    return ((date.getDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK) + 1;
}

/**
 * Lay a day's events out side by side so that nothing is hidden behind
 * anything else.
 *
 * Overlapping events are gathered into clusters, and every event in a cluster
 * gets its own lane — the same thing Outlook and Google Calendar do. Two
 * sessions the database would never allow at once can still land here (a room
 * clash IS refused, but a room-less draft and a placed one are not), and the
 * grid has to show both or it lies about what is scheduled.
 *
 * @param dayEvents every event on one day
 * @param axisStart minutes past midnight the grid starts at
 * @param axisSpan the grid's height in minutes
 */
function positionDay(dayEvents: ScheduleEvent[], axisStart: number, axisSpan: number): PositionedEvent[] {
    const sorted = [...dayEvents].sort(
        (a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end)
    );

    const positioned: PositionedEvent[] = [];
    let cluster: ScheduleEvent[] = [];
    let clusterEnd = -1;

    /** Give one cluster its lanes and push the results out. */
    const flush = () => {
        if (!cluster.length) return;

        // Greedy lane assignment: an event takes the first lane that is free by
        // the time it starts.
        const laneEnds: number[] = [];
        const lanes = cluster.map((event) => {
            const start = toMinutes(event.start);
            const end = Math.max(toMinutes(event.end), start + 1);
            const lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
            const index = lane === -1 ? laneEnds.length : lane;

            laneEnds[index] = end;

            return index;
        });

        const laneCount = laneEnds.length || 1;

        cluster.forEach((event, index) => {
            const start = toMinutes(event.start);
            const end = Math.max(toMinutes(event.end), start + 1);

            positioned.push({
                event,
                top: ((start - axisStart) / axisSpan) * 100,
                height: ((end - start) / axisSpan) * 100,
                left: (lanes[index]! / laneCount) * 100,
                width: 100 / laneCount
            });
        });

        cluster = [];
        clusterEnd = -1;
    };

    sorted.forEach((event) => {
        const start = toMinutes(event.start);
        if (start >= clusterEnd) {
            flush();
        }

        cluster.push(event);
        clusterEnd = Math.max(clusterEnd, toMinutes(event.end));
    });

    flush();

    return positioned;
}

export interface WeekGridLayout {
    /** Minutes past midnight the axis runs between. */
    axisStart: ComputedRef<number>;
    axisEnd: ComputedRef<number>;
    /** The hour boundaries the axis is labelled and ruled at. */
    hourMarks: ComputedRef<number[]>;
    columns: ComputedRef<WeekColumn[]>;
}

/**
 * The weekly time grid: an hour axis tall enough to hold everything, and one
 * column per weekday with its events placed by time.
 *
 * @param events every event to place; those without a `day` are ignored
 * @param days the columns, in order (usually the backend's weekday catalogue)
 * @param bounds clock strings the axis must cover even when nothing is there
 */
export function useWeekGridLayout(
    events: Ref<ScheduleEvent[]> | ComputedRef<ScheduleEvent[]>,
    days: Ref<DayOption[]> | ComputedRef<DayOption[]>,
    bounds?: Ref<{ start?: string; end?: string }> | ComputedRef<{ start?: string; end?: string }>
): WeekGridLayout {
    const axisStart = computed(() => {
        const floor = toMinutes(bounds?.value.start || DEFAULT_AXIS_START);
        const earliest = events.value.reduce((min, event) => Math.min(min, toMinutes(event.start)), floor);

        // Always start on an hour boundary, so the ruled lines mean something.
        return Math.floor(earliest / MINUTES_PER_HOUR) * MINUTES_PER_HOUR;
    });

    const axisEnd = computed(() => {
        const ceiling = toMinutes(bounds?.value.end || DEFAULT_AXIS_END);
        const latest = events.value.reduce((max, event) => Math.max(max, toMinutes(event.end)), ceiling);

        return Math.min(Math.ceil(latest / MINUTES_PER_HOUR) * MINUTES_PER_HOUR, HOURS_PER_DAY * MINUTES_PER_HOUR);
    });

    const hourMarks = computed(() => {
        const marks: number[] = [];
        for (let minute = axisStart.value; minute <= axisEnd.value; minute += MINUTES_PER_HOUR) {
            marks.push(minute);
        }

        return marks;
    });

    const columns = computed<WeekColumn[]>(() => {
        const span = Math.max(axisEnd.value - axisStart.value, 1);

        return days.value.map((day) => ({
            id: day.id,
            name: day.name,
            events: positionDay(
                events.value.filter((event) => event.day === day.id),
                axisStart.value,
                span
            )
        }));
    });

    return { axisStart, axisEnd, hourMarks, columns };
}

/**
 * The month grid: six weeks of cells starting on the Monday on or before the
 * first of the month, each carrying its own events in time order.
 *
 * @param anchorIso any date inside the month to render
 * @param events every event to place; those without a `date` are ignored
 */
export function buildMonthCells(anchorIso: string, events: ScheduleEvent[]): MonthCell[] {
    const anchor = new Date(`${anchorIso}T00:00:00`);
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);

    // Back up to that week's Monday, so every row is a real Monday..Sunday week.
    const gridStart = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        monthStart.getDate() - (isoWeekday(monthStart) - 1)
    );

    const byDate = new Map<string, ScheduleEvent[]>();
    events.forEach((event) => {
        if (!event.date) return;

        const bucket = byDate.get(event.date) ?? [];
        bucket.push(event);
        byDate.set(event.date, bucket);
    });

    const today = todayIso();
    const cells: MonthCell[] = [];

    for (let offset = 0; offset < MONTH_GRID_CELLS; offset++) {
        // Built from Y/M/D rather than by adding days to a running Date: the
        // constructor normalizes month ends and lands on local midnight, so a
        // DST boundary cannot shunt a cell onto the previous day.
        const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + offset);

        const iso = toIsoDate(date);
        const dayEvents = (byDate.get(iso) ?? []).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

        cells.push({
            date: iso,
            dayOfMonth: date.getDate(),
            isCurrentMonth: date.getMonth() === anchor.getMonth(),
            isToday: iso === today,
            events: dayEvents
        });
    }

    // A month that fits in five rows should not render a sixth, empty one.
    const lastRowStart = MONTH_GRID_CELLS - DAYS_PER_WEEK;
    const lastRowIsFiller = cells.slice(lastRowStart).every((cell) => !cell.isCurrentMonth);

    return lastRowIsFiller ? cells.slice(0, lastRowStart) : cells;
}

/**
 * The columns a week grid should show: every teaching day, plus any day
 * something actually landed on.
 *
 * A Saturday session the registrar placed by hand has to have a column to be
 * drawn in — but an institution that never teaches at the weekend should not be
 * looking at two empty ones.
 *
 * @param dayOptions the backend's weekday catalogue, in order
 * @param teachingDays the day numbers the generator places on
 * @param scheduledDays the day numbers currently on screen
 */
export function weekGridDays(
    dayOptions: DayOption[],
    teachingDays: number[],
    scheduledDays: Iterable<number>
): DayOption[] {
    const teaching = new Set(teachingDays);
    const scheduled = new Set(scheduledDays);

    return dayOptions.filter((day) => teaching.has(day.id) || scheduled.has(day.id));
}

/**
 * The hours a week grid always covers, taken from the backend's own generation
 * slot grid — so an empty timetable still shows the teaching day rather than
 * collapsing to nothing.
 *
 * @param slots the slot grid from `GET /constants/scheduling`
 * @returns clock bounds, or an empty object when the constants have not landed
 */
export function axisBoundsFromSlots(slots: TimeSlot[]): { start?: string; end?: string } {
    if (!slots.length) return {};

    return {
        start: toClock(Math.min(...slots.map((slot) => toMinutes(slot.start)))),
        end: toClock(Math.max(...slots.map((slot) => toMinutes(slot.end))))
    };
}

/** Shift an ISO date by whole months, keeping to the first of the month. */
export function shiftMonth(anchorIso: string, delta: number): string {
    const anchor = new Date(`${anchorIso}T00:00:00`);

    return toIsoDate(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));
}
