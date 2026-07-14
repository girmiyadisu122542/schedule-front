import { MILLISECONDS_PER_DAY } from '@/modules/user/constants/fixedValues';
import { useLanguageStore } from '@/stores/languageStore';

const { currentLanguage, customizeLanguageData } = useLanguageStore();

type DateFormatOptions = {
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    weekday?: 'long' | 'short' | 'narrow';
    timeZone?: string;
};

export const formatDate = (
    dateString: string | Date | null | undefined,
    options?: DateFormatOptions,
    locale?: string
): string => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';

    const usedLocale = locale || currentLanguage || 'en';

    const defaultOptions: DateFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    return date.toLocaleString(usedLocale, options || defaultOptions);
};
export const timeAgo = (date: string, locale?: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const intervals: { [key: string]: number } = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };

    for (const interval in intervals) {
        const intervalValue = intervals[interval];
        if (intervalValue === undefined) continue;
        const value = Math.floor(diffInSeconds / intervalValue);
        if (value >= 1) {
            const rtf = new Intl.RelativeTimeFormat(locale || currentLanguage || 'en', {
                numeric: 'auto'
            });
            return rtf.format(-value, interval as Intl.RelativeTimeFormatUnit);
        }
    }
    return new Intl.RelativeTimeFormat(locale || currentLanguage || 'en', { numeric: 'auto' }).format(0, 'second');
};

/**
 * Check if (date + days) is greater than or equal to today
 * @param dateInput - Date string or Date object
 * @param days - Number of days to add
 * @returns boolean
 */
export function isDatePlusDaysValid(dateInput: string | Date, days: number): boolean {
    const baseDate = new Date(dateInput);

    if (isNaN(baseDate.getTime())) {
        throw new Error('Invalid date input');
    }

    const expiryDate = new Date(baseDate);
    expiryDate.setDate(expiryDate.getDate() + days);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize today

    return expiryDate < today;
}

/**
 * Check if a date is today or in the future
 * @param dateInput - Date string or Date object
 * @returns boolean
 */
export function isDateTodayOrFuture(dateInput: string | Date): boolean {
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
        throw new Error('Invalid date input');
    }

    // Normalize both dates to remove time effect
    date.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date >= today;
}

export function calculateDaysBetween(startDate: Date | string, endDate: Date | string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize to midnight to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return Math.abs(Math.round((end.getTime() - start.getTime()) / millisecondsPerDay));
}

export function formatDateYYYYMMDD(dateInput: string | Date): string {
    const date = new Date(dateInput);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / MILLISECONDS_PER_DAY);
    if (diffDays === 0) return customizeLanguageData('today', 'Today');
    if (diffDays === 1) return customizeLanguageData('yesterday', 'Yesterday');
    if (diffDays < 7) return `${diffDays} ${customizeLanguageData('daysAgo', 'days ago')}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Calculate remaining days
 * and if end date is today the function return 1 remaining day rather than 0
 * 
 * @param startDate - Date string or Date object or null
 * @param endDate - Date string or Date object
 * 
 * @returns string
 */
export function getRemainingDay(endDate: string | Date, startDate: string | Date | null): string {
    if (!endDate) return '-';

    const today = new Date();
    const endDateVal = new Date(endDate);
    let referenceDate = today;

    if (startDate) {
        const startDateVal = new Date(startDate);
        if (startDateVal.getTime() > today.getTime()) {
            referenceDate = startDateVal;
        }
    }

    const diffTime = endDateVal.getTime() - referenceDate.getTime();
    if (diffTime < 0) {
        return `0 ${customizeLanguageData('day', 'day')}`;
    }

    const diffDays = Math.ceil(diffTime / MILLISECONDS_PER_DAY);
    return `${diffDays} ${diffDays === 1 ? customizeLanguageData('day', 'day'): customizeLanguageData('days', 'days')}`;
}