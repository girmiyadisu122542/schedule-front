import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import {
    MAX_LONG_NAME_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    MAX_ROOM_CODE_LENGTH,
    MAX_COURSE_HOURS,
    MAX_SESSIONS_PER_WEEK
} from '@/config/appConfig';

/**
 * Reactive Zod factory for the course form. Bounds mirror the column widths and
 * CHECK constraints in `Final Schema.md §10`. The "sessions need weekly hours"
 * rule is mirrored from the backend service so the user sees it without a round
 * trip — the backend still re-checks it.
 */
export const courseSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    const optionalHours = (message: string) =>
        z
            .string()
            .trim()
            .transform((value) => (value ? Number(value) : null))
            .refine(
                (value) => value === null || (Number.isFinite(value) && value >= 0 && value <= MAX_COURSE_HOURS),
                message
            );

    return computed(() =>
        z
            .object({
                title: z
                    .string()
                    .trim()
                    .min(1, translations.value.titleIsRequired || 'Course title is required')
                    .max(
                        MAX_LONG_NAME_LENGTH,
                        translations.value.titleIsTooLong || `Title must be at most ${MAX_LONG_NAME_LENGTH} characters`
                    ),
                code: z
                    .string()
                    .trim()
                    .min(1, translations.value.codeIsRequired || 'Course code is required')
                    .max(
                        MAX_ROOM_CODE_LENGTH,
                        translations.value.codeIsTooLong || `Code must be at most ${MAX_ROOM_CODE_LENGTH} characters`
                    ),
                description: z
                    .string()
                    .trim()
                    .max(
                        MAX_DESCRIPTION_LENGTH,
                        translations.value.descriptionIsTooLong || 'The description is too long'
                    )
                    .transform((value) => value || null),
                department_id: z
                    .number({ message: translations.value.departmentIsRequired || 'Please choose a department' })
                    .int()
                    .positive(translations.value.departmentIsRequired || 'Please choose a department'),
                course_type_lookup_value_id: z
                    .number({ message: translations.value.courseTypeIsRequired || 'Please choose a course type' })
                    .int()
                    .positive(translations.value.courseTypeIsRequired || 'Please choose a course type'),
                credit_hours: z
                    .string()
                    .trim()
                    .min(1, translations.value.creditHoursIsRequired || 'Credit hours are required')
                    .transform((value) => Number(value))
                    .refine(
                        (value) => Number.isFinite(value) && value > 0 && value <= MAX_COURSE_HOURS,
                        translations.value.invalidCreditHours || 'Credit hours must be greater than zero'
                    ),
                contact_hours: optionalHours(
                    translations.value.invalidContactHours || 'Contact hours must be greater than zero'
                ),
                lecture_hours_per_week: optionalHours(
                    translations.value.invalidWeeklyHours || 'Enter a plausible number of hours'
                ),
                lab_hours_per_week: optionalHours(
                    translations.value.invalidWeeklyHours || 'Enter a plausible number of hours'
                ),
                tutorial_hours_per_week: optionalHours(
                    translations.value.invalidWeeklyHours || 'Enter a plausible number of hours'
                ),
                sessions_per_week: z
                    .string()
                    .trim()
                    .transform((value) => (value ? Number(value) : null))
                    .refine(
                        (value) =>
                            value === null || (Number.isInteger(value) && value > 0 && value <= MAX_SESSIONS_PER_WEEK),
                        translations.value.invalidSessionsPerWeek || 'Enter a plausible number of weekly sessions'
                    ),
                is_active: z.boolean()
            })
            .refine(
                (value) =>
                    !value.sessions_per_week ||
                    (value.lecture_hours_per_week ?? 0) +
                        (value.lab_hours_per_week ?? 0) +
                        (value.tutorial_hours_per_week ?? 0) >
                        0,
                {
                    path: ['sessions_per_week'],
                    message:
                        translations.value.sessionsNeedWeeklyHours ||
                        'Enter the weekly lecture, lab or tutorial hours before setting sessions per week'
                }
            )
    );
};
