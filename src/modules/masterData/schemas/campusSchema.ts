import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import {
    MIN_NAME_LENGTH,
    MAX_NAME_LENGTH,
    MAX_CAMPUS_CODE_LENGTH,
    MAX_CITY_LENGTH,
    MAX_ADDRESS_LENGTH
} from '@/config/appConfig';

/**
 * Reactive Zod factory for the campus form. Bounds come from appConfig only —
 * they mirror the backend column widths in `Final Schema.md §1`.
 */
export const campusSchema = () => {
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
            address: z
                .string()
                .trim()
                .max(
                    MAX_ADDRESS_LENGTH,
                    translations.value.addressIsTooLong || `Address must be at most ${MAX_ADDRESS_LENGTH} characters`
                )
                .transform((value) => value || null),
            city: z
                .string()
                .trim()
                .max(
                    MAX_CITY_LENGTH,
                    translations.value.cityIsTooLong || `City must be at most ${MAX_CITY_LENGTH} characters`
                )
                .transform((value) => value || null),
            is_main: z.boolean(),
            is_active: z.boolean()
        })
    );
};
