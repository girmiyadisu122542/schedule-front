import { z } from 'zod';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { ETHIOPIAN_PHONE_PATTERN, EXAMPLE_PHONE_NUMBER, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '@/config/appConfig';

const { translations } = storeToRefs(useLanguageStore()) as any;

const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u;
const nameInvalidMessage = () => translations.value?.nameInvalid || 'Name cannot contain numbers';

/**
 * The quick-add dialog's rules. It posts to the same endpoint as the full form,
 * so it has to enforce the same limits — `CreateUserRequest` rejects a one-letter
 * name and a non-Ethiopian phone whichever form they came from.
 */
const nameField = (requiredMessageKey: string, fallback: string) =>
    z
        .string()
        .min(1, { message: translations.value?.[requiredMessageKey] || fallback })
        .min(MIN_NAME_LENGTH, {
            message: translations.value?.nameTooShort || `Name must be at least ${MIN_NAME_LENGTH} characters`
        })
        .max(MAX_NAME_LENGTH, {
            message: translations.value?.nameTooLong || `Name cannot exceed ${MAX_NAME_LENGTH} characters`
        })
        .regex(NAME_PATTERN, { message: nameInvalidMessage() });

export const useUserSchema = computed(() =>
    z.object({
        first_name: nameField('firstNameRequired', 'First Name is required'),
        middle_name: nameField('middleNameRequired', 'Middle Name is required'),
        last_name: nameField('lastNameRequired', 'Last Name is required'),
        phone: z
            .string()
            .min(1, {
                message: translations.value?.phoneRequired || 'Phone number is required'
            })
            .regex(ETHIOPIAN_PHONE_PATTERN, {
                message:
                    translations.value?.phoneInvalid ||
                    `Enter an Ethiopian mobile number, for example ${EXAMPLE_PHONE_NUMBER}`
            }),
        gender: z.number().min(1, {
            message: translations.value?.genderRequired || 'Gender is required'
        }),
        email: z
            .string()
            .min(1, {
                message: translations.value?.emailRequired || 'Email is required'
            })
            .email({
                message: translations.value?.emailInvalid || 'Invalid email address'
            })
    })
);

export type userSchema = z.infer<typeof useUserSchema.value>;
export type userFormField = keyof userSchema;
