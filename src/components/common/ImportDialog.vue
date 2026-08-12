<script setup lang="ts">
import { computed, ref } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import { useLanguageStore } from '@/stores/languageStore';

import DownloadIcon from '@/assets/icons/DownloadIcon.vue';
import ImportIcon from '@/assets/icons/ImportIcon.vue';

import {
    EXPORT_FORMAT_XLSX,
    EXPORT_FORMAT_CSV,
    IMPORT_MODE_CREATE_ONLY,
    IMPORT_MODE_UPSERT,
    IMPORT_ACCEPTED_FILE_TYPES,
    IMPORT_ERROR_PREVIEW_ROWS,
    type ExportFormat,
    type ImportMode
} from '@/config/appConfig';
import type { ImportReport } from '@/composables/useImportExport';

/**
 * Spreadsheet import, in the order the work actually happens: get a template,
 * pick a file, choose how duplicates are treated, PREVIEW, then commit.
 *
 * The preview is not optional. Half-imported master data is worse than a
 * rejected file — a partly-loaded department list produces orphan programmes
 * nobody notices until scheduling fails — so the commit button stays disabled
 * until a dry run has come back clean.
 */
const props = defineProps<{
    visible: boolean;
    entityLabel: string;
    /** The dependency order for this entity, e.g. 'colleges → departments'. */
    importOrderHint?: string;
    isUploading?: boolean;
    isDownloadingTemplate?: boolean;
    report: ImportReport | null;
    hasPreviewed: boolean;
    canCommit: boolean;
    rowsToWrite: number;
    mode: ImportMode;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'update:mode', value: ImportMode): void;
    (event: 'file', value: File | null): void;
    (event: 'preview'): void;
    (event: 'confirm'): void;
    (event: 'template', format: ExportFormat): void;
}>();

const { customizeLanguageData } = useLanguageStore();

const fileName = ref('');

const modeOptions = computed(() => [
    {
        value: IMPORT_MODE_CREATE_ONLY as ImportMode,
        label: customizeLanguageData('createOnly', 'Add new records only'),
        hint: customizeLanguageData('createOnlyHint', 'A row whose code already exists is reported as an error.')
    },
    {
        value: IMPORT_MODE_UPSERT as ImportMode,
        label: customizeLanguageData('upsert', 'Add new and update existing'),
        hint: customizeLanguageData('upsertHint', 'A row whose code already exists updates that record.')
    }
]);

const errorRows = computed(() => props.report?.errors.slice(0, IMPORT_ERROR_PREVIEW_ROWS) ?? []);

const hiddenErrorCount = computed(() => Math.max((props.report?.errors.length ?? 0) - IMPORT_ERROR_PREVIEW_ROWS, 0));

const hasErrors = computed(() => (props.report?.errors.length ?? 0) > 0);

const onFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    fileName.value = file?.name ?? '';
    emit('file', file);
};

const close = () => {
    fileName.value = '';
    emit('update:visible', false);
};
</script>

