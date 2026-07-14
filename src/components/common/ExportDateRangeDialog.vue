<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';

import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import DateTimePicker from '@/components/common/DateTimePicker.vue';

import { useLanguageStore } from '@/stores/languageStore';
import { validateDateRange } from '@/utils/exportUtils';

import ExportIcon from '@/assets/icons/ExportIcon.vue';

interface Props {
    visible: boolean;
    title?: string;
    subtitle?: string;
    isLoading?: boolean;
}

const { customizeLanguageData } = useLanguageStore();

const props = withDefaults(defineProps<Props>(), {
    isLoading: false
});

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'export', startDate: string, endDate: string): void;
    (e: 'close'): void;
}>();


const startDate = ref<string | null>(null);
const endDate = ref<string | null>(null);
const validationError = ref<string | null>(null);

const canExport = computed(() => {
    return startDate.value && endDate.value && !validationError.value;
});

const handleExport = () => {
    validationError.value = null;

    const validation = validateDateRange(startDate.value, endDate.value);

    if (!validation.valid) {
        validationError.value = validation.error || customizeLanguageData('invalidDateRange', 'Invalid date range');
        return;
    }

    if (startDate.value && endDate.value) {
        emit('export', startDate.value, endDate.value);
    }
};

const handleClose = () => {
    startDate.value = null;
    endDate.value = null;
    validationError.value = null;
    emit('update:visible', false);
    emit('close');
};

const handleStartDateChange = () => {
    validationError.value = null;
};

const handleEndDateChange = () => {
    validationError.value = null;
};
</script>

<template>
    <MainDialog
        :visible="props.visible"
        :header="props.title"
        :subtitle="props.subtitle"
        @update:visible="handleClose"
        @close="handleClose"
        width="w-full"
        max-width="max-w-lg">
        <div class="space-y-6">
            <!-- Start Date -->
            <div>
                <DateTimePicker
                    v-model="startDate"
                    :label-text="$lang.startDate || 'Start Date'"
                    :placeholder="$lang.selectStartDate || 'Select start date'"
                    :is-required="true"
                    :invalid="!!validationError && !startDate"
                    @change="handleStartDateChange" />
            </div>

            <!-- End Date -->
            <div>
                <DateTimePicker
                    v-model="endDate"
                    :label-text="$lang.endDate || 'End Date'"
                    :placeholder="$lang.selectEndDate || 'Select end date'"
                    :is-required="true"
                    :invalid="!!validationError && !endDate"
                    @change="handleEndDateChange" />
            </div>

            <!-- Validation Error -->
            <div
                v-if="validationError"
                class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <div class="flex items-start gap-2">
                    <i class="fa-solid fa-circle-exclamation mt-0.5 text-sm text-red-600 dark:text-red-400"></i>
                    <p class="text-sm text-red-600 dark:text-red-400">
                        {{ validationError }}
                    </p>
                </div>
            </div>

            <!-- Info Message -->
            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <div class="flex items-start gap-2">
                    <i class="fa-solid fa-circle-info mt-0.5 text-sm text-blue-600 dark:text-blue-400"></i>
                    <p class="text-sm text-blue-600 dark:text-blue-400">
                        {{
                            $lang.exportDateRangeInfo ||
                            'Select a date range to export the data. If no data is found within the selected range, you will be notified.'
                        }}
                    </p>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex items-center justify-end gap-3">
                <MainButton
                    :label="$lang.cancel || 'Cancel'"
                    variant="light"
                    :disabled="props.isLoading"
                    @click="handleClose" />

                <MainButton
                    :label="$lang.export || 'Export'"
                    variant="primary"
                    :icon="ExportIcon"
                    :loading="props.isLoading"
                    :disabled="!canExport || props.isLoading"
                    @click="handleExport" />
            </div>
        </template>
    </MainDialog>
</template>
