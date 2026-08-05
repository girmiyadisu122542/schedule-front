import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { College, PaginatedColleges } from '@/modules/masterData/types/college';

/** Backend resource base — `Route::apiResource('/colleges', ...)`. */
const BASE = '/colleges';

/** Query shape accepted by the college list endpoint. */
export interface CollegeListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    is_active?: boolean;
}

/** Body accepted by create / update. `name` is one plain localized string. */
export interface CollegePayload {
    name: string;
    code?: string | null;
    dean_user_id?: number | null;
    is_active?: boolean;
}

export async function fetchColleges(params: CollegeListParams = {}): Promise<PaginatedColleges> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getCollege(key: string | number): Promise<College> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createCollege(payload: CollegePayload): Promise<MutationResult<College>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateCollege(id: number, payload: CollegePayload): Promise<MutationResult<College>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteCollege(id: number): Promise<MutationResult<College | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeCollegeState(id: number, isActive: boolean): Promise<MutationResult<College>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
