import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MAX_DESCRIPTION_LENGTH } from '@/config/appConfig';

/** "HH:MM", the only time shape the backend's `date_format:H:i` rule accepts. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
/** "YYYY-MM-DD", matching the backend's DATE_FORMAT rule. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reactive Zod factory for the availability form.
 *
 * Overlap checking is NOT mirrored here — `ia_no_overlap` owns it, and it is the
 * one EXCLUDE constraint with no liveness predicate, so every stored window
 * participates. A second definition in TypeScript could only drift from it.
 */
export const availabilitySchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    const requiredId = (message: string) => z.number({ message }).int().positive(message);

    const time = (message: string) => z.string().trim().regex(TIME_PATTERN, message);

    return computed(() =>
        z
            .object({
                instructor_id: requiredId(translations.value.instructorIsRequired || 'Please choose an instructor'),
                semester_id: requiredId(translations.value.semesterIsRequired || 'Please choose a semester'),
                available_date: z
                    .string()
                    .trim()
                    .regex(DATE_PATTERN, translations.value.invalidDate || 'Enter the date as YYYY-MM-DD'),
                start_time: time(translations.value.invalidTime || 'Enter the time as HH:MM'),
                end_time: time(translations.value.invalidTime || 'Enter the time as HH:MM'),
                remark: z
                    .string()
                    .trim()
                    .max(MAX_DESCRIPTION_LENGTH, translations.value.remarkIsTooLong || 'The remark is too long')
                    .transform((value) => value || null)
            })
            .refine((value) => value.end_time > value.start_time, {
                path: ['end_time'],
                message: translations.value.endTimeAfterStart || 'The end time must be after the start time'
            })
    );
};
