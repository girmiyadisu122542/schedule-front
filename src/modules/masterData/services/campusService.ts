import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Campus, PaginatedCampuses } from '@/modules/masterData/types/campus';

/** Backend resource base — `Route::apiResource('/campuses', ...)`. */
const BASE = '/campuses';

/** Query shape accepted by the campus list endpoint. */
export interface CampusListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    is_active?: boolean;
    is_main?: boolean;
}

/** Body accepted by create / update. `name` is one plain localized string. */
export interface CampusPayload {
    name: string;
    code?: string | null;
    address?: string | null;
    city?: string | null;
    is_main?: boolean;
    is_active?: boolean;
}

export async function fetchCampuses(params: CampusListParams = {}): Promise<PaginatedCampuses> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getCampus(key: string | number): Promise<Campus> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createCampus(payload: CampusPayload): Promise<MutationResult<Campus>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateCampus(id: number, payload: CampusPayload): Promise<MutationResult<Campus>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteCampus(id: number): Promise<MutationResult<Campus | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeCampusState(id: number, isActive: boolean): Promise<MutationResult<Campus>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
