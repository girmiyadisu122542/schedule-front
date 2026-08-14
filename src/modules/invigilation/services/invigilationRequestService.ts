import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type {
    InvigilationRequest,
    InvigilationRequestDepartment,
    PaginatedInvigilationRequests
} from '@/modules/invigilation/types/invigilationRequest';

/** Backend resource base — `Route::apiResource('/invigilation/requests', ...)`. */
const BASE = '/invigilation/requests';

/** Query shape accepted by the request list endpoint. */
export interface InvigilationRequestListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    semester_id?: number;
    exam_type_lookup_value_id?: number;
    department_id?: number;
    status_code?: string;
}

/** Body accepted by create / update. Each department carries its own quantity. */
export interface InvigilationRequestPayload {
    semester_id: number;
    exam_type_lookup_value_id: number;
    remark?: string | null;
    departments: { department_id: number; required_count: number }[];
}

export async function fetchInvigilationRequests(
    params: InvigilationRequestListParams = {}
): Promise<PaginatedInvigilationRequests> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getInvigilationRequest(key: string | number): Promise<InvigilationRequest> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createInvigilationRequest(
    payload: InvigilationRequestPayload
): Promise<MutationResult<InvigilationRequest>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateInvigilationRequest(
    id: number,
    payload: InvigilationRequestPayload
): Promise<MutationResult<InvigilationRequest>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

/**
 * Send a draft to its departments. No body — the backend stamps the actor and
 * refuses any edge `lookup_transitions` does not declare.
 */
export async function sendInvigilationRequest(id: number): Promise<MutationResult<InvigilationRequest>> {
    const response = await axiosInstance.post(`${BASE}/${id}/send`);

    return response.data;
}

/** Close a sent request. Whoever was submitted stays in the pool. */
export async function closeInvigilationRequest(id: number): Promise<MutationResult<InvigilationRequest>> {
    const response = await axiosInstance.post(`${BASE}/${id}/close`);

    return response.data;
}

/**
 * A department answers its OWN share — keyed by the share, never the request,
 * because a department speaks only for its own line.
 */
export async function submitInvigilators(
    shareId: number,
    instructorIds: number[],
    remark?: string | null
): Promise<MutationResult<InvigilationRequestDepartment>> {
    const response = await axiosInstance.post(`/invigilation/request-departments/${shareId}/submit`, {
        instructor_ids: instructorIds,
        remark: remark ?? null
    });

    return response.data;
}

/** Take one submitted person back. */
export async function withdrawInvigilator(
    submissionId: number
): Promise<MutationResult<InvigilationRequestDepartment>> {
    const response = await axiosInstance.delete(`/invigilation/submissions/${submissionId}`);

    return response.data;
}
