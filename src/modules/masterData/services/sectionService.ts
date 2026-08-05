import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Section, PaginatedSections } from '@/modules/masterData/types/section';

/** Backend resource base — `Route::apiResource('/sections', ...)`. */
const BASE = '/sections';

/** Query shape accepted by the section list endpoint. */
export interface SectionListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    is_active?: boolean;
    program_id?: number;
    academic_year_id?: number;
    year_level?: number;
}

/** Body accepted by create / update. */
export interface SectionPayload {
    program_id: number;
    academic_year_id: number;
    year_level: number;
    label: string;
    expected_students?: number;
    is_active?: boolean;
}

export async function fetchSections(params: SectionListParams = {}): Promise<PaginatedSections> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getSection(key: string | number): Promise<Section> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createSection(payload: SectionPayload): Promise<MutationResult<Section>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateSection(id: number, payload: SectionPayload): Promise<MutationResult<Section>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteSection(id: number): Promise<MutationResult<Section | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeSectionState(id: number, isActive: boolean): Promise<MutationResult<Section>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
