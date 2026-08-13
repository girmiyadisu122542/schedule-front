import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { PaginatedScheduleSettings, ScheduleSetting } from '@/modules/scheduling/types/scheduleSetting';

/** Backend resource base — `Route::apiResource('/schedule/settings', ...)`. */
const BASE = '/schedule/settings';

/** Query shape accepted by the settings list endpoint. */
export interface ScheduleSettingListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    study_mode_lookup_value_id?: number;
    study_mode_code?: string;
    is_active?: boolean;
}

/**
 * Body accepted by create / update. `periods` is absent — the backend derives
 * it from the window, the period length, the break and lunch.
 */
export interface ScheduleSettingPayload {
    study_mode_lookup_value_id: number;
    teaching_days: number[];
    day_start: string;
    day_end: string;
    period_minutes: number;
    break_minutes?: number | null;
    lunch_start?: string | null;
    lunch_end?: string | null;
    exam_days: number[];
    exam_day_start: string;
    exam_day_end: string;
    exam_duration_minutes: number;
    exam_gap_minutes?: number | null;
    exam_period_days: number;
    is_active?: boolean;
}

export async function fetchScheduleSettings(
    params: ScheduleSettingListParams = {}
): Promise<PaginatedScheduleSettings> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getScheduleSetting(key: string | number): Promise<ScheduleSetting> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createScheduleSetting(payload: ScheduleSettingPayload): Promise<MutationResult<ScheduleSetting>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateScheduleSetting(
    id: number,
    payload: ScheduleSettingPayload
): Promise<MutationResult<ScheduleSetting>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}
