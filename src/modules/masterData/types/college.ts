import type { Pagination, User } from '@/types/CommonTypes';

/**
 * College master-data record as `GET /colleges` emits it (backend
 * `App\Models\Academic\College::indexFields`).
 *
 * `dean_user_id` is a routing pointer — it names who the college-approval step
 * goes to. It is NOT the authorization source; whether a user may act as Dean is
 * an RBAC question answered by roles/permissions.
 */
export interface College {
    id: number;
    uuid: string;
    code: string;
    name: string;
    dean_user_id: number | null;
    is_active: boolean;
    departments_count: number | null;
    dean?: User | null;
    created_by?: User | null;
    created_at?: string;
}

/** Form model — a single `name` string on the wire, never `{en, am}`. */
export interface CollegeForm {
    name: string;
    code: string;
    dean_user_id: number | null;
    is_active: boolean;
}

export interface PaginatedColleges {
    data: College[];
    pagination: Pagination | null;
}
