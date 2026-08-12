import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';

import axiosInstance from '@/api/axiosInstance';
import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { downloadBlob, generateExportFilename } from '@/utils/exportUtils';
import { readApiErrorMessage } from '@/utils/apiError';
import {
    RESPONSE_TYPE_BLOB,
    IMPORT_MODE_CREATE_ONLY,
    IMPORT_MODE_UPSERT,
    EXPORT_FORMAT_XLSX,
    EXPORT_FORMAT_CSV,
    EXPORT_FORMATS,
    type ImportMode,
    type ExportFormat
} from '@/config/appConfig';
import type { AllowedAction } from '@/constants/allowedActions';

/** One problem the dry run found, as the backend reports it. */
export interface ImportError {
    row: number;
    column: string | null;
    message: string;
}

/** The import report — identical shape for a dry run and a real run. */
export interface ImportReport {
    created: number;
    updated: number;
    skipped: number;
    errors: ImportError[];
}

export interface ImportExportConfig {
    /**
     * The resource base, e.g. `'/departments'`. Export, template and import all
     * hang off it, matching the backend's three explicit routes.
     */
    baseUrl: string;
    /**
     * PascalCase entity name — `'Department'` → the `exportDepartment` /
     * `importDepartment` allowed actions, so it must match the backend
     * `PermissionList.php` keys exactly.
     */
    entity: string;
    /** Filename stem for a downloaded export. */
    filePrefix: string;
    /** Translation key + fallback for the entity's name, shown in the dialog title. */
    labelKey: string;
    labelFallback: string;
    /**
     * Translation key + fallback for this entity's dependency order.
     *
     * Importing out of order fails on unresolvable FK codes, and a registrar
     * loading programmes before departments would otherwise just see every row
     * rejected with no explanation of why.
     */
    importOrderKey: string;
    importOrderFallback: string;
    /**
     * The list's currently applied filters. Read at click time so an export
     * carries whatever the user has narrowed to — not a snapshot from mount.
     */
    currentParams?: () => Record<string, unknown>;
    /** Called after a committed import so the list reloads. */
    onImported?: () => void | Promise<void>;
}

/**
 * The shared import/export engine behind every master-data list screen: the
 * file handle, the dry-run report, upload state, and the two downloads.
 *
 * Config-driven the same way `useCrudResource` is — a slice passes its
 * endpoints and entity name and gets the whole behaviour, so the dialog and
 * menu components stay presentational.
 *
 * Spreadsheets are always built by the BACKEND. The column map there is the one
 * definition of what a sheet looks like; generating one here would immediately
 * drift from what the importer accepts.
 */
