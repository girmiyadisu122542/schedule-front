import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import {
    MAX_SECTION_LABEL_LENGTH,
    MIN_SECTION_YEAR_LEVEL,
    MAX_SECTION_YEAR_LEVEL,
    MAX_SECTION_EXPECTED_STUDENTS
} from '@/config/appConfig';

/**
 * Reactive Zod factory for the section form. Bounds mirror the CHECK
 * constraints and column widths in `Final Schema.md §8`.
 */
export const sectionSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    return computed(() =>
        z.object({
            program_id: z
                .number({ message: translations.value.programIsRequired || 'Please choose a program' })
                .int()
                .positive(translations.value.programIsRequired || 'Please choose a program'),
            academic_year_id: z
                .number({ message: translations.value.academicYearIsRequired || 'Please choose an academic year' })
                .int()
                .positive(translations.value.academicYearIsRequired || 'Please choose an academic year'),
            year_level: z
                .string()
                .trim()
                .min(1, translations.value.yearLevelIsRequired || 'Year level is required')
                .transform((value) => Number(value))
                .refine(
                    (value) =>
                        Number.isInteger(value) && value >= MIN_SECTION_YEAR_LEVEL && value <= MAX_SECTION_YEAR_LEVEL,
                    translations.value.invalidYearLevel ||
                        `Year level must be between ${MIN_SECTION_YEAR_LEVEL} and ${MAX_SECTION_YEAR_LEVEL}`
                ),
            label: z
                .string()
                .trim()
                .min(1, translations.value.labelIsRequired || 'Section label is required')
                .max(
                    MAX_SECTION_LABEL_LENGTH,
                    translations.value.labelIsTooLong || `Label must be at most ${MAX_SECTION_LABEL_LENGTH} characters`
                ),
            expected_students: z
                .string()
                .trim()
                .transform((value) => (value ? Number(value) : 0))
                .refine(
                    (value) => Number.isInteger(value) && value >= 0 && value <= MAX_SECTION_EXPECTED_STUDENTS,
                    translations.value.invalidExpectedStudents || 'Enter a plausible number of students'
                ),
            is_active: z.boolean()
        })
    );
};
