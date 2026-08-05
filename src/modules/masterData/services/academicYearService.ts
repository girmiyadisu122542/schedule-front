import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { AcademicYear, PaginatedAcademicYears } from '@/modules/masterData/types/academicYear';

/** Backend resource base — `Route::apiResource('/academic-years', ...)`. */
const BASE = '/academic-years';

/** Query shape accepted by the academic year list endpoint. */
export interface AcademicYearListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    is_current?: boolean;
}

/** Body accepted by create / update. Dates are `Y-m-d` strings. */
export interface AcademicYearPayload {
    code: string;
    start_date: string;
    end_date: string;
    is_current?: boolean;
}

export async function fetchAcademicYears(params: AcademicYearListParams = {}): Promise<PaginatedAcademicYears> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getAcademicYear(key: string | number): Promise<AcademicYear> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createAcademicYear(payload: AcademicYearPayload): Promise<MutationResult<AcademicYear>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateAcademicYear(
    id: number,
    payload: AcademicYearPayload
): Promise<MutationResult<AcademicYear>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteAcademicYear(id: number): Promise<MutationResult<AcademicYear | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}
