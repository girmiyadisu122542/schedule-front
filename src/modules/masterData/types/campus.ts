import type { Pagination, User } from '@/types/CommonTypes';

/**
 * Campus master-data record as `GET /campuses` emits it (backend
 * `App\Models\Physical\Campus::indexFields`). `name` and `address` arrive
 * already localized — the jsonb `{en, am}` object never crosses the API.
 */
export interface Campus {
    id: number;
    uuid: string;
    code: string;
    name: string;
    address: string | null;
    city: string | null;
    is_main: boolean;
    is_active: boolean;
    buildings_count: number | null;
    created_by?: User | null;
    created_at?: string;
}

/** Form model — a single `name` string on the wire, never `{en, am}`. */
export interface CampusForm {
    name: string;
    code: string;
    address: string;
    city: string;
    is_main: boolean;
    is_active: boolean;
}

export interface PaginatedCampuses {
    data: Campus[];
    pagination: Pagination | null;
}
