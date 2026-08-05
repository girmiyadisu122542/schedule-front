import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type {
    Offering,
    OfferingApproval,
    OfferingDetail,
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
    department_id?: number;
    section_id?: number;
    instructor_id?: number;
    status_code?: string;
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

/** What one tier is recording. `remark` is required on reject / revision. */
export interface ApprovalPayload {
    level_lookup_value_id: number;
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
 * Move an offering along COURSE_OFFERING_STATUS. The backend rejects any edge
 * `lookup_transitions` does not declare, with `invalid_status_transition`.
 */
export async function changeOfferingStatus(id: number, statusId: number): Promise<MutationResult<Offering>> {
    const response = await axiosInstance.post(`${BASE}/${id}/change-status`, {
        status_lookup_value_id: statusId
    });

    return response.data;
}
