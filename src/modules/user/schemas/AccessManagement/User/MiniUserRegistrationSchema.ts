import { z } from 'zod';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';

const { translations } = storeToRefs(useLanguageStore()) as any;

const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u;
const nameInvalidMessage = () =>
    translations.value?.userFormValidationErrors?.nameInvalid || 'Name cannot contain numbers';

export const useUserSchema = computed(() =>
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
        gender: z.number().min(1, {
            message: translations.value?.userFormValidationErrors?.genderRequired || 'Gender is required'
        }),
        email: z
            .string()
            .min(5, {
                message: translations.value?.userFormValidationErrors?.emailRequired || 'Email is required'
            })
            .email({
                message: translations.value?.userFormValidationErrors?.emailInvalid || 'Invalid email address'
            })
    })
);

export type userSchema = z.infer<typeof useUserSchema.value>;
export type userFormField = keyof userSchema;
