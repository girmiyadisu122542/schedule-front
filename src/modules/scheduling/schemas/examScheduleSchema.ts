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
 * As with class sessions, clash checking is NOT mirrored here — two PostgreSQL
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
                    ),
                // ---- accommodations (C21) ----
                // Free text on purpose: the arrangements vary too much to
                // enumerate, and a wrong dropdown is worse than a sentence.
                // Empty string, not undefined: the form always sends the field,
                // and `.optional()` would make the input type disagree with the
                // form model it is validating.
                accommodation_note: z
                    .string()
                    .trim()
                    .max(1000, translations.value.tooLong || 'That is too long'),
                accommodation_extra_minutes: z
                    .string()
                    .trim()
                    .transform((value) => (value ? Number(value) : null))
                    .refine(
                        (value) => value === null || (Number.isInteger(value) && value >= 1 && value <= 240),
                        translations.value.invalidExtraTime || 'Extra time must be between 1 and 240 minutes'
                    ),
                accommodation_room_id: z.number().int().positive().nullable()
            })
            .refine((value) => value.end_time > value.start_time, {
                path: ['end_time'],
                message: translations.value.endTimeAfterStart || 'The end time must be after the start time'
            })
            // An empty note is the absence of an accommodation, not an
            // accommodation with a blank description — the difference decides
            // whether "has an accommodation" can be queried at all.
            .transform((value) => ({
                ...value,
                accommodation_note: value.accommodation_note || null
            }))
    );
};
