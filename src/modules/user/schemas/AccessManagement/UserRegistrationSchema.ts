import { z } from 'zod';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';

const { translations } = storeToRefs(useLanguageStore()) as any;

const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u;
const nameInvalidMessage = () =>
    translations.value?.userFormValidationErrors?.nameInvalid || 'Name cannot contain numbers';

export const useUserRegistrationSchema = computed(() =>
    z.object({
        first_name: z
            .string()
            .min(1, {
                message: translations.value?.userFormValidationErrors?.firstNameRequired || 'First Name is required'
            })
            .regex(NAME_PATTERN, { message: nameInvalidMessage() }),

        middle_name: z
            .string()
            .min(1, {
                message: translations.value?.userFormValidationErrors?.middleNameRequired || 'Middle Name is required'
            })
            .regex(NAME_PATTERN, { message: nameInvalidMessage() }),

        last_name: z
            .string()
            .min(1, {
                message: translations.value?.userFormValidationErrors?.lastNameRequired || 'Last Name is required'
            })
            .regex(NAME_PATTERN, { message: nameInvalidMessage() }),
        phone: z.string().min(1, {
            message: translations.value?.userFormValidationErrors?.phoneRequired || 'Phone number is required'
        }),
        email: z
            .string()
            .min(1, {
                message: translations.value?.userFormValidationErrors?.emailRequired || 'Email is required'
            })
            .email({
                message: translations.value?.userFormValidationErrors?.emailInvalid || 'Invalid email address'
            }),
        gender: z.number().min(1, {
            message: translations.value?.userFormValidationErrors?.genderRequired || 'Gender is required'
        }),
        birth_date: z.string().optional().nullable(),
        national_id: z
            .string()
            .min(1, {
                message: translations.value?.userFormValidationErrors?.nationalIdRequired || 'National ID is required'
            })
            .regex(/^\d{16}$/, {
                message:
                    translations.value?.userFormValidationErrors?.nationalIdLength ||
                    'National ID must be exactly 16 digits'
            }),
        state: z.number().nullable().optional(),
        mfa_enabled: z.boolean().default(false),
        photo: z
            .union([z.instanceof(File), z.string().min(0).nullable()])
            .optional()
            .nullable(),
        bio: z.string().optional()
    })
);

export type UserRegistrationSchema = z.infer<typeof useUserRegistrationSchema.value>;
export type UserRegistrationFields = keyof UserRegistrationSchema;
