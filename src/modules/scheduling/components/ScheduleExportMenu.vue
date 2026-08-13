<script setup lang="ts">
import { ref } from 'vue';
import { vOnClickOutside } from '@vueuse/components';

import MainButton from '@/components/common/MainButton.vue';

import ExportIcon from '@/assets/icons/ExportIcon.vue';
import { EXPORT_FORMAT_XLSX, EXPORT_FORMAT_PDF } from '@/config/appConfig';

/**
 * Export the schedule that is currently on screen.
 *
 * Deliberately not `MainTable`'s export button: that one downloads from the
 * backend's master-data export, which is a flat round-trip sheet. A timetable
 * export is a printout — it has to carry the grid, and it has to be whatever
 * the user has filtered to.
 */
defineProps<{ loading?: boolean }>();

const emit = defineEmits<{ (e: 'export', format: string): void }>();

const open = ref(false);

const choose = (format: string) => {
    open.value = false;
    emit('export', format);
};
</script>

<template>
    <div
        v-on-click-outside="() => (open = false)"
        class="relative">
        <MainButton
            outlined
            :icon="ExportIcon"
            :label="$lang.export || 'Export'"
            :loading="loading"
            @click="open = !open" />

        <div
            v-if="open"
            class="schedule-card border-border-default absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border shadow-lg">
            <button
                type="button"
                class="schedule-row-hover text-text-secondary w-full cursor-pointer px-3 py-2 text-left text-sm"
                @click="choose(EXPORT_FORMAT_XLSX)">
                {{ $lang.excelWorkbook || 'Excel workbook (.xlsx)' }}
            </button>
            <button
                type="button"
                class="schedule-row-hover text-text-secondary w-full cursor-pointer px-3 py-2 text-left text-sm"
                @click="choose(EXPORT_FORMAT_PDF)">
                {{ $lang.pdfDocument || 'PDF document (.pdf)' }}
            </button>
        </div>
    </div>
</template>
