import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';
import type { ScheduleRef } from '@/modules/scheduling/types/classSchedule';

/**
 * The exam embed a duty row carries, with the parts a roster prints.
 *
 * A duty sheet says "CS101 · NB-301", never the whole composed label — but
 * `name` keeps that label for tooltips and detail views.
 */
export interface DutyExamRef extends ScheduleRef {
    course_code?: string | null;
    exam_date?: string | null;
    time_range?: string | null;
    room_code?: string | null;
    room_name?: string | null;
}

/**
 * The compact instructor shape embedded in a duty row.
 *
 * `employee_no` IS the invigilator code — the institution's existing staff
 * number. No second identity was introduced for invigilation.
 */
export interface InstructorRef {
    id: number;
    uuid: string;
    employee_no: string;
    name: string;
}

/**
 * One instructor on duty at one exam (backend
 * `App\Models\Invigilation\ExamInvigilatorAssignment::indexFields`).
 *
 * `exam_date`, `start_time` and `end_time` are copies of the sitting's own, kept
 * in step by a composite foreign key with `ON UPDATE CASCADE` — moving an exam
 * moves every duty with it.
 *
 * `state` is the conflict-liveness flag, not an is_active toggle: declining or
 * being replaced sets it to 0, which frees the invigilator's window without
 * erasing the record of what happened.
 */
export interface Assignment {
    id: number;
    name: string;
    exam_schedule_id: number;
    instructor_id: number;
    role_lookup_value_id: number;
    status_lookup_value_id: number;
    state: number;
    exam_date: string;
    start_time: string;
    end_time: string;
    time_range: string;
    remark: string | null;
    status_code: string | null;
    role_code: string | null;
    status?: LookupValueRef | null;
    role?: LookupValueRef | null;
    exam_schedule?: DutyExamRef | null;
    instructor?: InstructorRef | null;
    assigned_by?: User | null;
    assigned_at?: string | null;
    created_at?: string;
}

/** Form model for assigning someone by hand. */
export interface AssignmentForm {
    exam_schedule_id: number | null;
    instructor_id: number | null;
    role_lookup_value_id: number | null;
    remark: string;
}

export interface PaginatedAssignments {
    data: Assignment[];
    pagination: Pagination | null;
}

/** What one auto-assign run produced. */
export interface AutoAssignResult {
    assigned: number;
    short: Array<{
        exam_schedule_id: number;
        label: string;
        required: number;
        on_duty: number;
    }>;
}
