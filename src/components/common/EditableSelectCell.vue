<script setup lang="ts">
import { computed, ref } from 'vue';

import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainPopover from '@/components/common/MainPopover.vue';

type CellValue = string | number | null;

const props = withDefaults(
    defineProps<{
        displayLabel?: string | null;
        value?: CellValue;
        options: any[];
        optionLabel?: string;
        optionValue?: string;
        canEdit?: boolean;
        onSubmit: (value: NonNullable<CellValue>) => Promise<boolean>;
        title?: string;
        placeholder?: string;
        emptyLabel?: string;
        updateLabel?: string;
        cancelLabel?: string;
        search?: boolean;
        loading?: boolean;
    }>(),
    {
        displayLabel: '',
        value: null,
        options: () => [],
        optionLabel: '',
        optionValue: '',
        canEdit: false,
        title: '',
        placeholder: '',
        emptyLabel: '—',
        updateLabel: '',
        cancelLabel: '',
        search: true,
        loading: false
    }
);

const emit = defineEmits<{
    (e: 'search', query: string): void;
}>();

const popoverRef = ref<InstanceType<typeof MainPopover> | null>(null);
const selectedValue = ref<CellValue>(null);
const isSubmitting = ref(false);

const resolvedFromOptions = computed(() => {
    if (props.value === null || props.value === '') return '';
    const match = props.options.find((option) => String(option?.[props.optionValue]) === String(props.value));
    return match?.[props.optionLabel] ?? '';
});

const shownLabel = computed(() => props.displayLabel || resolvedFromOptions.value || props.emptyLabel);

const hasChange = computed(
    () =>
        selectedValue.value !== null &&
        selectedValue.value !== '' &&
        String(selectedValue.value) !== String(props.value ?? '')
);

function openEditor(event: MouseEvent) {
    if (!props.canEdit) return;
    selectedValue.value = props.value ?? null;
    popoverRef.value?.toggle(event);
}

async function confirm() {
    if (!hasChange.value || selectedValue.value === null || isSubmitting.value) return;

    isSubmitting.value = true;
    const ok = await props.onSubmit(selectedValue.value);
    isSubmitting.value = false;

    if (ok) popoverRef.value?.hide();
}
</script>

<template>
    <div class="inline-flex items-center">
        <button
            type="button"
            :disabled="!canEdit"
            :class="[
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-left transition',
                canEdit ? 'hover:bg-surface-hover cursor-pointer' : 'cursor-default'
            ]"
            @click.stop="openEditor">
            <span class="text-text-primary">{{ shownLabel }}</span>
        </button>

        <MainPopover
            ref="popoverRef"
            placement="bottom"
            max-width="18rem">
            <div class="flex w-64 flex-col gap-3 p-1">
                <p
                    v-if="title"
                    class="text-text-secondary text-sm font-semibold">
                    {{ title }}
                </p>

                <MainSelect
                    v-model="selectedValue"
                    :options="options"
                    :option-label="optionLabel"
                    :option-value="optionValue"
                    :search="search"
                    :loading="loading"
                    :placeholder="placeholder || $lang.select || 'Select'"
                    @search-input="(query) => emit('search', query)" />

                <div class="flex justify-end gap-2">
                    <MainButton
                        text
                        size="small"
                        :label="cancelLabel || $lang.cancel || 'Cancel'"
                        :disabled="isSubmitting"
                        @click="popoverRef?.hide()" />
                    <MainButton
                        size="small"
                        :loading="isSubmitting"
                        :disabled="!hasChange || isSubmitting"
                        :label="updateLabel || $lang.update || 'Update'"
                        @click="confirm" />
                </div>
            </div>
        </MainPopover>
    </div>
</template>
