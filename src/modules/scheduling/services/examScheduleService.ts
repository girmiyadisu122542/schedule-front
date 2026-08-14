import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { ExamSchedule, PaginatedExamSchedules } from '@/modules/scheduling/types/examSchedule';
import type { GenerationRun } from '@/modules/scheduling/types/classSchedule';

/** Backend resource base — `Route::apiResource('/schedule/exam-schedules', ...)`. */
const BASE = '/schedule/exam-schedules';

/** Query shape accepted by the exam-schedule list endpoint. */
export interface ExamScheduleListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    semester_id?: number;
    course_offering_id?: number;
    section_id?: number;
    room_id?: number;
    exam_date?: string;
    generation_run_id?: number;
    exam_type_code?: string;
    status_code?: string;
}

/**
 * Body accepted by create / update. `semester_id` and `section_id` are absent:
 * the backend mirrors them off the offering, guarded by composite foreign keys.
 */
export interface ExamSchedulePayload {
    course_offering_id: number;
    exam_type_lookup_value_id: number;
    room_id?: number | null;
    exam_date: string;
    start_time: string;
    end_time: string;
    required_invigilators?: number;
    /** Accommodations (C21) — null when the sitting needs none, which is most. */
    accommodation_note?: string | null;
    accommodation_extra_minutes?: number | null;
    accommodation_room_id?: number | null;
}

export async function fetchExamSchedules(params: ExamScheduleListParams = {}): Promise<PaginatedExamSchedules> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getExamSchedule(key: string | number): Promise<ExamSchedule> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createExamSchedule(payload: ExamSchedulePayload): Promise<MutationResult<ExamSchedule>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateExamSchedule(
    id: number,
    payload: ExamSchedulePayload
): Promise<MutationResult<ExamSchedule>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteExamSchedule(id: number): Promise<MutationResult<ExamSchedule | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

/**
 * The department confirmation step. One endpoint covers both halves of the move
 * — asking for confirmation from `draft`, and giving it from
 * `pending_confirmation` — because which one happens depends on where the
 * sitting already is, not on anything sent here. The remark is the department's
 * note and only lands on the second half.
 */
export async function confirmExamSchedule(id: number, remark?: string | null): Promise<MutationResult<ExamSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/confirm`, { confirmation_remark: remark ?? null });

    return response.data;
}

/**
 * Publish a sitting. Legal from `draft` and from `confirmed`; the backend
 * refuses publishing one still waiting on the department.
 */
export async function publishExamSchedule(id: number): Promise<MutationResult<ExamSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/publish`);

    return response.data;
}

/**
 * Cancel a sitting. The backend sets `status -> cancelled` AND `state -> 0` in
 * one write, which frees the hall and the cohort's window.
 */
export async function cancelExamSchedule(id: number): Promise<MutationResult<ExamSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/cancel`);

    return response.data;
}

/**
 * Trigger automatic exam scheduling for one semester. Returns the same
 * `schedule_generation_runs` shape the class generator writes.
 */
/**
 * Pin a draft sitting so the next generation run schedules around it.
 */
export async function pinExamSchedule(id: number, isPinned: boolean): Promise<MutationResult<ExamSchedule>> {
    const response = await axiosInstance.post(`${BASE}/${id}/pin`, { is_pinned: isPinned });

    return response.data;
}

export async function generateExamSchedules(
    semesterId: number,
    examTypeId?: number | null,
    dryRun = false
): Promise<MutationResult<GenerationRun>> {
    const response = await axiosInstance.post('/schedule/generate-exam', {
        semester_id: semesterId,
        exam_type_lookup_value_id: examTypeId ?? null,
        dry_run: dryRun
    });

    return response.data;
}
