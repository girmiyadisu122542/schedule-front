import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Course, PaginatedCourses } from '@/modules/masterData/types/course';

/** Backend resource base — `Route::apiResource('/courses', ...)`. */
const BASE = '/courses';

/** Query shape accepted by the course list endpoint. */
export interface CourseListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    is_active?: boolean;
    department_id?: number;
    course_type_lookup_value_id?: number;
}

/** Body accepted by create / update. */
export interface CoursePayload {
    title: string;
    code: string;
    description?: string | null;
    department_id: number;
    course_type_lookup_value_id: number;
    credit_hours: number;
    contact_hours?: number | null;
    lecture_hours_per_week?: number | null;
    lab_hours_per_week?: number | null;
    tutorial_hours_per_week?: number | null;
    sessions_per_week?: number | null;
    /** Null means the study mode's default exam length. */
    exam_duration_minutes?: number | null;
    is_active?: boolean;
}

export async function fetchCourses(params: CourseListParams = {}): Promise<PaginatedCourses> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getCourse(key: string | number): Promise<Course> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createCourse(payload: CoursePayload): Promise<MutationResult<Course>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateCourse(id: number, payload: CoursePayload): Promise<MutationResult<Course>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteCourse(id: number): Promise<MutationResult<Course | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeCourseState(id: number, isActive: boolean): Promise<MutationResult<Course>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
