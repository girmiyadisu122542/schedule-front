import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MONDAY, SUNDAY } from '@/modules/scheduling/constants/classScheduleStatus';

/** "HH:MM", the only time shape the backend's `date_format:H:i` rule accepts. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Reactive Zod factory for the class-session form.
 *
 * `semester_id` / `section_id` are absent: the backend mirrors them off the
 * offering. So is the status — a session is created at `draft` and moves only
 * through publish / cancel, both guarded server-side by `lookup_transitions`.
 *
 * Clash checking is NOT mirrored here. Three PostgreSQL EXCLUDE constraints own
 * that, and a second definition in TypeScript would only drift from them.
 */
export const classScheduleSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    const requiredId = (message: string) => z.number({ message }).int().positive(message);

    const time = (message: string) => z.string().trim().regex(TIME_PATTERN, message);

    return computed(() =>
        z
            .object({
                course_offering_id: requiredId(
                    translations.value.offeringIsRequired || 'Please choose a course offering'
                ),
                instructor_id: z.number().int().positive().nullable(),
                room_id: z.number().int().positive().nullable(),
                session_type_lookup_value_id: z.number().int().positive().nullable(),
                day_of_week: z
                    .number({ message: translations.value.dayIsRequired || 'Please choose a day' })
                    .int()
                    .min(MONDAY, translations.value.dayIsRequired || 'Please choose a day')
                    .max(SUNDAY, translations.value.dayIsRequired || 'Please choose a day'),
                start_time: time(translations.value.invalidTime || 'Enter the time as HH:MM'),
                end_time: time(translations.value.invalidTime || 'Enter the time as HH:MM')
            })
            .refine((value) => value.end_time > value.start_time, {
                path: ['end_time'],
                message: translations.value.endTimeAfterStart || 'The end time must be after the start time'
            })
    );
};
