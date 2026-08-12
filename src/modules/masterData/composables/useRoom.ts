import { computed } from 'vue';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { roomSchema } from '@/modules/masterData/schemas/roomSchema';
import { useCrudResource } from '@/composables/useCrudResource';
import { useImportExport } from '@/composables/useImportExport';
import type { Room, RoomForm } from '@/modules/masterData/types/room';
import {
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    changeRoomState,
    type RoomListParams,
    type RoomPayload
} from '@/modules/masterData/services/roomService';

const emptyForm = (): RoomForm => ({
    code: '',
    name: '',
    building_id: null,
    room_type_lookup_value_id: null,
    floor: '',
    capacity: '',
    exam_capacity: '',
    is_exam_venue: false,
    is_active: true
});

function roomManager() {
    const { customizeLanguageData } = useLanguageStore();

    const columns = computed(() => [
        { key: 'code', label: customizeLanguageData('code', 'Code') },
        { key: 'name', label: customizeLanguageData('name', 'Name') },
        { key: 'location', label: customizeLanguageData('location', 'Location') },
        { key: 'room_type_code', label: customizeLanguageData('roomType', 'Type') },
        { key: 'capacity', label: customizeLanguageData('capacity', 'Capacity') },
        { key: 'is_exam_venue', label: customizeLanguageData('examVenue', 'Exam Venue') },
        { key: 'is_active', label: customizeLanguageData('state', 'State') }
    ]);

    const resource = useCrudResource<Room, RoomForm, RoomPayload>({
        entity: 'Room',
        labelKey: 'room',
        labelFallback: 'Room',
        service: {
            fetchList: (params) => fetchRooms(params as RoomListParams),
            create: createRoom,
            update: updateRoom,
            remove: deleteRoom,
            changeState: changeRoomState
        },
        emptyForm,
        toForm: (room) => ({
            code: room.code,
            name: room.name ?? '',
            building_id: room.building_id,
            room_type_lookup_value_id: room.room_type_lookup_value_id,
            floor: room.floor != null ? String(room.floor) : '',
            capacity: String(room.capacity),
            exam_capacity: room.exam_capacity != null ? String(room.exam_capacity) : '',
            is_exam_venue: room.is_exam_venue,
            is_active: room.is_active
        }),
        detailPath: (room) => `/rooms/${room.uuid}`,
        schema: roomSchema,
        columns,
        // An unnamed room is identified by its code on a timetable ("NB-301").
        rowLabel: (room) => room.name || room.code
    });

    const importExport = useImportExport({
        baseUrl: '/rooms',
        entity: 'Room',
        filePrefix: 'rooms',
        labelKey: 'room',
        labelFallback: 'Room',
        importOrderKey: 'importOrderRooms',
        importOrderFallback: 'Buildings must exist first: campuses → buildings → rooms.',
        // Read at click time, so an export carries the filters the list
        // currently has applied rather than a snapshot from mount.
        currentParams: resource.currentQueryParams,
        onImported: () => resource.fetchItems()
    });

    return {
        ...resource,
        ...importExport,
        rooms: resource.items,
        fetchRooms: resource.fetchItems,
        saveRoomForm: resource.saveForm
    };
}

export const useRoom = createSharedComposable(roomManager);
