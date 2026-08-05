import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MAX_EXAM_INVIGILATORS } from '@/config/appConfig';

/** "HH:MM", the only time shape the backend's `date_format:H:i` rule accepts. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
/** "YYYY-MM-DD", matching the backend's DATE_FORMAT rule. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reactive Zod factory for the exam-sitting form.
 *
 * As with class meetings, clash checking is NOT mirrored here — two PostgreSQL
 * EXCLUDE constraints own it, and a second definition in TypeScript would only
 * drift from them.
 */
export const examScheduleSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    const requiredId = (message: string) => z.number({ message }).int().positive(message);

    const time = (message: string) => z.string().trim().regex(TIME_PATTERN, message);

    return computed(() =>
        z
            .object({
                course_offering_id: requiredId(
                    translations.value.offeringIsRequired || 'Please choose a course offering'
                ),
                exam_type_lookup_value_id: requiredId(
                    translations.value.examTypeIsRequired || 'Please choose an exam type'
                ),
                room_id: z.number().int().positive().nullable(),
                exam_date: z
                    .string()
                    .trim()
                    .regex(DATE_PATTERN, translations.value.invalidDate || 'Enter the date as YYYY-MM-DD'),
                start_time: time(translations.value.invalidTime || 'Enter the time as HH:MM'),
                end_time: time(translations.value.invalidTime || 'Enter the time as HH:MM'),
                required_invigilators: z
                    .string()
                    .trim()
                    .transform((value) => (value ? Number(value) : 1))
                    .refine(
                        (value) => Number.isInteger(value) && value >= 1 && value <= MAX_EXAM_INVIGILATORS,
                        translations.value.invalidInvigilatorCount || 'Enter a plausible number of invigilators'
                    )
            })
            .refine((value) => value.end_time > value.start_time, {
                path: ['end_time'],
                message: translations.value.endTimeAfterStart || 'The end time must be after the start time'
            })
    );
};
