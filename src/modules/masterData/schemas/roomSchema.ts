import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import {
    MAX_NAME_LENGTH,
    MAX_ROOM_CODE_LENGTH,
    MAX_ROOM_CAPACITY,
    MIN_BUILDING_FLOORS,
    MAX_BUILDING_FLOORS
} from '@/config/appConfig';

/**
 * Reactive Zod factory for the room form. Bounds mirror the CHECK constraints in
 * `Final Schema.md §9`. The exam-capacity rule is conditional on `is_exam_venue`,
 * matching the backend's `required_if` — a venue with no spaced-seating figure
 * cannot be scheduled.
 */
export const roomSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    const optionalWholeNumber = (min: number, max: number, message: string) =>
        z
            .string()
            .trim()
            .transform((value) => (value ? Number(value) : null))
            .refine((value) => value === null || (Number.isInteger(value) && value >= min && value <= max), message);

    return computed(() =>
        z
            .object({
                code: z
                    .string()
                    .trim()
                    .min(1, translations.value.codeIsRequired || 'Room code is required')
                    .max(
                        MAX_ROOM_CODE_LENGTH,
                        translations.value.codeIsTooLong || `Code must be at most ${MAX_ROOM_CODE_LENGTH} characters`
                    ),
                name: z
                    .string()
                    .trim()
                    .max(
                        MAX_NAME_LENGTH,
                        translations.value.nameIsTooLong || `Name must be at most ${MAX_NAME_LENGTH} characters`
                    )
                    .transform((value) => value || null),
                building_id: z
                    .number({ message: translations.value.buildingIsRequired || 'Please choose a building' })
                    .int()
                    .positive(translations.value.buildingIsRequired || 'Please choose a building'),
                room_type_lookup_value_id: z
                    .number({ message: translations.value.roomTypeIsRequired || 'Please choose a room type' })
                    .int()
                    .positive(translations.value.roomTypeIsRequired || 'Please choose a room type'),
                floor: optionalWholeNumber(
                    MIN_BUILDING_FLOORS,
                    MAX_BUILDING_FLOORS,
                    translations.value.invalidFloor || 'Enter a plausible floor number'
                ),
                capacity: z
                    .string()
                    .trim()
                    .min(1, translations.value.capacityIsRequired || 'Capacity is required')
                    .transform((value) => Number(value))
                    .refine(
                        (value) => Number.isInteger(value) && value > 0 && value <= MAX_ROOM_CAPACITY,
                        translations.value.invalidCapacity || 'Capacity must be greater than zero'
                    ),
                exam_capacity: optionalWholeNumber(
                    1,
                    MAX_ROOM_CAPACITY,
                    translations.value.invalidExamCapacity || 'Exam capacity must be greater than zero'
                ),
                is_exam_venue: z.boolean(),
                is_active: z.boolean()
            })
            .refine((value) => !value.is_exam_venue || value.exam_capacity !== null, {
                path: ['exam_capacity'],
                message: translations.value.examCapacityRequired || 'An exam venue needs a spaced-seating capacity'
            })
    );
};
