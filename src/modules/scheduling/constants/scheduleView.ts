/**
 * How a scheduling screen is being read right now.
 *
 * The calendar is the default everywhere: a timetable is a shape in time, and a
 * grid shows the gaps and the clashes that a row per meeting cannot. The table
 * stays one click away for the work a grid is bad at — filtering a whole
 * semester, editing a cell, paging through hundreds of rows.
 */
export const SCHEDULE_VIEW = {
    CALENDAR: 'calendar',
    /**
     * The registrar's master timetable — every cohort on one sheet, rows banded
     * by department › programme. The calendar answers "what does this section
     * do"; this answers "is every section covered, and where are the gaps".
     */
    MASTER: 'master',
    TABLE: 'table'
} as const;

export type ScheduleViewMode = (typeof SCHEDULE_VIEW)[keyof typeof SCHEDULE_VIEW];

/**
 * A calendar cannot paginate — a week or a month is the unit, so the whole
 * period has to arrive in one page. Matches the limit the read-only timetable
 * and exam calendar already use.
 */
export const CALENDAR_PAGE_LIMIT = 500;

/**
 * Bounds on a generation grid, mirroring the CHECK constraints in
 * `create_schedule_settings_table`. Kept here because the Zod schema evaluates
 * at module load and cannot wait on a hydrated store — the server still decides.
 */
export const MIN_PERIOD_MINUTES = 15;
export const MAX_PERIOD_MINUTES = 480;
export const MIN_BREAK_MINUTES = 0;
export const MAX_BREAK_MINUTES = 120;
export const MIN_EXAM_GAP_MINUTES = 0;
export const MAX_EXAM_GAP_MINUTES = 240;
export const MIN_EXAM_PERIOD_DAYS = 1;
export const MAX_EXAM_PERIOD_DAYS = 90;

/** A settings screen has one row per study mode — a handful, never a page. */
export const SETTINGS_PAGE_LIMIT = 50;
