import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { exportWithDateRange, downloadBlob, generateExportFilename } from '@/utils/exportUtils';
import { DEFAULT_EXPORT_FILE_EXTENSION, EXPORT_NOT_FOUND } from '@/config/appConfig';

const { customizeLanguageData } = useLanguageStore();

export interface ExportConfig {
    /**
     * API endpoint URL for export (e.g., '/inventory/stock-ledgers/export')
     */
    apiUrl: string;

    /**
     * File prefix for the exported file (e.g., 'stock-ledgers')
     */
    filePrefix: string;

    /**
     * Message to show when no data is found in the date range
     */
    noDataMessage?: string;

    /**
     * Success message to show after successful export
     */
    successMessage?: string;

    /**
     * Error message to show when export fails
     */
    errorMessage?: string;

    /**
     * File extension (default: 'xlsx')
     */
    fileExtension?: string;
}

/**
 * Reusable composable for export with date range functionality
 *
 */
export function useExportWithDateRange(config: ExportConfig) {
    const isExportDialogOpen = ref<boolean>(false);
    const isExporting = ref<boolean>(false);

    const {
        apiUrl,
        filePrefix,
        noDataMessage,
        successMessage,
        errorMessage,
        fileExtension = DEFAULT_EXPORT_FILE_EXTENSION
    } = config;

    /**
     * Open the export date range dialog
     */
    const openExportDialog = (): void => {
        isExportDialogOpen.value = true;
    };

    /**
     * Close the export date range dialog
     */
    const closeExportDialog = (): void => {
        isExportDialogOpen.value = false;
    };

    /**
     * Handle export with date range
     * @param startDate - Start date in YYYY-MM-DD format
     * @param endDate - End date in YYYY-MM-DD format
     * @returns Promise<boolean> - True if export was successful
     */
    const handleExport = async (startDate: string, endDate: string): Promise<boolean> => {
        try {
            isExporting.value = true;

            const blob = await exportWithDateRange(apiUrl, startDate, endDate);

            // Check if the response is actually empty or an error response
            if (blob.size === 0) {
                const message =
                    noDataMessage ||
                    customizeLanguageData('noDataFoundInDateRange', 'No data found in the selected date range');
                toast.warning(message);
                return false;
            }

            // Download the file with date range in filename
            const filename = generateExportFilename(filePrefix, fileExtension, startDate, endDate);
            downloadBlob(blob, filename);

            // Show success message
            const message =
                successMessage || customizeLanguageData('exportedSuccessfully', 'Data exported successfully!');
            toast.success(message);

            // Close the dialog
            closeExportDialog();

            return true;
        } catch (error: any) {
            // Handle specific error cases
            if (error.response?.status === EXPORT_NOT_FOUND) {
                const message =
                    noDataMessage ||
                    customizeLanguageData('noDataFoundInDateRange', 'No data found in the selected date range');
                toast.warning(message);
            } else {
                const message =
                    error.response?.data?.message ||
                    errorMessage ||
                    customizeLanguageData('failedToExport', 'Failed to export data');
                toast.error(message);
            }

            return false;
        } finally {
            isExporting.value = false;
        }
    };

    return {
        isExportDialogOpen,
        isExporting,
        openExportDialog,
        closeExportDialog,
        handleExport
    };
}
