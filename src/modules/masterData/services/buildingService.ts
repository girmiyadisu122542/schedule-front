import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Building, PaginatedBuildings } from '@/modules/masterData/types/building';

/** Backend resource base — `Route::apiResource('/buildings', ...)`. */
const BASE = '/buildings';

/** Query shape accepted by the building list endpoint. */
export interface BuildingListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    campus_id?: number;
    is_active?: boolean;
}

/** Body accepted by create / update. `name` is one plain localized string. */
export interface BuildingPayload {
    name: string;
    code?: string | null;
    campus_id: number;
    floors?: number | null;
    is_active?: boolean;
}

export async function fetchBuildings(params: BuildingListParams = {}): Promise<PaginatedBuildings> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getBuilding(key: string | number): Promise<Building> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createBuilding(payload: BuildingPayload): Promise<MutationResult<Building>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateBuilding(id: number, payload: BuildingPayload): Promise<MutationResult<Building>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteBuilding(id: number): Promise<MutationResult<Building | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeBuildingState(id: number, isActive: boolean): Promise<MutationResult<Building>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
