import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { ClassSchedule, PaginatedClassSchedules } from '@/modules/scheduling/types/classSchedule';

/** Backend resource base — `Route::apiResource('/schedule/class-schedules', ...)`. */
const BASE = '/schedule/class-schedules';

/** Query shape accepted by the class-schedule list endpoint. */
export interface ClassScheduleListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    semester_id?: number;
    course_offering_id?: number;
    section_id?: number;
    instructor_id?: number;
    room_id?: number;
    day_of_week?: number;
    generation_run_id?: number;
    status_code?: string;
}

/**
 * Body accepted by create / update. `semester_id` and `section_id` are absent:
 * the backend mirrors them off the offering, guarded by composite foreign keys.
 */
export interface ClassSchedulePayload {
    course_offering_id: number;
    instructor_id?: number | null;
    room_id?: number | null;
    session_type_lookup_value_id?: number | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

export async function fetchClassSchedules(params: ClassScheduleListParams = {}): Promise<PaginatedClassSchedules> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getClassSchedule(key: string | number): Promise<ClassSchedule> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createClassSchedule(payload: ClassSchedulePayload): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateClassSchedule(
    id: number,
    payload: ClassSchedulePayload
): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteClassSchedule(id: number): Promise<MutationResult<ClassSchedule | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

/**
 * Publish a draft meeting. No body — the backend stamps the actor and refuses
 * any edge `lookup_transitions` does not declare.
 */
export async function publishClassSchedule(id: number): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/publish`);

    return response.data;
}

/**
 * Cancel a published meeting. The backend sets `status -> cancelled` AND
 * `state -> 0` in one write, which frees the slot for someone else.
 */
export async function cancelClassSchedule(id: number): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/cancel`);

    return response.data;
}
