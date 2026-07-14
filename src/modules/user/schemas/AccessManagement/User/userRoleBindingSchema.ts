import { z } from 'zod';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';

const languageStore = useLanguageStore();
const { translations } = storeToRefs(languageStore);
const frontLanguages = computed(() => translations.value) as any;

export const userRoleBindingSchema = computed(() =>
    z
        .object({
            role_id: z.number({
                message: frontLanguages.value?.userRoleBindingValidation?.roleIdRequired
            }),
            ends_at: z.string().nullable(),

            starts_at: z.string({
                message: frontLanguages.value?.userRoleBindingValidation?.startsAtRequired
            })
        })
        .superRefine((data, ctx) => {
            const { starts_at, ends_at } = data;

            const startsAtDate = new Date(starts_at);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (startsAtDate < today) {
                ctx.addIssue({
                    path: ['starts_at'],
                    code: 'custom',
                    message:
                        frontLanguages.value?.userRoleBindingValidation?.startsAtDate ||
                        'Start date must be today or in the future'
                });
            }

            if (!ends_at) return;
            const endsAtDate = new Date(ends_at);

            if (endsAtDate <= startsAtDate) {
                ctx.addIssue({
                    path: ['ends_at'],
                    code: 'custom',
                    message:
                        frontLanguages.value?.userRoleBindingValidation?.endsAtNotLessThanStartsAt ||
                        'End date must be greater than start date'
                });
            }
            if (endsAtDate <= today) {
                ctx.addIssue({
                    path: ['ends_at'],
                    code: 'custom',
                    message:
                        frontLanguages.value?.userRoleBindingValidation?.endsAtDate || 'End date must be in the future'
                });
            }
        })
);

export type UserRoleBinding = z.infer<typeof userRoleBindingSchema.value>;
export type UserRoleBindingFields = keyof UserRoleBinding;
