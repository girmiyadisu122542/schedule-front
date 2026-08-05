import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MIN_NAME_LENGTH, MAX_NAME_LENGTH, MAX_CAMPUS_CODE_LENGTH } from '@/config/appConfig';

/**
 * Reactive Zod factory for the department form. Bounds come from appConfig only —
 * they mirror the backend column widths in `Final Schema.md §4`.
 */
export const departmentSchema = () => {
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
            college_id: z
                .number({ message: translations.value.collegeIsRequired || 'Please choose a college' })
                .int()
                .positive(translations.value.collegeIsRequired || 'Please choose a college'),
            // Routing pointer for the department-approval step — optional.
            head_user_id: z.number().int().positive().nullable(),
            is_active: z.boolean()
        })
    );
};
