import { computed } from 'vue';
import { z } from 'zod';
import { storeToRefs } from 'pinia';
import { useLanguageStore } from '@/stores/languageStore';

export type UserProfileFields = {
    bio?: string;
    photo?: File | string | null;
    cover_photo?: File | string | null;
};

export const useUserProfileSchema = computed(() => {
    const { translations } = storeToRefs(useLanguageStore());
    const t = translations.value as Record<string, string>;

    return z.object({
        bio: z.string().optional(),
        photo: z.any().optional().nullable(),
        cover_photo: z.any().optional().nullable(),
    });
});
