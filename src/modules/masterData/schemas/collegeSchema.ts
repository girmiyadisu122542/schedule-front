import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MIN_NAME_LENGTH, MAX_NAME_LENGTH, MIN_CODE_LENGTH, MAX_CODE_LENGTH } from '@/config/appConfig';

/** Lowest / highest plausible founding year for a college. */
const MIN_ESTABLISHED_YEAR = 1800;
const MAX_ESTABLISHED_YEAR = new Date().getFullYear();

export const collegeSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    return computed(() =>
        z.object({
            name: z
                .string()
                .trim()
                .min(MIN_NAME_LENGTH, translations.value.nameIsRequired || 'Name is required')
                .max(MAX_NAME_LENGTH, translations.value.nameIsTooLong || `Name must be at most ${MAX_NAME_LENGTH} characters`),
            code: z
                .string()
                .trim()
                .min(MIN_CODE_LENGTH, translations.value.codeIsRequired || 'Code is required')
                .max(MAX_CODE_LENGTH, translations.value.codeIsTooLong || `Code must be at most ${MAX_CODE_LENGTH} characters`),
            description: z
                .string()
                .nullable()
                .transform((value) => value?.trim() || null),
            dean_name: z
                .string()
                .nullable()
                .transform((value) => value?.trim() || null),
            email: z
                .string()
                .trim()
                .email(translations.value.invalidEmail || 'Enter a valid email')
                .or(z.literal(''))
                .transform((value) => value || null),
            phone: z
                .string()
                .nullable()
                .transform((value) => value?.trim() || null),
            established_year: z
                .string()
                .trim()
                .or(z.literal(''))
                .transform((value) => (value ? Number(value) : null))
                .refine(
                    (value) =>
                        value === null ||
                        (Number.isInteger(value) && value >= MIN_ESTABLISHED_YEAR && value <= MAX_ESTABLISHED_YEAR),
                    translations.value.invalidYear || `Enter a valid year between ${MIN_ESTABLISHED_YEAR} and ${MAX_ESTABLISHED_YEAR}`
                )
        })
    );
};
