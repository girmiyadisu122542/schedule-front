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
 * Publish a draft session. No body — the backend stamps the actor and refuses
 * any edge `lookup_transitions` does not declare.
 */
export async function publishClassSchedule(id: number): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/publish`);

    return response.data;
}

/**
 * Cancel a published session. The backend sets `status -> cancelled` AND
 * `state -> 0` in one write, which frees the slot for someone else.
 */
export async function cancelClassSchedule(id: number): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/cancel`);

    return response.data;
}

/**
 * Pin a draft session so the next generation run schedules around it instead
 * of replacing it. The row stays live either way, so its room, instructor and
 * section slot remain protected by the database constraints.
 */
export async function pinClassSchedule(id: number, isPinned: boolean): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/pin`, { is_pinned: isPinned });

    return response.data;
}

/**
 * Cancel one week of a recurring session — a public holiday, say.
 *
 * Not the same as cancelling the session: every other week is untouched, and
 * the room stays booked for them.
 */
export async function cancelScheduleWeek(
    id: number,
    exceptionDate: string,
    reason?: string | null
): Promise<MutationResult<{ id: number; exception_date: string; reason: string | null }>> {
    const response = await axiosInstance.post(`${BASE}/${id}/exceptions`, {
        exception_date: exceptionDate,
        reason: reason || null
    });

    return response.data;
}

/** Put a cancelled week back on. */
export async function reinstateScheduleWeek(id: number, exceptionId: number): Promise<MutationResult<null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}/exceptions/${exceptionId}`);

    return response.data;
}

/**
 * The department confirmation step (C26).
 *
 * Which move this is depends on where the session already is, not on what is
 * sent: from `draft` it asks the department, from `pending_confirmation` it is
 * the department's answer.
 */
export async function confirmClassSchedule(id: number, remark?: string | null): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/confirm`, { confirmation_remark: remark || null });

    return response.data;
}

/** The department disagrees — back to draft, with the reason recorded. */
export async function returnClassScheduleToDraft(
    id: number,
    remark?: string | null
): Promise<MutationResult<ClassSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/return-to-draft`, { confirmation_remark: remark || null });

    return response.data;
}

/** One free slot the offering could be placed into (C24). */
export interface PlacementSuggestion {
    day_of_week: number;
    start_time: string;
    end_time: string;
    room_id: number;
    room_code: string;
    room_name: string | null;
    building: string | null;
    capacity: number;
    score: number;
}

/**
 * Where an unplaced offering would fit, best first.
 *
 * The search takes no locks, so a suggestion can go stale between being shown
 * and being taken. Acting on one goes through `createClassSchedule`, where the
 * database constraints have the final word — a stale suggestion is refused
 * there rather than quietly double-booking anything.
 */
export async function fetchPlacementSuggestions(courseOfferingId: number, limit = 5): Promise<PlacementSuggestion[]> {
    const response = await axiosInstance.get(`${BASE}/suggestions`, {
        params: { course_offering_id: courseOfferingId, limit }
    });

    return response.data.data ?? [];
}
