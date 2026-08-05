import type { Pagination, User } from '@/types/CommonTypes';

/**
 * Academic year as `GET /academic-years` emits it (backend
 * `App\Models\Academic\AcademicYear::indexFields`).
 *
 * The table has no `is_active` and no soft delete — a year is a period, not a
 * record you retire, so there is no state toggle on this slice.
 * `name` mirrors `code` ("2025/26") so shared list/dropdown components work.
 */
export interface AcademicYear {
    id: number;
    uuid: string;
    code: string;
    name: string;
    is_current: boolean;
    start_date: string;
    end_date: string;
    created_by?: User | null;
    created_at?: string;
}

export interface AcademicYearForm {
    code: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface PaginatedAcademicYears {
    data: AcademicYear[];
    pagination: Pagination | null;
}
