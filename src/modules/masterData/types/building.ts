import type { Pagination, User } from '@/types/CommonTypes';

/** The compact campus embed a building carries (backend `idAndNameFields`). */
export interface BuildingCampusRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * Building master-data record as `GET /buildings` emits it (backend
 * `App\Models\Physical\Building::indexFields`).
 */
export interface Building {
    id: number;
    uuid: string;
    code: string;
    name: string;
    campus_id: number;
    floors: number | null;
    is_active: boolean;
    campus?: BuildingCampusRef | null;
    created_by?: User | null;
    created_at?: string;
}

/** Form model — `floors` stays a string while typing, coerced by the schema. */
export interface BuildingForm {
    name: string;
    code: string;
    campus_id: number | null;
    floors: string;
    is_active: boolean;
}

export interface PaginatedBuildings {
    data: Building[];
    pagination: Pagination | null;
}
