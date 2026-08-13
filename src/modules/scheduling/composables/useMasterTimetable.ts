import { computed, type ComputedRef, type Ref } from 'vue';

import { toMinutes } from '@/modules/scheduling/composables/useCalendarLayout';
import type { DayOption, TimeSlot } from '@/modules/scheduling/types/classSchedule';
import type { MasterColumn, MasterGroup, MasterRow, ScheduleEvent } from '@/modules/scheduling/types/calendar';

/** Sorts before every real id, so unassigned rows band together at the end. */
const UNASSIGNED = 0;

/**
 * Build the column axis for a WEEKLY master timetable: every teaching day
 * crossed with every period of the daily slot grid.
 *
 * @param days the weekday columns, in order
 * @param slots the backend's generation slot grid
 */
export function weeklyMasterColumns(days: DayOption[], slots: TimeSlot[]): MasterColumn[] {
    return days.flatMap((day) =>
        slots.map((slot) => ({
            key: `${day.id}|${slot.start}`,
            groupKey: String(day.id),
            groupLabel: day.name,
            label: `${slot.start}–${slot.end}`
        }))
    );
}

/**
 * Which column an event belongs in.
 *
 * The slot grid is what the generator places into, but a registrar may place a
 * meeting by hand at any time — so an event that matches no slot exactly goes
 * into the last slot that has already STARTED by then, and only falls to the
 * first column if it starts before the teaching day does. Nothing is dropped:
 * a master timetable that quietly omits an off-grid class is worse than one
 * that shows it a column early.
 *
 * @param columns the day's columns, in time order
 * @param event the event to place
 */
function columnFor(columns: MasterColumn[], event: ScheduleEvent): MasterColumn | null {
    const dayColumns = columns.filter((column) => column.groupKey === String(event.day));
    if (!dayColumns.length) return null;

    const start = toMinutes(event.start);
    let chosen = dayColumns[0]!;

    dayColumns.forEach((column) => {
        if (toMinutes(column.label.split('–')[0]!) <= start) chosen = column;
    });

    return chosen;
}

/**
 * Build the column axis for a DATED master timetable — the exam period.
 *
 * Exams do not repeat weekly, so there is no period grid to cross: each date
 * that has a sitting becomes one column, in order.
 *
 * @param events every event to take dates from
 */
export function datedMasterColumns(events: ScheduleEvent[]): MasterColumn[] {
    const dates = [...new Set(events.map((event) => event.date).filter((date): date is string => !!date))].sort(
        (a, b) => a.localeCompare(b)
    );

    return dates.map((date) => ({
        key: date,
        groupKey: date,
        groupLabel: date,
        label: date
    }));
}

export interface MasterTimetable {
    columns: ComputedRef<MasterColumn[]>;
    /** Day banners with how many columns each spans. */
    dayBands: ComputedRef<{ key: string; label: string; span: number }[]>;
    groups: ComputedRef<MasterGroup[]>;
    isEmpty: ComputedRef<boolean>;
}

/**
 * The registrar's master timetable: one row per cohort, one column per period,
 * rows banded by department → programme.
 *
 * This is the view that answers "is every section covered, and where are the
 * gaps" — the thing a per-cohort grid cannot show because it only ever shows
 * one cohort.
 *
 * @param events every event to place
 * @param days the weekday columns
 * @param slots the daily period grid
 */
export function useMasterTimetable(
    events: Ref<ScheduleEvent[]> | ComputedRef<ScheduleEvent[]>,
    days: Ref<DayOption[]> | ComputedRef<DayOption[]>,
    slots: Ref<TimeSlot[]> | ComputedRef<TimeSlot[]>,
    unassignedLabel: () => string
): MasterTimetable {
    const columns = computed(() => weeklyMasterColumns(days.value, slots.value));

    const dayBands = computed(() =>
        days.value
            .map((day) => ({
                key: String(day.id),
                label: day.name,
                span: columns.value.filter((column) => column.groupKey === String(day.id)).length
            }))
            .filter((band) => band.span > 0)
    );

    const groups = computed(() => buildGroups(events.value, columns.value, columnFor, unassignedLabel));

    const isEmpty = computed(() => groups.value.length === 0);

    return { columns, dayBands, groups, isEmpty };
}

/**
 * Band the events into department › programme groups of per-section rows.
 *
 * Shared by the weekly and the dated master timetables — they differ only in
 * what a column IS, which is why the placement function is a parameter.
 *
 * @param events every event to place
 * @param columns the resolved column axis
 * @param place which column an event belongs in, or null to drop it
 * @param unassignedLabel what to call a cohort the offering never named
 */
function buildGroups(
    events: ScheduleEvent[],
    columns: MasterColumn[],
    place: (columns: MasterColumn[], event: ScheduleEvent) => MasterColumn | null,
    unassignedLabel: () => string
): MasterGroup[] {
    const banded = new Map<string, { label: string; rows: Map<string, MasterRow> }>();

    events.forEach((event) => {
        const cohort = event.cohort;
        const bandKey = `${cohort?.departmentId ?? UNASSIGNED}|${cohort?.programId ?? UNASSIGNED}`;
        const bandLabel =
            [cohort?.departmentLabel, cohort?.programLabel].filter(Boolean).join(' › ') || unassignedLabel();

        const band = banded.get(bandKey) ?? { label: bandLabel, rows: new Map<string, MasterRow>() };
        const rowKey = String(cohort?.sectionId ?? UNASSIGNED);
        const row = band.rows.get(rowKey) ?? {
            key: rowKey,
            label: cohort?.sectionLabel || unassignedLabel(),
            cells: {},
            total: 0
        };

        const column = place(columns, event);
        if (column) {
            row.cells[column.key] = [...(row.cells[column.key] ?? []), event];
            row.total += 1;
        }

        band.rows.set(rowKey, row);
        banded.set(bandKey, band);
    });

    return [...banded.entries()]
        .map(([key, band]) => ({
            key,
            label: band.label,
            rows: [...band.rows.values()].sort((a, b) => a.label.localeCompare(b.label))
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * The exam-period master timetable: one row per cohort, one column per exam
 * date. Same question as the weekly one — "is every cohort covered" — asked of
 * a period that runs across weeks rather than repeating within one.
 *
 * @param events every sitting to place
 */
export function useDatedMasterTimetable(
    events: Ref<ScheduleEvent[]> | ComputedRef<ScheduleEvent[]>,
    unassignedLabel: () => string
): MasterTimetable {
    const columns = computed(() => datedMasterColumns(events.value));

    // No second banner: a date IS the column, so banding each one over itself
    // would just print every heading twice.
    const dayBands = computed(() => []);

    const groups = computed(() =>
        buildGroups(
            events.value,
            columns.value,
            (all, event) => all.find((column) => column.key === event.date) ?? null,
            unassignedLabel
        )
    );

    const isEmpty = computed(() => groups.value.length === 0);

    return { columns, dayBands, groups, isEmpty };
}
