/**
 * Report shapes, mirroring `App\Services\Report\ScheduleReportService`.
 *
 * Every figure is per semester: a utilisation number averaged across two terms
 * describes neither of them.
 */

/** One room's week. */
export interface RoomUtilisationRow {
    room_id: number;
    room_code: string;
    room_name: string | null;
    building: string | null;
    campus: string | null;
    capacity: number;
    exam_capacity: number | null;
    session_count: number;
    /** Hours the room is booked in a normal teaching week. */
    hours_per_week: number;
    /** How full it is while in use, averaged over its sessions. */
    seat_occupancy: number;
}

export interface RoomUtilisationReport {
    rows: RoomUtilisationRow[];
    totals: {
        room_count: number;
        rooms_in_use: number;
        rooms_unused: number;
        total_hours: number;
    };
}

/** One instructor's load against their declared ceiling. */
export interface InstructorWorkloadRow {
    instructor_id: number;
    employee_no: string | null;
    name: string;
    department: string | null;
    teaching_hours: number;
    /** Null means no ceiling was set — NOT zero. */
    max_weekly_hours: number | null;
    /** Null for the same reason; the UI must not render it as 0%. */
    utilisation: number | null;
    is_over_limit: boolean;
    invigilation_duties: number;
}

export interface InstructorWorkloadReport {
    rows: InstructorWorkloadRow[];
    totals: {
        instructor_count: number;
        over_limit: number;
        no_limit_set: number;
        unassigned: number;
    };
}

/** One thing that is wrong, in whichever group it belongs to. */
export interface ExceptionRow {
    id: number;
    label: string | null;
    detail: string | null;
}

/** The group keys the backend returns, in the order they should be read. */
export type ExceptionGroupKey =
    | 'unscheduled_offerings'
    | 'sessions_over_capacity'
    | 'offerings_without_exam'
    | 'sessions_without_room'
    | 'exams_short_of_invigilators'
    | 'clash_risk_courses';

export interface ExceptionReport {
    groups: Record<ExceptionGroupKey, ExceptionRow[]>;
    total: number;
}

/** One semester in a handful of numbers, for side-by-side comparison. */
export interface SemesterHeadline {
    semester_id: number;
    sessions: number;
    exams: number;
    rooms_in_use: number;
    total_room_hours: number;
    instructors_over_limit: number;
}

export interface ComparisonReport {
    current: SemesterHeadline;
    previous: SemesterHeadline;
}

/** One prerequisite for running a term (C37). */
export interface TermSetupStep {
    key: string;
    /** Which screen family fixes it — used to group the list. */
    group: string;
    count: number;
    is_satisfied: boolean;
    /** Progress rather than a blocker; a term is ready without it. */
    is_optional: boolean;
    /** The step that has to come first, so the order is visible not inferred. */
    depends_on: string | null;
}

export interface TermSetupChecklist {
    semester_id: number;
    semester: string;
    steps: TermSetupStep[];
    /** True when every REQUIRED step is satisfied. */
    ready: boolean;
    complete: number;
    total: number;
}