export function useImportExport(config: ImportExportConfig) {
    const { customizeLanguageData } = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();

    const action = (verb: string) => `${verb}${config.entity}` as AllowedAction;

    const entityLabel = computed(() => customizeLanguageData(config.labelKey, config.labelFallback));
    const importOrderHint = computed(() => customizeLanguageData(config.importOrderKey, config.importOrderFallback));

    const canExport = computed(() => allowedRoutesStore.can(action('export')));
    const canImport = computed(() => allowedRoutesStore.can(action('import')));

    /** Fed to `MainTable`'s export button, which renders them as its own menu. */
    const exportFormats = computed(() => [
        {
            value: EXPORT_FORMAT_XLSX as string,
            label: customizeLanguageData('excelWorkbook', 'Excel workbook (.xlsx)')
        },
        { value: EXPORT_FORMAT_CSV as string, label: customizeLanguageData('csvFile', 'CSV file (.csv)') }
    ]);

    const isExporting = ref(false);
    const isUploading = ref(false);
    const isDownloadingTemplate = ref(false);

    const importDialogVisible = ref(false);
    const selectedFile = ref<File | null>(null);
    const mode = ref<ImportMode>(IMPORT_MODE_CREATE_ONLY);
    const report = ref<ImportReport | null>(null);
    /** True once a dry run has returned, which is what reveals the Confirm button. */
    const hasPreviewed = ref(false);

    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    /** Nothing may be committed until a preview has run and found no errors. */
    const canCommit = computed(() => hasPreviewed.value && report.value !== null && report.value.errors.length === 0);

    const rowsToWrite = computed(() => (report.value ? report.value.created + report.value.updated : 0));

    const resetDialog = () => {
        selectedFile.value = null;
        report.value = null;
        hasPreviewed.value = false;
        mode.value = IMPORT_MODE_CREATE_ONLY;
    };

    const openImportDialog = () => {
        resetDialog();
        importDialogVisible.value = true;
    };

    const closeImportDialog = () => {
        importDialogVisible.value = false;
        resetDialog();
    };

    /** A new file invalidates the previous preview. */
    const setFile = (file: File | null) => {
        selectedFile.value = file;
        report.value = null;
        hasPreviewed.value = false;
    };

    /** Changing the mode does too — create_only and upsert disagree on duplicates. */
    const setMode = (value: ImportMode) => {
        mode.value = value;
        report.value = null;
        hasPreviewed.value = false;
    };

    const download = async (url: string, params: Record<string, unknown>, prefix: string, format: ExportFormat) => {
        // `responseType: 'blob'` is required — without it axios parses the
        // binary body as text and the saved file is corrupt. The shared
        // instance still sends the `lang` header, so an Amharic user gets
        // Amharic column headers in their spreadsheet.
        const response = await axiosInstance.get(url, {
            params: { ...params, format },
            responseType: RESPONSE_TYPE_BLOB
        });

        downloadBlob(response.data, generateExportFilename(prefix, format));
    };

    /**
     * `MainTable` emits the chosen format as a plain string, so narrow it here
     * rather than trusting it — an unrecognised value falls back to xlsx.
     */
    const toFormat = (format?: string): ExportFormat =>
        (EXPORT_FORMATS as readonly string[]).includes(format ?? '') ? (format as ExportFormat) : EXPORT_FORMAT_XLSX;

    const exportList = async (format?: string) => {
        isExporting.value = true;
        try {
            await download(
                `${config.baseUrl}/export`,
                config.currentParams?.() ?? {},
                config.filePrefix,
                toFormat(format)
            );
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isExporting.value = false;
        }
    };

    const downloadTemplate = async (format?: string) => {
        isDownloadingTemplate.value = true;
        try {
            await download(`${config.baseUrl}/import-template`, {}, `${config.filePrefix}-template`, toFormat(format));
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isDownloadingTemplate.value = false;
        }
    };

    const submit = async (isDryRun: boolean) => {
        if (!selectedFile.value) return;

        isUploading.value = true;
        try {
            const payload = new FormData();
            payload.append('file', selectedFile.value);
            payload.append('mode', mode.value);
            payload.append('dry_run', isDryRun ? '1' : '0');

            const response = await axiosInstance.post(`${config.baseUrl}/import`, payload);
            report.value = response.data.data as ImportReport;

            if (isDryRun) {
                hasPreviewed.value = true;
                return;
            }

            toast.success(response.data.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            importDialogVisible.value = false;
            resetDialog();
            await config.onImported?.();
        } catch (error: unknown) {
            // A 422 still carries the report — the row/column list is the whole
            // point of the response, so surface it instead of only a toast.
            const failure = error as { response?: { data?: { data?: ImportReport; message?: string } } };
            const returned = failure?.response?.data?.data;

            if (returned && Array.isArray(returned.errors)) {
                report.value = returned;
                hasPreviewed.value = true;
            }

            toast.error(genericError(error));
        } finally {
            isUploading.value = false;
        }
    };

    /** Validate only — the user sees "12 rows OK, 3 errors" before anything is written. */
    const previewImport = () => submit(true);

    /** Commit. Only reachable once a clean preview exists. */
    const confirmImport = () => submit(false);

    return {
        entityLabel,
        importOrderHint,
        canExport,
        canImport,
        exportFormats,

        isExporting,
        isUploading,
        isDownloadingTemplate,

        importDialogVisible,
        selectedFile,
        mode,
        report,
        hasPreviewed,
        canCommit,
        rowsToWrite,

        openImportDialog,
        closeImportDialog,
        setFile,
        setMode,
        previewImport,
        confirmImport,
        exportList,
        downloadTemplate,

        IMPORT_MODE_CREATE_ONLY,
        IMPORT_MODE_UPSERT
    };
}
