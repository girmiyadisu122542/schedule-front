import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import {
    MIN_NAME_LENGTH,
    MAX_NAME_LENGTH,
    MAX_ROOM_CODE_LENGTH,
    MIN_PROGRAM_DURATION_YEARS,
    MAX_PROGRAM_DURATION_YEARS
} from '@/config/appConfig';

/**
 * Reactive Zod factory for the program form. Bounds come from appConfig only —
 * they mirror the column widths and the `duration_years` CHECK in
 * `Final Schema.md §5`.
 */
export const programSchema = () => {
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
                    MAX_ROOM_CODE_LENGTH,
                    translations.value.codeIsTooLong || `Code must be at most ${MAX_ROOM_CODE_LENGTH} characters`
                )
                .transform((value) => value || null),
            department_id: z
                .number({ message: translations.value.departmentIsRequired || 'Please choose a department' })
                .int()
                .positive(translations.value.departmentIsRequired || 'Please choose a department'),
            degree_level_lookup_value_id: z
                .number({ message: translations.value.degreeLevelIsRequired || 'Please choose a degree level' })
                .int()
                .positive(translations.value.degreeLevelIsRequired || 'Please choose a degree level'),
            duration_years: z
                .string()
                .trim()
                .min(1, translations.value.durationIsRequired || 'Duration is required')
                .transform((value) => Number(value))
                .refine(
                    (value) =>
                        Number.isInteger(value) &&
                        value >= MIN_PROGRAM_DURATION_YEARS &&
                        value <= MAX_PROGRAM_DURATION_YEARS,
                    translations.value.invalidDuration ||
                        `Duration must be between ${MIN_PROGRAM_DURATION_YEARS} and ${MAX_PROGRAM_DURATION_YEARS} years`
                ),
            is_active: z.boolean()
        })
    );
};
