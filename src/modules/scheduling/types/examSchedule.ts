import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';
import type { ScheduleRef } from '@/modules/scheduling/types/classSchedule';

/**
 * One exam sitting, as `GET /schedule/exam-schedules` emits it (backend
 * `App\Models\Schedule\ExamSchedule::indexFields`).
 *
 * As on a class meeting, `state` is the conflict-liveness flag the two
 * PostgreSQL EXCLUDE constraints read — not an `is_active` toggle. Cancelling
 * sets `status_code = 'cancelled'` AND `state = 0` in one write, which frees
 * the hall and the cohort's window.
 */
export interface ExamSchedule {
    id: number;
    uuid: string;
    name: string;
    course_offering_id: number;
    semester_id: number;
    section_id: number | null;
    room_id: number | null;
    exam_type_lookup_value_id: number;
    status_lookup_value_id: number;
    generation_run_id: number | null;
    required_invigilators: number;
    state: number;
    exam_date: string;
    start_time: string;
    end_time: string;
    time_range: string;
    status_code: string | null;
    exam_type_code: string | null;
    confirmation_remark: string | null;
    status?: LookupValueRef | null;
    exam_type?: LookupValueRef | null;
    course_offering?: ScheduleRef | null;
    semester?: ScheduleRef | null;
    section?: ScheduleRef | null;
    room?: ScheduleRef | null;
    created_by?: User | null;
    confirmed_by?: User | null;
    published_by?: User | null;
    confirmed_at?: string | null;
    published_at?: string | null;
    created_at?: string;
}

/**
 * Form model. `semester_id` and `section_id` are absent on purpose: the backend
 * mirrors them off the offering. So is the status — a sitting is created at
 * `draft` and moves only through confirm / publish / cancel.
 */
export interface ExamScheduleForm {
    course_offering_id: number | null;
    exam_type_lookup_value_id: number | null;
    room_id: number | null;
    exam_date: string;
    start_time: string;
    end_time: string;
    required_invigilators: string;
}

export interface PaginatedExamSchedules {
    data: ExamSchedule[];
    pagination: Pagination | null;
}
