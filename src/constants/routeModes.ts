import { storeToRefs } from 'pinia';
import { useLanguageStore } from '@/stores/languageStore';

const { translations } = storeToRefs(useLanguageStore());

export const ROUTE_MODES = {
    CREATE: translations.value.create || 'Create',
    EDIT: translations.value.edit || 'Edit',
    VIEW: translations.value.view || 'View',
} as const;

export type RouteMode = typeof ROUTE_MODES[keyof typeof ROUTE_MODES];