<template>
    <MainDialog
        :visible="props.visible"
        :plain-background="true"
        max-width="max-w-lg"
        :header="`${customizeLanguageData('import', 'Import')} — ${props.entityLabel}`"
        @update:visible="close">
        <div class="space-y-5 px-1 py-2">
            <!-- 1. The template. Generated from the backend column map at request
                 time, so it can never disagree with what the importer accepts. -->
            <section class="border-border-default bg-surface-muted rounded-lg border p-4">
                <h3 class="text-text-primary mb-1 text-sm font-semibold">
                    {{ $lang.startFromTheTemplate || 'Start from the template' }}
                </h3>
                <p class="text-text-tertiary mb-3 text-xs">
                    {{
                        $lang.templateExplainer ||
                        'The template carries the exact columns this import accepts, plus one worked example row.'
                    }}
                </p>
                <div class="flex flex-wrap gap-2">
                    <MainButton
                        :label="$lang.templateXlsx || 'Template (.xlsx)'"
                        :icon="DownloadIcon"
                        size="small"
                        outlined
                        :loading="props.isDownloadingTemplate"
                        @click="emit('template', EXPORT_FORMAT_XLSX)" />
                    <MainButton
                        :label="$lang.templateCsv || 'Template (.csv)'"
                        :icon="DownloadIcon"
                        size="small"
                        outlined
                        :loading="props.isDownloadingTemplate"
                        @click="emit('template', EXPORT_FORMAT_CSV)" />
                </div>

                <!-- Import order. A registrar loading programmes before departments
                     gets every row rejected; saying so here is cheaper than
                     explaining it afterwards. -->
                <p
                    v-if="props.importOrderHint"
                    class="text-text-tertiary mt-3 text-xs">
                    <span class="text-text-secondary font-medium">{{ $lang.importOrder || 'Import order' }}:</span>
                    {{ props.importOrderHint }}
                </p>
            </section>

            <!-- 2. The file -->
            <section>
                <label class="text-text-secondary mb-1.5 block text-sm font-medium">
                    {{ $lang.chooseFile || 'Choose a file' }}
                </label>
                <input
                    type="file"
                    :accept="IMPORT_ACCEPTED_FILE_TYPES"
                    class="border-border-default bg-surface-subtle text-text-secondary file:bg-surface-card file:text-text-secondary hover:file:bg-surface-hover w-full cursor-pointer rounded-lg border p-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
                    @change="onFileChange" />
            </section>

            <!-- 3. Duplicate handling -->
            <section>
                <span class="text-text-secondary mb-1.5 block text-sm font-medium">
                    {{ $lang.whenARecordAlreadyExists || 'When a record already exists' }}
                </span>
                <div class="space-y-2">
                    <label
                        v-for="option in modeOptions"
                        :key="option.value"
                        class="border-border-default hover:bg-surface-hover flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition"
                        :class="props.mode === option.value ? 'border-border-focus bg-surface-subtle' : ''">
                        <input
                            type="radio"
                            class="mt-1"
                            :value="option.value"
                            :checked="props.mode === option.value"
                            @change="emit('update:mode', option.value)" />
                        <span>
                            <span class="text-text-primary block text-sm font-medium">{{ option.label }}</span>
                            <span class="text-text-tertiary block text-xs">{{ option.hint }}</span>
                        </span>
                    </label>
                </div>
            </section>

            <!-- 4. The dry-run report -->
            <section
                v-if="props.hasPreviewed && props.report"
                class="border-border-default rounded-lg border">
                <div class="border-border-subtle flex flex-wrap gap-4 border-b p-3">
                    <span class="text-schedule-success-strong text-sm font-medium">
                        {{ props.report.created }} {{ $lang.toAdd || 'to add' }}
                    </span>
                    <span class="text-schedule-info-strong text-sm font-medium">
                        {{ props.report.updated }} {{ $lang.toUpdate || 'to update' }}
                    </span>
                    <span
                        class="text-sm font-medium"
                        :class="hasErrors ? 'text-schedule-error-strong' : 'text-text-tertiary'">
                        {{ props.report.errors.length }} {{ $lang.withErrors || 'with errors' }}
                    </span>
                </div>

                <p
                    v-if="!hasErrors"
                    class="text-text-tertiary p-3 text-xs">
                    {{ $lang.nothingSavedYet || 'Nothing has been saved yet. Confirm to write these rows.' }}
                </p>

                <div
                    v-else
                    class="max-h-64 overflow-y-auto">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-surface-subtle text-text-tertiary sticky top-0">
                            <tr>
                                <th class="px-3 py-2 font-medium">{{ $lang.row || 'Row' }}</th>
                                <th class="px-3 py-2 font-medium">{{ $lang.column || 'Column' }}</th>
                                <th class="px-3 py-2 font-medium">{{ $lang.problem || 'Problem' }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(error, index) in errorRows"
                                :key="`${error.row}-${error.column}-${index}`"
                                class="border-border-subtle border-t">
                                <td class="text-text-secondary px-3 py-2 font-mono">{{ error.row }}</td>
                                <td class="text-text-secondary px-3 py-2 font-mono">{{ error.column || '—' }}</td>
                                <td class="text-text-primary px-3 py-2">{{ error.message }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p
                        v-if="hiddenErrorCount > 0"
                        class="text-text-tertiary px-3 py-2 text-xs">
                        {{ $lang.andMore || 'and' }} {{ hiddenErrorCount }} {{ $lang.moreErrors || 'more' }}
                    </p>
                </div>
            </section>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <MainButton
                    :label="$lang.cancel || 'Cancel'"
                    text
                    @click="close" />
                <MainButton
                    :label="$lang.preview || 'Preview'"
                    outlined
                    :loading="props.isUploading && !props.canCommit"
                    @click="emit('preview')" />
                <MainButton
                    :label="`${customizeLanguageData('import', 'Import')}${props.canCommit ? ` ${props.rowsToWrite}` : ''}`"
                    :icon="ImportIcon"
                    :disabled="!props.canCommit"
                    :loading="props.isUploading && props.canCommit"
                    @click="emit('confirm')" />
            </div>
        </template>
    </MainDialog>
</template>
