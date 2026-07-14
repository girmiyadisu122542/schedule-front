import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLanguageStore } from '@/stores/languageStore';

export const roleSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    return computed(() =>
        z.object({
            name: z.string().min(1, translations.value.nameIsRequired || 'Name is required'),
            description: z
                .string()
                .nullable()
                .transform((value) => value || null),
            is_system: z.boolean(),
            unique_per_user: z.boolean(),
        })
    );
};
