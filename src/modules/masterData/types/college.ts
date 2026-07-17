import type { Pagination } from '@/types/CommonTypes';

/**
 * College / School master-data model.
 *
 * NOTE: the backend migration/API is not implemented yet — this shape is an
 * educated guess at what a university college/school record holds. Adjust the
 * fields here (and the schema + form) once the real migration lands.
 */
export interface College {
    id: number;
    name: string;
    /** Short unique identifier, e.g. "COE" for College of Engineering. */
    code: string;
    description?: string | null;
    /** Head of the college / school. */
    dean_name?: string | null;
    email?: string | null;
    phone?: string | null;
    established_year?: number | null;
    state: number;
    /** Read-only rollup surfaced by the backend. */
    departments_count?: number;
    created_at?: string;
    [key: string]: any;
}

export interface CollegeForm {
    name: string;
    code: string;
    description: string;
    dean_name: string;
    email: string;
    phone: string;
    established_year: string;
    state: number;
}

export interface PaginatedColleges {
    data: College[];
    pagination: Pagination | null;
}
