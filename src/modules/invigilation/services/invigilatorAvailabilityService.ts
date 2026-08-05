import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Availability, PaginatedAvailabilities } from '@/modules/invigilation/types/availability';

const BASE = '/invigilation/availabilities';

/** Query shape accepted by the availability list endpoint. */
export interface AvailabilityListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    instructor_id?: number;
    semester_id?: number;
    available_date?: string;
}

/** Body accepted by submit. The submitter is stamped server-side. */
export interface AvailabilityPayload {
    instructor_id: number;
    semester_id: number;
    available_date: string;
    start_time: string;
    end_time: string;
    remark?: string | null;
}

export async function fetchAvailabilities(params: AvailabilityListParams = {}): Promise<PaginatedAvailabilities> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

export async function submitAvailability(payload: AvailabilityPayload): Promise<MutationResult<Availability>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

/**
 * There is deliberately no update endpoint: a window is a statement, so a wrong
 * one is withdrawn and re-submitted rather than edited.
 */
export async function deleteAvailability(id: number): Promise<MutationResult<Availability | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}
