import { storeToRefs } from 'pinia';
import { useLanguageStore } from '@/stores/languageStore';

const { translations } = storeToRefs(useLanguageStore()) as any;
export const HTTP_METHODS = [
    { label: translations.value.get, value: 'GET' },
    { label: translations.value.post, value: 'POST' },
    { label: translations.value.put, value: 'PUT' },
    { label: translations.value.deleteP, value: 'DELETE' },
    { label: translations.value.patch, value: 'PATCH' },
    { label: translations.value.head, value: 'HEAD' },
    { label: translations.value.options, value: 'OPTIONS' }
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number]['value'];
