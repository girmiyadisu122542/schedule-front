import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Semester, PaginatedSemesters } from '@/modules/masterData/types/semester';

/** Backend resource base — `Route::apiResource('/semesters', ...)`. */
const BASE = '/semesters';

/** Query shape accepted by the semester list endpoint. */
export interface SemesterListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    academic_year_id?: number;
    status_code?: string;
    is_current?: boolean;
}

/** Body accepted by create / update. The status is NOT settable here. */
export interface SemesterPayload {
    academic_year_id: number;
    term: number;
    name?: string | null;
    start_date: string;
    end_date: string;
    is_current?: boolean;
}

export async function fetchSemesters(params: SemesterListParams = {}): Promise<PaginatedSemesters> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getSemester(key: string | number): Promise<Semester> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createSemester(payload: SemesterPayload): Promise<MutationResult<Semester>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateSemester(id: number, payload: SemesterPayload): Promise<MutationResult<Semester>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteSemester(id: number): Promise<MutationResult<Semester | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

/**
 * Move a semester along the SEMESTER_STATUS lifecycle. The backend rejects any
 * edge that `lookup_transitions` does not declare, with `invalid_status_transition`.
 */
export async function changeSemesterStatus(id: number, statusId: number): Promise<MutationResult<Semester>> {
    const response = await axiosInstance.post(`${BASE}/${id}/change-status`, {
        status_lookup_value_id: statusId
    });

    return response.data;
}
