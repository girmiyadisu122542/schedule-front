import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MAX_CAMPUS_CODE_LENGTH } from '@/config/appConfig';

/**
 * Reactive Zod factory for the academic year form.
 *
 * The `code` ("2025/26") is the label — an academic year has no name column.
 * The end-after-start rule is mirrored here and by a CHECK constraint in
 * `Final Schema.md §6`; the database is the authority, this is the fast feedback.
 */
export const academicYearSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    return computed(() =>
        z
            .object({
                code: z
                    .string()
                    .trim()
                    .min(1, translations.value.codeIsRequired || 'Academic year is required')
                    .max(
                        MAX_CAMPUS_CODE_LENGTH,
                        translations.value.codeIsTooLong ||
                            `Academic year must be at most ${MAX_CAMPUS_CODE_LENGTH} characters`
                    ),
                start_date: z
                    .string()
                    .trim()
                    .min(1, translations.value.startDateIsRequired || 'Start date is required'),
                end_date: z
                    .string()
                    .trim()
                    .min(1, translations.value.endDateIsRequired || 'End date is required'),
                is_current: z.boolean()
            })
            .refine((value) => value.end_date > value.start_date, {
                path: ['end_date'],
                message: translations.value.endDateMustBeAfterStartDate || 'The end date must fall after the start date'
            })
    );
};
