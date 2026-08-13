/**
 * The shape the calendar grids read.
 *
 * Neither grid knows what a class meeting or an exam sitting is — a view maps
 * its own rows onto `ScheduleEvent` and keeps the original on `record`, which
 * comes straight back on the `select` event so the host can act on it.
 */
export interface ScheduleEvent {
    id: number;
    /** The headline inside the block — usually the offering label. */
    title: string;
    /** The second line: room · instructor, or hall · invigilators. */
    subtitle?: string;
    /**
     * The full "CS101 — Title (Cohort)" label, for the hover tooltip.
     *
     * `title` is the course CODE because that is what fits on a block; this is
     * how the course name stays reachable without printing it on the grid.
     */
    tooltip?: string;
    /** The lookup value's own label — session type, exam type. */
    badge?: string;
    /** Clock strings exactly as the backend emits them (`H:i`). */
    start: string;
    end: string;
    /** ISO weekday 1..7 — what the week grid places a block in. */
    day?: number;
    /** `YYYY-MM-DD` — what the month grid places a chip in. */
    date?: string;
    /** The lookup value's colour; the block tints itself with it. */
    color?: string | null;
    /**
     * Localized weekday name and status label. The grids read neither — they
     * show the day by which column a block is in, and the status through the
     * tentative / muted styling. The EXPORT needs both spelled out, because a
     * spreadsheet row has no column to sit in and no styling to read.
     */
    dayLabel?: string;
    statusLabel?: string;
    /**
     * The course's parts. `title` is the code because that is what fits on a
     * block; an export needs them as separate columns so a spreadsheet can
     * filter and sort on either.
     */
    courseCode?: string;
    courseTitle?: string;
    /** Who is on duty — exams only. Live duties, in the order assigned. */
    invigilators?: { employee_no?: string | null; name?: string | null; role_code?: string | null }[];
    /**
     * Not published yet. Drawn with a dashed edge, the way every calendar draws
     * a tentative entry — so a draft timetable never reads as a settled one.
     */
    isTentative?: boolean;
    /**
     * Cancelled work is dimmed rather than hidden — a reader looking for a
     * meeting that used to be there should find it crossed out, not absent.
     */
    isMuted?: boolean;
    /**
     * Who this is scheduled FOR. The master timetable puts one row per cohort
     * and bands those rows by department and programme; the week and month
     * grids ignore it.
     */
    cohort?: EventCohort;
    /** The row this event was built from. Comes back on `select`. */
    record: unknown;
}

/**
 * The cohort an event belongs to, as the master timetable groups it:
 * department → programme → section.
 *
 * All three are optional because an offering need not name a section or a
 * programme (Final Schema.md §12) — those events land in an "unassigned" row
 * rather than being dropped.
 */
export interface EventCohort {
    sectionId: number | null;
    sectionLabel: string | null;
    programId: number | null;
    programLabel: string | null;
    departmentId: number | null;
    departmentLabel: string | null;
}

/** One column of the master timetable — a period on a given day, or a date. */
export interface MasterColumn {
    key: string;
    /** The banner the column sits under: a weekday, or a date. */
    groupKey: string;
    groupLabel: string;
    /** The column's own heading: a time range. */
    label: string;
}

/** One row of the master timetable — a cohort, and what it does in each column. */
export interface MasterRow {
    key: string;
    label: string;
    /** Events keyed by `MasterColumn.key`; a cohort can have two at once. */
    cells: Record<string, ScheduleEvent[]>;
    total: number;
}

/** Rows banded by department → programme. */
export interface MasterGroup {
    key: string;
    label: string;
    rows: MasterRow[];
}

/** One event with its geometry resolved, as percentages of its day column. */
export interface PositionedEvent {
    event: ScheduleEvent;
    /** Offset from the top of the axis, in % of the axis span. */
    top: number;
    /** Duration, in % of the axis span. */
    height: number;
    /** Lane offset and width, in % of the column — how overlaps sit side by side. */
    left: number;
    width: number;
}

/** One column of the week grid: a weekday and everything placed on it. */
export interface WeekColumn {
    id: number;
    name: string;
    events: PositionedEvent[];
}

/** One cell of the month grid. */
export interface MonthCell {
    /** `YYYY-MM-DD`. */
    date: string;
    dayOfMonth: number;
    /** False for the leading / trailing days that pad the grid to whole weeks. */
    isCurrentMonth: boolean;
    isToday: boolean;
    events: ScheduleEvent[];
}
