import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';

/** The compact academic-year embed a semester carries (backend `idAndNameFields`). */
export interface SemesterAcademicYearRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * Semester as `GET /semesters` emits it (backend
 * `App\Models\Academic\Semester::indexFields`).
 *
 * The table has no `is_active` and no `state` — the only lifecycle move is the
 * guarded SEMESTER_STATUS transition, so this slice has no state toggle.
 * `status_code` is the stable code the badge and the transition machine read.
 * `name` falls back to "2025/26 - Semester 2" when the jsonb name is empty.
 */
export interface Semester {
    id: number;
    uuid: string;
    term: number;
    name: string;
    academic_year_id: number;
    status_lookup_value_id: number;
    status_code: string | null;
    is_current: boolean;
    start_date: string;
    end_date: string;
    /** The exam period. Mandatory — the exam generator reads it directly. */
    exam_start_date: string;
    exam_end_date: string;
    status?: LookupValueRef | null;
    academic_year?: SemesterAcademicYearRef | null;
    created_by?: User | null;
    created_at?: string;
}

/**
 * Form model. `status_lookup_value_id` is absent on purpose — a semester is
 * created at `planning` and moves only through the change-status endpoint.
 */
export interface SemesterForm {
    academic_year_id: number | null;
    term: number | null;
    name: string;
    start_date: string;
    end_date: string;
    /** The exam period. Mandatory — the exam generator reads it directly. */
    exam_start_date: string;
    exam_end_date: string;
    is_current: boolean;
}

export interface PaginatedSemesters {
    data: Semester[];
    pagination: Pagination | null;
}
