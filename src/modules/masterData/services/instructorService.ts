import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Instructor, PaginatedInstructors } from '@/modules/masterData/types/instructor';

/** Backend resource base — `Route::apiResource('/instructors', ...)`. */
const BASE = '/instructors';

/** Query shape accepted by the instructor list endpoint. */
export interface InstructorListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    is_active?: boolean;
    department_id?: number;
    can_teach?: boolean;
    can_invigilate?: boolean;
}

/** Body accepted by create / update. */
export interface InstructorPayload {
    full_name: string;
    employee_no: string;
    email?: string | null;
    phone?: string | null;
    department_id: number;
    academic_rank?: string | null;
    /** The person's optional portal account — not a creator reference. */
    user_id?: number | null;
    can_teach?: boolean;
    can_invigilate?: boolean;
    max_weekly_hours?: number | null;
    is_active?: boolean;
}

export async function fetchInstructors(params: InstructorListParams = {}): Promise<PaginatedInstructors> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getInstructor(key: string | number): Promise<Instructor> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createInstructor(payload: InstructorPayload): Promise<MutationResult<Instructor>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateInstructor(id: number, payload: InstructorPayload): Promise<MutationResult<Instructor>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteInstructor(id: number): Promise<MutationResult<Instructor | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeInstructorState(id: number, isActive: boolean): Promise<MutationResult<Instructor>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
