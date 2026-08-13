import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';

/** Compact embeds a request row carries (backend `idAndNameFields`). */
export interface InvigilationRef {
    id: number;
    uuid?: string;
    code?: string;
    name: string;
    /**
     * The instructor embed's staff number. This IS the invigilator code — the
     * backend emits `employee_no`, and no second identity field was introduced
     * for invigilation.
     */
    employee_no?: string | null;
}

/**
 * One person a department has offered against a request.
 *
 * `instructor.code` is `employee_no` — the institution's existing staff
 * identifier, which doubles as the invigilator code. No second identity field
 * was introduced for this.
 */
export interface InvigilationSubmission {
    id: number;
    invigilation_request_department_id: number;
    instructor_id: number;
    remark: string | null;
    instructor?: InvigilationRef | null;
    submitted_by?: User | null;
    submitted_at?: string | null;
}

/**
 * One department's share of a request.
 *
 * `submitted_count`, `remaining_count` and `fulfilment_code` are DERIVED
 * server-side from `required_count` and the submissions on record — they are
 * not stored, so they cannot disagree with the roster.
 */
export interface InvigilationRequestDepartment {
    id: number;
    invigilation_request_id: number;
    department_id: number;
    required_count: number;
    submitted_count: number;
    remaining_count: number;
    /** `pending` | `partial` | `complete`. */
    fulfilment_code: string;
    department?: InvigilationRef | null;
    request?: InvigilationRef | null;
    submissions?: InvigilationSubmission[] | null;
}

/**
 * A registrar's ask for invigilators, as `GET /invigilation/requests` emits it.
 *
 * The scope is a semester plus an exam type — together, what an institution
 * calls "the mid-semester examination". Quantities are per department, because
 * asking Computer Science for ten and Accounting for four is one request
 * carrying two numbers.
 */
export interface InvigilationRequest {
    id: number;
    uuid: string;
    name: string;
    semester_id: number;
    exam_type_lookup_value_id: number;
    status_lookup_value_id: number;
    remark: string | null;
    status_code: string | null;
    exam_type_code: string | null;
    required_total: number;
    submitted_total: number;
    remaining_total: number;
    department_count: number;
    semester?: InvigilationRef | null;
    exam_type?: LookupValueRef | null;
    status?: LookupValueRef | null;
    requested_by?: User | null;
    departments?: InvigilationRequestDepartment[] | null;
    sent_at?: string | null;
    created_at?: string;
}

/** One row of the create form: a department and what it is asked for. */
export interface RequestDepartmentForm {
    department_id: number | null;
    required_count: string;
}

/** Form model. The status is never caller-supplied — a request starts at draft. */
export interface InvigilationRequestForm {
    semester_id: number | null;
    exam_type_lookup_value_id: number | null;
    remark: string;
    departments: RequestDepartmentForm[];
}

export interface PaginatedInvigilationRequests {
    data: InvigilationRequest[];
    pagination: Pagination | null;
}
