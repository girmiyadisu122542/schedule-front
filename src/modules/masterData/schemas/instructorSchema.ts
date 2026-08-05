import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import {
    MAX_LONG_NAME_LENGTH,
    MAX_CODE_LENGTH,
    MAX_INSTRUCTOR_EMAIL_LENGTH,
    MAX_PHONE_LENGTH,
    MAX_ACADEMIC_RANK_LENGTH,
    MAX_INSTRUCTOR_WEEKLY_HOURS
} from '@/config/appConfig';

/**
 * Reactive Zod factory for the instructor form. Bounds mirror the column widths
 * in `Final Schema.md §11`. The "needs at least one capability" rule is mirrored
 * from the backend service — an instructor who can neither teach nor invigilate
 * has no role in the system.
 */
export const instructorSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    return computed(() =>
        z
            .object({
                full_name: z
                    .string()
                    .trim()
                    .min(1, translations.value.nameIsRequired || 'Name is required')
                    .max(
                        MAX_LONG_NAME_LENGTH,
                        translations.value.nameIsTooLong || `Name must be at most ${MAX_LONG_NAME_LENGTH} characters`
                    ),
                employee_no: z
                    .string()
                    .trim()
                    .min(1, translations.value.employeeNoIsRequired || 'Employee number is required')
                    .max(
                        MAX_CODE_LENGTH,
                        translations.value.employeeNoIsTooLong ||
                            `Employee number must be at most ${MAX_CODE_LENGTH} characters`
                    ),
                email: z
                    .string()
                    .trim()
                    .max(MAX_INSTRUCTOR_EMAIL_LENGTH, translations.value.emailIsTooLong || 'The email is too long')
                    .refine(
                        (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                        translations.value.invalidEmail || 'Enter a valid email address'
                    )
                    .transform((value) => value || null),
                phone: z
                    .string()
                    .trim()
                    .max(MAX_PHONE_LENGTH, translations.value.phoneIsTooLong || 'The phone number is too long')
                    .transform((value) => value || null),
                department_id: z
                    .number({ message: translations.value.departmentIsRequired || 'Please choose a department' })
                    .int()
                    .positive(translations.value.departmentIsRequired || 'Please choose a department'),
                academic_rank: z
                    .string()
                    .trim()
                    .max(MAX_ACADEMIC_RANK_LENGTH, translations.value.rankIsTooLong || 'The rank is too long')
                    .transform((value) => value || null),
                // The optional portal account — the person, not a creator.
                user_id: z.number().int().positive().nullable(),
                can_teach: z.boolean(),
                can_invigilate: z.boolean(),
                max_weekly_hours: z
                    .string()
                    .trim()
                    .transform((value) => (value ? Number(value) : null))
                    .refine(
                        (value) =>
                            value === null ||
                            (Number.isFinite(value) && value > 0 && value <= MAX_INSTRUCTOR_WEEKLY_HOURS),
                        translations.value.invalidWeeklyHourCeiling || 'Enter a plausible weekly hour ceiling'
                    ),
                is_active: z.boolean()
            })
            .refine((value) => value.can_teach || value.can_invigilate, {
                path: ['can_teach'],
                message:
                    translations.value.instructorNeedsCapability ||
                    'An instructor must be able to teach, invigilate, or both'
            })
    );
};
