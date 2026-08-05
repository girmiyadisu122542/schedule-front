import type { Pagination, User } from '@/types/CommonTypes';
import type { ScheduleRef } from '@/modules/scheduling/types/classSchedule';

/**
 * An instructor as its `idAndNameFields` emits it — the employee number rather
 * than a `code`, because that is how a roster identifies a person.
 */
export interface InstructorRef {
    id: number;
    uuid: string;
    employee_no: string;
    name: string;
}

/**
 * One window in which the department declares an instructor available to
 * invigilate (backend
 * `App\Models\Invigilation\InvigilatorAvailability::indexFields`).
 *
 * A row means *available*; the absence of a row means *not offered*. There is
 * no status here and no `state` — which is why `ia_no_overlap` is the one
 * EXCLUDE constraint in the system that applies to every row.
 */
export interface Availability {
    id: number;
    name: string;
    instructor_id: number;
    semester_id: number;
    available_date: string;
    start_time: string;
    end_time: string;
    time_range: string;
    remark: string | null;
    instructor?: InstructorRef | null;
    semester?: ScheduleRef | null;
    submitted_by?: User | null;
    created_at?: string;
}

/** Form model. The submitter is stamped by the backend, never sent. */
export interface AvailabilityForm {
    instructor_id: number | null;
    semester_id: number | null;
    available_date: string;
    start_time: string;
    end_time: string;
    remark: string;
}

export interface PaginatedAvailabilities {
    data: Availability[];
    pagination: Pagination | null;
}
