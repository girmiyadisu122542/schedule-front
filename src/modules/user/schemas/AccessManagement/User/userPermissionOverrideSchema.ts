import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLanguageStore } from '@/stores/languageStore';

const languageStore = useLanguageStore();
const { translations } = storeToRefs(languageStore);
const frontLanguages = computed(() => translations.value) as any;

export const userPermissionOverrideSchema = computed(() =>
    z
        .object({
            permission_ids: z
                .array(z.number(), {
                    message: frontLanguages.value?.userPermissionOverrideValidation?.permissionsRequired
                })
                .min(1, {
                    message: frontLanguages.value?.userPermissionOverrideValidation?.permissionsRequired
                }),
            allow: z.boolean({
                message: frontLanguages.value?.userPermissionOverrideValidation?.allowRequired
            }),
            ends_at: z.string().nullable(),

            starts_at: z.string({
                message: frontLanguages.value?.userPermissionOverrideValidation?.startsAtRequired
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
                        frontLanguages.value?.userPermissionOverrideValidation?.startsAtDate ||
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
                        frontLanguages.value?.userPermissionOverrideValidation?.endsAtNotLessThanStartsAt ||
                        'End date must be greater than start date'
                });
            }
            if (endsAtDate <= today) {
                ctx.addIssue({
                    path: ['ends_at'],
                    code: 'custom',
                    message:
                        frontLanguages.value?.userPermissionOverrideValidation?.endsAtDate ||
                        'End date must be in the future'
                });
            }
        })
);

export type UserPermissionOverride = z.infer<typeof userPermissionOverrideSchema.value>;
export type UserPermissionOverrideFields = keyof UserPermissionOverride;
