/**
 * Shared formatting helpers used across modules (dashboards, tables, detail views).
 * Kept module-agnostic so any feature can render money/dates consistently.
 */

export const DEFAULT_CURRENCY = 'ETB';
export const AMOUNT_PRECISION = 2;

/** Format a monetary amount with a currency code prefix, e.g. "ETB 12,500.00". */
export function formatMoney(amount: number, currency: string = DEFAULT_CURRENCY): string {
    const safe = Number.isFinite(amount) ? amount : 0;
    const formatted = safe.toLocaleString('en-US', {
        minimumFractionDigits: AMOUNT_PRECISION,
        maximumFractionDigits: AMOUNT_PRECISION
    });
    return `${currency} ${formatted}`;
}

/** Short, locale-stable date label (e.g. "09 Jun 2026"). */
export function formatShortDate(value: string | null | undefined): string {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
