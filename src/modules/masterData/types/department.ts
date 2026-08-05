import type { Pagination, User } from '@/types/CommonTypes';

/** The compact college embed a department carries (backend `idAndNameFields`). */
export interface DepartmentCollegeRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * Department master-data record as `GET /departments` emits it (backend
 * `App\Models\Academic\Department::indexFields`). `head_user_id` is a routing
 * pointer for the department-approval step, not an authorization source.
 */
export interface Department {
    id: number;
    uuid: string;
    code: string;
    name: string;
    college_id: number;
    head_user_id: number | null;
    is_active: boolean;
    college?: DepartmentCollegeRef | null;
    head?: User | null;
    created_by?: User | null;
    created_at?: string;
}

/** Form model — a single `name` string on the wire, never `{en, am}`. */
export interface DepartmentForm {
    name: string;
    code: string;
    college_id: number | null;
    head_user_id: number | null;
    is_active: boolean;
}

export interface PaginatedDepartments {
    data: Department[];
    pagination: Pagination | null;
}
