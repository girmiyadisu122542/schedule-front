import { z } from 'zod';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';

export const useLoginSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    return computed(() =>
        z.object({
            username: z
                .string({
                    message: `${translations.value.username} ${translations.value.isRequired}`
                })
                .min(1, {
                    message: `${translations.value.username} ${translations.value.isRequired}`
                }),

            password: z
                .string({
                    message: `${translations.value.password} ${translations.value.isRequired}`
                })
                .min(6, {
                    message: `${translations.value.password} ${translations.value.minLength}`
                }),

            remember: z.boolean().default(false)
        })
    );
};
