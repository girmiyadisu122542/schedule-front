import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type {
    Offering,
    OfferingApproval,
    OfferingDetail,
    OfferingSummary,
    PaginatedOfferings
} from '@/modules/offerings/types/offering';

/** Backend resource base — `Route::apiResource('/offerings', ...)`. */
const BASE = '/offerings';

/** Query shape accepted by the offering list endpoint. */
export interface OfferingListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    semester_id?: number;
    course_id?: number;
    college_id?: number;
    department_id?: number;
    program_id?: number;
    section_id?: number;
    instructor_id?: number;
    status_code?: string;
    /**
     * One of the review queues. Stacks with the filters rather than replacing
     * them — `awaiting_me` spans four statuses and depends on who is asking.
     */
    queue?: string;
}

/** Body accepted by create / update. The status is never sent. */
export interface OfferingPayload {
    semester_id: number;
    course_id: number;
    department_id: number;
    program_id?: number | null;
    section_id?: number | null;
    instructor_id?: number | null;
    expected_students?: number;
    remark?: string | null;
    additional_section_ids?: number[];
}

export async function fetchOfferings(params: OfferingListParams = {}): Promise<PaginatedOfferings> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getOffering(key: string | number): Promise<Offering> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

/** The detail read: the offering plus its append-only trail, oldest first. */
export async function getOfferingDetail(key: string | number): Promise<OfferingDetail> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return {
        offering: response.data.data,
        approvals: response.data.approvals ?? []
    };
}

/**
 * What the due tier is recording. `remark` is required on return / reject.
 *
 * `level_lookup_value_id` is deliberately absent: the acting tier is computed
 * server-side from the offering's status. Sending it did not merely duplicate
 * that — it let a caller claim any tier they liked.
 */
export interface ApprovalPayload {
    decision_lookup_value_id: number;
    remark?: string | null;
}

/**
 * Record one tier's decision. The backend appends the trail row and moves the
 * offering's status in one transaction, refusing any edge
 * `lookup_transitions` does not declare.
 */
export async function recordApproval(
    id: number,
    payload: ApprovalPayload
): Promise<{ data: OfferingApproval; offering: Offering; message?: string }> {
    const response = await axiosInstance.post(`${BASE}/${id}/approval`, payload);

    return response.data;
}

export async function createOffering(payload: OfferingPayload): Promise<MutationResult<Offering>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateOffering(id: number, payload: OfferingPayload): Promise<MutationResult<Offering>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteOffering(id: number): Promise<MutationResult<Offering | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

/** Submit a draft into the approval chain. No body — the backend stamps the actor. */
export async function submitOffering(id: number): Promise<MutationResult<Offering>> {
    const response = await axiosInstance.post(`${BASE}/${id}/submit`);

    return response.data;
}

/**
 * Put a REJECTED offering back in its author's hands.
 *
 * Replaces the old generic `change-status`, which accepted any target and wrote
 * no trail row. This one takes no target at all, so `rejected → draft` is the
 * only move it can perform.
 */
export async function reopenOffering(id: number): Promise<MutationResult<Offering>> {
    const response = await axiosInstance.post(`${BASE}/${id}/reopen`);

    return response.data;
}

/** Per-queue counts for the tab badges, honouring the caller's scope. */
export async function fetchOfferingSummary(params: Record<string, unknown> = {}): Promise<OfferingSummary> {
    const response = await axiosInstance.get(`${BASE}/summary`, { params });

    return response.data.data;
}
