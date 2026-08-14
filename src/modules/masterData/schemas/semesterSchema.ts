import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MAX_NAME_LENGTH, MIN_SEMESTER_TERM, MAX_SEMESTER_TERM } from '@/config/appConfig';

/**
 * Reactive Zod factory for the semester form. Bounds mirror the CHECK
 * constraints in `Final Schema.md §7` (term 1..3, end after start).
 */
export const semesterSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    return computed(() =>
        z
            .object({
                academic_year_id: z
                    .number({ message: translations.value.academicYearIsRequired || 'Please choose an academic year' })
                    .int()
                    .positive(translations.value.academicYearIsRequired || 'Please choose an academic year'),
                term: z
                    .number({ message: translations.value.termIsRequired || 'Please choose a term' })
                    .int()
                    .min(MIN_SEMESTER_TERM, translations.value.invalidTerm || 'Term must be 1, 2 or 3')
                    .max(MAX_SEMESTER_TERM, translations.value.invalidTerm || 'Term must be 1, 2 or 3'),
                // Optional — the backend falls back to "2025/26 - Semester 2".
                name: z
                    .string()
                    .trim()
                    .max(
                        MAX_NAME_LENGTH,
                        translations.value.nameIsTooLong || `Name must be at most ${MAX_NAME_LENGTH} characters`
                    )
                    .transform((value) => value || null),
                start_date: z
                    .string()
                    .trim()
                    .min(1, translations.value.startDateIsRequired || 'Start date is required'),
                end_date: z
                    .string()
                    .trim()
                    .min(1, translations.value.endDateIsRequired || 'End date is required'),
                // The exam period is mandatory: the exam generator has to be
                // told when exams sit, and it is no longer inferred from the
                // end of term.
                exam_start_date: z
                    .string()
                    .trim()
                    .min(1, translations.value.examStartDateIsRequired || 'The exam start date is required'),
                exam_end_date: z
                    .string()
                    .trim()
                    .min(1, translations.value.examEndDateIsRequired || 'The exam end date is required'),
                is_current: z.boolean()
            })
            .refine((value) => value.end_date > value.start_date, {
                path: ['end_date'],
                message: translations.value.endDateMustBeAfterStartDate || 'The end date must fall after the start date'
            })
            .refine((value) => value.exam_end_date >= value.exam_start_date, {
                path: ['exam_end_date'],
                message: translations.value.examEndAfterExamStart || 'The exam period must end on or after it starts'
            })
            // An exam period outside its own term would schedule exams on dates
            // the semester does not cover — the database refuses it too.
            .refine((value) => value.exam_start_date >= value.start_date, {
                path: ['exam_start_date'],
                message: translations.value.examWithinTerm || 'The exam period must fall inside the semester'
            })
            .refine((value) => value.exam_end_date <= value.end_date, {
                path: ['exam_end_date'],
                message: translations.value.examWithinTerm || 'The exam period must fall inside the semester'
            })
    );
};
