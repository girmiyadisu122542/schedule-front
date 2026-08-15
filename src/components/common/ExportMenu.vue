<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue';
import { onClickOutside } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import ExportIcon from '@/assets/icons/ExportIcon.vue';
import SpinnerIcon from '@/assets/icons/SpinnerIcon.vue';
import { EXPORT_FORMAT_XLSX, EXPORT_FORMAT_CSV, type ExportFormat } from '@/config/appConfig';

/**
 * Format picker for a list export, on surfaces that are NOT a `MainTable`.
 *
 * `MainTable` carries its own export button (see its `exportFormats` prop), so
 * every table screen uses that. This exists for the card and board layouts,
 * where there is no table toolbar to hang it off — the course-offering queue
 * being the first.
 *
 * A `MainSelect` was the wrong shape here: a select implies a value that stays
 * chosen, and an export format is an action taken once.
 */
const props = defineProps<{
    isExporting?: boolean;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (event: 'export', format: ExportFormat): void;
}>();

const { customizeLanguageData } = useLanguageStore();

const isOpen = ref(false);
const container = useTemplateRef<HTMLElement>('container');

onClickOutside(container, () => {
    isOpen.value = false;
});

const formats = computed(() => [
    {
        value: EXPORT_FORMAT_XLSX as ExportFormat,
        label: customizeLanguageData('excelWorkbook', 'Excel workbook (.xlsx)')
    },
    {
        value: EXPORT_FORMAT_CSV as ExportFormat,
        label: customizeLanguageData('csvFile', 'CSV file (.csv)')
    }
]);

const choose = (format: ExportFormat) => {
    isOpen.value = false;
    emit('export', format);
};
</script>

<template>
    <div
        ref="container"
        class="relative">
        <button
            type="button"
            :disabled="props.disabled || props.isExporting"
            class="border-border-default bg-surface-card text-text-secondary hover:bg-surface-hover flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
            :title="customizeLanguageData('export', 'Export')"
            @click="isOpen = !isOpen">
            <SpinnerIcon
                v-if="props.isExporting"
                class="h-4 w-4 animate-spin" />
            <ExportIcon
                v-else
                class="h-4 w-4" />
            <span>{{ $lang.export || 'Export' }}</span>
        </button>

        <div
            v-if="isOpen"
            class="bg-surface-card border-border-default absolute end-0 z-30 mt-1 w-56 overflow-hidden rounded-lg border shadow-xl">
            <button
                v-for="format in formats"
                :key="format.value"
                type="button"
                class="text-text-secondary hover:bg-surface-hover block w-full px-4 py-2.5 text-start text-sm transition"
                @click="choose(format.value)">
                {{ format.label }}
            </button>
        </div>
    </div>
</template>
