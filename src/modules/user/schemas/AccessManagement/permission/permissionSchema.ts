import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLanguageStore } from '@/stores/languageStore';

export const permissionGroupSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());
    return computed(() =>
        z.object({
            name: z.string().min(1, translations.value.nameIsRequired),
            permission_group_id: z.number().nullable().optional(),
            is_group: z.boolean().optional()
        })
    );
};

export const permissionSchema = (isEditing = false) => {
    const { translations } = storeToRefs(useLanguageStore());
    return computed(() =>
        z.object({
            name: z.string().min(1, translations.value.nameIsRequired || 'Name is required'),
            key: isEditing
                ? z.string().optional()
                : z.string().min(1, translations.value.keyIsRequired || 'Key is required'),
            module_id: z.number({ message: translations.value.moduleIsRequired || 'Module is required' }).min(1).nullable().optional(),
            permission_group_id: z.number({ message: translations.value.permissionGroupIsRequired || 'Permission group is required' }).min(1),
            unique_per_user: z.boolean(),
        })
    );
};
