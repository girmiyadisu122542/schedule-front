import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MAX_DESCRIPTION_LENGTH, MAX_EXAM_INVIGILATORS } from '@/config/appConfig';

/**
 * Reactive Zod factory for the invigilator-request form.
 *
 * The shape that matters: `departments` is a LIST of department + quantity,
 * not one quantity applied to many departments. Asking Computer Science for
 * ten and Accounting for four is one request carrying two numbers, and a
 * single field could not express it.
 *
 * The status is absent — a request is created at `draft` and moves only
 * through send / close, both guarded server-side by `lookup_transitions`.
 */
export const invigilationRequestSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    const requiredId = (message: string) => z.number({ message }).int().positive(message);

    return computed(() =>
        z
            .object({
                semester_id: requiredId(translations.value.semesterIsRequired || 'Please choose a semester'),
                exam_type_lookup_value_id: requiredId(
                    translations.value.examTypeIsRequired || 'Please choose an exam type'
                ),
                remark: z.string().trim().max(MAX_DESCRIPTION_LENGTH),
                departments: z
                    .array(
                        z.object({
                            department_id: requiredId(
                                translations.value.departmentIsRequired || 'Please choose a department'
                            ),
                            // A text input hands back a string; the payload needs a number.
                            required_count: z
                                .string()
                                .trim()
                                .refine((value) => value !== '' && Number.isInteger(Number(value)), {
                                    message:
                                        translations.value.invalidRequiredCount ||
                                        'Enter how many invigilators this department should send'
                                })
                                .transform((value) => Number(value))
                                .refine((value) => value >= 1 && value <= MAX_EXAM_INVIGILATORS, {
                                    message:
                                        translations.value.invalidRequiredCount ||
                                        `Ask for between 1 and ${MAX_EXAM_INVIGILATORS} invigilators`
                                })
                        })
                    )
                    .min(1, translations.value.atLeastOneDepartment || 'Add at least one department')
                    // Asking the same department twice in one request is a mistake,
                    // not a second ask — the unique index says so too.
                    .refine(
                        (rows) => new Set(rows.map((row) => row.department_id)).size === rows.length,
                        translations.value.duplicateDepartment || 'Each department can only be added once'
                    )
            })
            // The payload shape: an empty remark is absent, not an empty string.
            .transform((value) => ({
                semester_id: value.semester_id,
                exam_type_lookup_value_id: value.exam_type_lookup_value_id,
                remark: value.remark || null,
                departments: value.departments
            }))
    );
};
