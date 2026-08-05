import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';

/** Compact building / campus embeds (backend `idAndNameFields`). */
export interface RoomPlaceRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * Bookable venue as `GET /rooms` emits it (backend
 * `App\Models\Physical\Room::indexFields`).
 *
 * `capacity` (teaching) and `exam_capacity` (spaced exam seating) are separate
 * on purpose — one number would either overbook every exam or waste half of
 * every classroom. `is_exam_venue` is a use-flag independent of `room_type_code`.
 */
export interface Room {
    id: number;
    uuid: string;
    code: string;
    name: string | null;
    building_id: number;
    room_type_lookup_value_id: number;
    room_type_code: string | null;
    floor: number | null;
    capacity: number;
    exam_capacity: number | null;
    is_exam_venue: boolean;
    is_active: boolean;
    room_type?: LookupValueRef | null;
    building?: RoomPlaceRef | null;
    campus?: RoomPlaceRef | null;
    created_by?: User | null;
    created_at?: string;
}

/** Form model — numeric inputs stay strings while typing, coerced by the schema. */
export interface RoomForm {
    code: string;
    name: string;
    building_id: number | null;
    room_type_lookup_value_id: number | null;
    floor: string;
    capacity: string;
    exam_capacity: string;
    is_exam_venue: boolean;
    is_active: boolean;
}

export interface PaginatedRooms {
    data: Room[];
    pagination: Pagination | null;
}
