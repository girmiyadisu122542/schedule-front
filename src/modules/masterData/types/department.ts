import type { Pagination, User } from '@/types/CommonTypes';

/** The compact college embed a department carries (backend `idAndNameFields`). */
export interface DepartmentCollegeRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * A room the department owns, as the `rooms` embed emits it. Ownership is
 * exclusive — a room appears under exactly one department — so this list is
 * the whole answer to "where may this department's classes go".
 */
export interface DepartmentRoomRef {
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
    rooms?: DepartmentRoomRef[] | null;
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
    /**
     * The rooms this department claims. Sent WHOLE on every save, not as a
     * delta — the server reads the list as "these are ours", so an empty array
     * means "we have none" and releases whatever was held before.
     */
    room_ids: number[];
}

export interface PaginatedDepartments {
    data: Department[];
    pagination: Pagination | null;
}
