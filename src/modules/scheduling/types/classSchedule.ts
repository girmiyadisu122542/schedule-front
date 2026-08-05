import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';

/** Compact embeds a schedule row carries (backend `idAndNameFields`). */
export interface ScheduleRef {
    id: number;
    uuid: string;
    code?: string;
    name: string;
}

/**
 * One recurring weekly class meeting, as `GET /schedule/class-schedules` emits
 * it (backend `App\Models\Schedule\ClassSchedule::indexFields`).
 *
 * `state` is NOT an `is_active` flag: it is the conflict-liveness bit the three
 * PostgreSQL EXCLUDE constraints read. It never moves on its own — cancelling a
 * meeting sets `status_code = 'cancelled'` AND `state = 0` in one write, which
 * is what frees the room, instructor and section slot.
 */
export interface ClassSchedule {
    id: number;
    uuid: string;
    name: string;
    course_offering_id: number;
    semester_id: number;
    section_id: number | null;
    instructor_id: number | null;
    room_id: number | null;
    session_type_lookup_value_id: number | null;
    status_lookup_value_id: number;
    generation_run_id: number | null;
    day_of_week: number;
    state: number;
    start_time: string;
    end_time: string;
    time_range: string;
    status_code: string | null;
    session_type_code: string | null;
    status?: LookupValueRef | null;
    session_type?: LookupValueRef | null;
    course_offering?: ScheduleRef | null;
    semester?: ScheduleRef | null;
    section?: ScheduleRef | null;
    instructor?: ScheduleRef | null;
    room?: ScheduleRef | null;
    created_by?: User | null;
    published_by?: User | null;
    published_at?: string | null;
    created_at?: string;
}

/**
 * Form model. `semester_id` and `section_id` are absent on purpose: the backend
 * mirrors them off the offering, and the composite foreign keys would reject
 * anything else. The status is never caller-supplied either.
 */
export interface ClassScheduleForm {
    course_offering_id: number | null;
    instructor_id: number | null;
    room_id: number | null;
    session_type_lookup_value_id: number | null;
    day_of_week: number | null;
    start_time: string;
    end_time: string;
}

export interface PaginatedClassSchedules {
    data: ClassSchedule[];
    pagination: Pagination | null;
}

/**
 * One offering the generator placed in full.
 *
 * The two generators report different detail — a class run says how many weekly
 * meetings it wrote, an exam run says which date it landed on — so both keys are
 * optional and the panel renders whichever is present.
 */
export interface GenerationPlaced {
    course_offering_id: number;
    label: string;
    meetings?: number;
    exam_date?: string;
}

/** One offering the generator could not finish placing, and why. */
export interface GenerationUnplaced {
    course_offering_id: number;
    label: string;
    requested: number;
    placed: number;
    reason: string | null;
}

/** One offering the generator left alone because it was already on the timetable. */
export interface GenerationSkipped {
    course_offering_id: number;
    label: string;
    reason: string;
}

export interface GenerationSummary {
    placed?: GenerationPlaced[];
    unplaced?: GenerationUnplaced[];
    skipped?: GenerationSkipped[];
}

/**
 * One automatic-scheduling execution (backend
 * `App\Models\Schedule\ScheduleGenerationRun::indexFields`). Telemetry — it
 * holds no timetable data, only what a run produced.
 */
export interface GenerationRun {
    id: number;
    uuid: string;
    name: string;
    semester_id: number;
    scheduled_count: number;
    unplaced_count: number;
    duration_seconds: number | null;
    status_code: string | null;
    type_code: string | null;
    status?: LookupValueRef | null;
    type?: LookupValueRef | null;
    semester?: ScheduleRef | null;
    run_by?: User | null;
    summary: GenerationSummary;
    started_at: string | null;
    completed_at: string | null;
    created_at?: string;
}

export interface PaginatedGenerationRuns {
    data: GenerationRun[];
    pagination: Pagination | null;
}

/** One weekday, as `GET /constants/scheduling` names it. */
export interface DayOption {
    id: number;
    name: string;
}

/** One slot of the daily generation grid. */
export interface TimeSlot {
    start: string;
    end: string;
}

export interface SchedulingConstants {
    days_of_week: DayOption[];
    teaching_days: number[];
    time_slots: TimeSlot[];
}
