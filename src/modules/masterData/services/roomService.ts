import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type { Room, PaginatedRooms } from '@/modules/masterData/types/room';

/** Backend resource base — `Route::apiResource('/rooms', ...)`. */
const BASE = '/rooms';

/** Query shape accepted by the room list endpoint. */
export interface RoomListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    search?: string;
    is_active?: boolean;
    building_id?: number;
    room_type_lookup_value_id?: number;
    is_exam_venue?: boolean;
}

/** Body accepted by create / update. */
export interface RoomPayload {
    code: string;
    name?: string | null;
    building_id: number;
    room_type_lookup_value_id: number;
    floor?: number | null;
    capacity: number;
    exam_capacity?: number | null;
    is_exam_venue?: boolean;
    is_active?: boolean;
}

export async function fetchRooms(params: RoomListParams = {}): Promise<PaginatedRooms> {
    const response = await axiosInstance.get(BASE, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** Reads accept a numeric id OR a uuid; the frontend routes by uuid. */
export async function getRoom(key: string | number): Promise<Room> {
    const response = await axiosInstance.get(`${BASE}/${key}`);

    return response.data.data;
}

export async function createRoom(payload: RoomPayload): Promise<MutationResult<Room>> {
    const response = await axiosInstance.post(BASE, payload);

    return response.data;
}

export async function updateRoom(id: number, payload: RoomPayload): Promise<MutationResult<Room>> {
    const response = await axiosInstance.put(`${BASE}/${id}`, payload);

    return response.data;
}

export async function deleteRoom(id: number): Promise<MutationResult<Room | null>> {
    const response = await axiosInstance.delete(`${BASE}/${id}`);

    return response.data;
}

export async function changeRoomState(id: number, isActive: boolean): Promise<MutationResult<Room>> {
    const response = await axiosInstance.post(`${BASE}/${id}/state`, { is_active: isActive });

    return response.data;
}
