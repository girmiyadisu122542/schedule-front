import axiosInstance from '@/api/axiosInstance';
import {
    DEFAULT_EXPORT_FILE_EXTENSION,
    EXPORT_DATE_SEPARATOR,
    EXPORT_MONTH_OFFSET,
    EXPORT_PAD_START_FILL_STRING,
    EXPORT_PAD_START_MAX_LENGTH,
    EXPORT_STRING_SPLIT_LIMIT,
    EXPORT_SUFFIX,
    EXPORT_TIMESTAMP_SEPARATOR,
    RESPONSE_TYPE_BLOB
} from '@/config/appConfig';
import { useLanguageStore } from '@/stores/languageStore';

const { customizeLanguageData } = useLanguageStore();

/**
 * Download a blob as a file
 * @param blob - The blob to download
 * @param filename - Name of the file to save as
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Generate a timestamped filename for exports
 * @param prefix - File prefix (e.g., 'stock-ledgers')
 * @param extension - File extension (default: 'xlsx')
 * @param startDate - Optional start date for range (YYYY-MM-DD)
 * @param endDate - Optional end date for range (YYYY-MM-DD)
 * @returns Formatted filename with timestamp or date range
 */
export const generateExportFilename = (
    prefix: string,
    extension: string = DEFAULT_EXPORT_FILE_EXTENSION,
    startDate?: string,
    endDate?: string
): string => {
    if (startDate && endDate) {
        return `${prefix}${EXPORT_SUFFIX}${startDate}${EXPORT_DATE_SEPARATOR}${endDate}.${extension}`;
    }
    const timestamp = new Date().toISOString().split(EXPORT_TIMESTAMP_SEPARATOR)[EXPORT_STRING_SPLIT_LIMIT];
    return `${prefix}${EXPORT_SUFFIX}${timestamp}.${extension}`;
};

/**
 * Export data with date range filter
 * @param apiUrl - API endpoint URL
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Blob containing the exported file
 */
export const exportWithDateRange = async (apiUrl: string, startDate: string, endDate: string): Promise<Blob> => {
    const response = await axiosInstance.get(apiUrl, {
        params: {
            start_date: startDate,
            end_date: endDate
        },
        responseType: RESPONSE_TYPE_BLOB
    });
    return response.data;
};

/**
 * Format date to YYYY-MM-DD format for API requests
 * @param date - Date string or Date object
 * @returns Formatted date string (YYYY-MM-DD)
 */
export const formatDateForExport = (date: string | Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + EXPORT_MONTH_OFFSET).padStart(EXPORT_PAD_START_MAX_LENGTH, EXPORT_PAD_START_FILL_STRING);
    const day = String(d.getDate()).padStart(EXPORT_PAD_START_MAX_LENGTH, EXPORT_PAD_START_FILL_STRING);
    return `${year}-${month}-${day}`;
};

/**
 * Validate date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns True if valid, error message if invalid
 */
export const validateDateRange = (
    startDate: string | null,
    endDate: string | null
): { valid: boolean; error?: string } => {
    if (!startDate || !endDate) {
        return { valid: false, error: customizeLanguageData('bothStartAndEndDatesRequired', 'Both start and end dates are required') };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, error: customizeLanguageData('invalidDateFormat', 'Invalid date format') };
    }

    if (end < start) {
        return { valid: false, error: customizeLanguageData('endDateMustBeGreaterThanOrEqualToStartDate', 'End date must be greater than or equal to start date') };
    }

    return { valid: true };
};