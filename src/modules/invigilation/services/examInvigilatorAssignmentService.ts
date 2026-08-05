import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Assignment, AutoAssignResult, PaginatedAssignments } from '@/modules/invigilation/types/assignment';

const BASE = '/invigilation/assignments';

/** Query shape accepted by the duty list endpoint. */
export interface AssignmentListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    exam_schedule_id?: number;
    instructor_id?: number;
    semester_id?: number;
    exam_date?: string;
    status_code?: string;
    role_code?: string;
}

/**
 * Body accepted by assign. The sitting's date and times are absent: the backend
 * mirrors them off the exam, guarded by a composite foreign key.
 */
export interface AssignmentPayload {
    exam_schedule_id: number;
    instructor_id: number;
    role_lookup_value_id?: number | null;
    remark?: string | null;
}

export async function fetchAssignments(params: AssignmentListParams = {}): Promise<PaginatedAssignments> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

export async function assignInvigilator(payload: AssignmentPayload): Promise<MutationResult<Assignment>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

/**
 * Record the instructor's answer. The decision travels as an
 * INVIGILATION_STATUS value id so a typo cannot reach the service; declining
 * sets `state` to 0 server-side, which frees the invigilator.
 */
export async function respondToAssignment(id: number, statusId: number): Promise<MutationResult<Assignment>> {
    const response = await axiosInstance.post(`${BASE}/${id}/respond`, { status_lookup_value_id: statusId });

    return response.data;
}

/**
 * Swap one invigilator for another on the same duty. The backend releases the
 * outgoing row and inserts the replacement in one transaction — which is what
 * lets the newcomer take a window the outgoing person was holding.
 */
export async function replaceInvigilator(
    id: number,
    instructorId: number,
    remark?: string | null
): Promise<MutationResult<Assignment>> {
    const response = await axiosInstance.post(`${BASE}/${id}/replace`, {
        instructor_id: instructorId,
        remark: remark ?? null
    });

    return response.data;
}

/** Staff every sitting in a semester from the offered availability windows. */
export async function autoAssignInvigilators(semesterId: number): Promise<MutationResult<AutoAssignResult>> {
    const response = await axiosInstance.post('/invigilation/auto-assign', { semester_id: semesterId });

    return response.data;
}
