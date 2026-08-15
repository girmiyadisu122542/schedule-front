import { z } from 'zod';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import {
    ETHIOPIAN_PHONE_PATTERN,
    EXAMPLE_PHONE_NUMBER,
    MAX_NAME_LENGTH,
    MIN_NAME_LENGTH,
    NATIONAL_ID_LENGTH
} from '@/config/appConfig';

const { translations } = storeToRefs(useLanguageStore()) as any;

const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u;
const nameInvalidMessage = () => translations.value?.nameInvalid || 'Name cannot contain numbers';

/**
 * Every rule here mirrors `CreateUserRequest` on the backend. A rule that is
 * stricter than the backend blocks a submission the API would have accepted —
 * which is what made the Create button look dead when a user had no national ID
 * — and a rule that is looser lets the request through to fail server-side.
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

export const useUserRegistrationSchema = computed(() =>
    z.object({
        first_name: nameField('firstNameRequired', 'First Name is required'),

        middle_name: nameField('middleNameRequired', 'Middle Name is required'),

        last_name: nameField('lastNameRequired', 'Last Name is required'),
        phone: z
            .string()
            .min(1, {
                message: translations.value?.phoneRequired || 'Phone number is required'
            })
            // Checked here as well as on the server so the message lands on the
            // field. The backend accepts Ethiopian mobile numbers only, in any
            // of the three spellings this pattern allows.
            .regex(ETHIOPIAN_PHONE_PATTERN, {
                message:
                    translations.value?.phoneInvalid ||
                    `Enter an Ethiopian mobile number, for example ${EXAMPLE_PHONE_NUMBER}`
            }),
        email: z
            .string()
            .min(1, {
                message: translations.value?.emailRequired || 'Email is required'
            })
            .email({
                message: translations.value?.emailInvalid || 'Invalid email address'
            }),
        gender: z.number().min(1, {
            message: translations.value?.genderRequired || 'Gender is required'
        }),
        birth_date: z.string().optional().nullable(),
        // Optional, matching NATIONAL_ID_IS_GLOBALLY_MANDATORY = false on the
        // backend. The length rule applies only once something is typed, so an
        // empty field is a valid submission rather than a silent block.
        national_id: z
            .string()
            .regex(new RegExp(`^\\d{${NATIONAL_ID_LENGTH}}$`), {
                message:
                    translations.value?.nationalIdLength || `National ID must be exactly ${NATIONAL_ID_LENGTH} digits`
            })
            .or(z.literal(''))
            .optional()
            .nullable(),
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
