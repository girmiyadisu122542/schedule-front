import { API_URL } from '@/constants';

export function resolveMediaUrl(value?: string | null): string {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;

    const appUrl = API_URL.replace(/\/api\/?$/, '');
    const normalized = String(value).replace(/^\/+/, '');

    return `${appUrl}/storage/${normalized}`;
}
