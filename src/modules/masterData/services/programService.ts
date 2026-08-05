import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Program, PaginatedPrograms } from '@/modules/masterData/types/program';

/** Backend resource base — `Route::apiResource('/programs', ...)`. */
const BASE = '/programs';

/** Query shape accepted by the program list endpoint. */
export interface ProgramListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    department_id?: number;
    is_active?: boolean;
}

/** Body accepted by create / update. `name` is one plain localized string. */
export interface ProgramPayload {
    name: string;
    code?: string | null;
    department_id: number;
    degree_level_lookup_value_id: number;
    duration_years: number;
    is_active?: boolean;
}

export async function fetchPrograms(params: ProgramListParams = {}): Promise<PaginatedPrograms> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getProgram(key: string | number): Promise<Program> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createProgram(payload: ProgramPayload): Promise<MutationResult<Program>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateProgram(id: number, payload: ProgramPayload): Promise<MutationResult<Program>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteProgram(id: number): Promise<MutationResult<Program | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeProgramState(id: number, isActive: boolean): Promise<MutationResult<Program>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
