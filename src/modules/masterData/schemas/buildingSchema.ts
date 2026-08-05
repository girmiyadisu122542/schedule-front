import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import {
    MIN_NAME_LENGTH,
    MAX_NAME_LENGTH,
    MAX_CAMPUS_CODE_LENGTH,
    MIN_BUILDING_FLOORS,
    MAX_BUILDING_FLOORS
} from '@/config/appConfig';

/**
 * Reactive Zod factory for the building form. Bounds come from appConfig only —
 * they mirror the backend column widths in `Final Schema.md §2`.
 */
export const buildingSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    return computed(() =>
        z.object({
            name: z
                .string()
                .trim()
                .min(MIN_NAME_LENGTH, translations.value.nameIsRequired || 'Name is required')
                .max(
                    MAX_NAME_LENGTH,
                    translations.value.nameIsTooLong || `Name must be at most ${MAX_NAME_LENGTH} characters`
                ),
            code: z
                .string()
                .trim()
                .max(
                    MAX_CAMPUS_CODE_LENGTH,
                    translations.value.codeIsTooLong || `Code must be at most ${MAX_CAMPUS_CODE_LENGTH} characters`
                )
                .transform((value) => value || null),
            campus_id: z
                .number({ message: translations.value.campusIsRequired || 'Please choose a campus' })
                .int()
                .positive(translations.value.campusIsRequired || 'Please choose a campus'),
            floors: z
                .string()
                .trim()
                .transform((value) => (value ? Number(value) : null))
                .refine(
                    (value) =>
                        value === null ||
                        (Number.isInteger(value) && value >= MIN_BUILDING_FLOORS && value <= MAX_BUILDING_FLOORS),
                    translations.value.invalidFloors ||
                        `Enter a whole number between ${MIN_BUILDING_FLOORS} and ${MAX_BUILDING_FLOORS}`
                ),
            is_active: z.boolean()
        })
    );
};
