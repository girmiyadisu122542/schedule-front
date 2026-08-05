import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MAX_SECTION_EXPECTED_STUDENTS, MAX_DESCRIPTION_LENGTH } from '@/config/appConfig';

/**
 * Reactive Zod factory for the offering form.
 *
 * `status` is deliberately absent: an offering is created at `draft` and moves
 * only through submit / the approval trail, both guarded server-side by
 * `lookup_transitions`.
 */
export const offeringSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    const requiredId = (message: string) => z.number({ message }).int().positive(message);

    return computed(() =>
        z
            .object({
                semester_id: requiredId(translations.value.semesterIsRequired || 'Please choose a semester'),
                course_id: requiredId(translations.value.courseIsRequired || 'Please choose a course'),
                department_id: requiredId(
                    translations.value.departmentIsRequired || 'Please choose the offering department'
                ),
                program_id: z.number().int().positive().nullable(),
                section_id: z.number().int().positive().nullable(),
                instructor_id: z.number().int().positive().nullable(),
                expected_students: z
                    .string()
                    .trim()
                    .transform((value) => (value ? Number(value) : 0))
                    .refine(
                        (value) => Number.isInteger(value) && value >= 0 && value <= MAX_SECTION_EXPECTED_STUDENTS,
                        translations.value.invalidExpectedStudents || 'Enter a plausible number of students'
                    ),
                remark: z
                    .string()
                    .trim()
                    .max(MAX_DESCRIPTION_LENGTH, translations.value.remarkIsTooLong || 'The remark is too long')
                    .transform((value) => value || null)
            })
            // Mirrors the backend submit guard: an offering that names no cohort
            // is not something an approval tier can act on.
            .refine((value) => value.section_id !== null || value.program_id !== null, {
                path: ['section_id'],
                message:
                    translations.value.offeringNeedsCohort ||
                    'Choose a section or a program — the offering must name a cohort'
            })
    );
};
