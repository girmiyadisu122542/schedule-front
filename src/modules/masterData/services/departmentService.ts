import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Department, PaginatedDepartments } from '@/modules/masterData/types/department';

/** Backend resource base — `Route::apiResource('/departments', ...)`. */
const BASE = '/departments';

/** Query shape accepted by the department list endpoint. */
export interface DepartmentListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    college_id?: number;
    is_active?: boolean;
}

/** Body accepted by create / update. `name` is one plain localized string. */
export interface DepartmentPayload {
    name: string;
    code?: string | null;
    college_id: number;
    head_user_id?: number | null;
    is_active?: boolean;
    /** The department's rooms, sent whole. An empty array releases them all. */
    room_ids?: number[];
}

export async function fetchDepartments(params: DepartmentListParams = {}): Promise<PaginatedDepartments> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getDepartment(key: string | number): Promise<Department> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createDepartment(payload: DepartmentPayload): Promise<MutationResult<Department>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateDepartment(id: number, payload: DepartmentPayload): Promise<MutationResult<Department>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteDepartment(id: number): Promise<MutationResult<Department | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeDepartmentState(id: number, isActive: boolean): Promise<MutationResult<Department>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
