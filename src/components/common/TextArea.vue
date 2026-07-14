<script setup lang="ts">
import { computed } from 'vue';

import MainLabel from '@/components/common/MainLabel.vue';

/**
 * Shared multi-line text input — sibling of InputText / MainSelect.
 *
 * Built so callers don't repeat the same field-error <p> block in every
 * form: pass `invalid` + `message` + `messageType` and the component
 * renders its own error footer. Keep this in lock-step with InputText's
 * API so the two stay interchangeable in form layouts.
 */
type MessageType = 'error' | 'success' | 'warning' | 'info';

const props = withDefaults(
    defineProps<{
        modelValue?: string | null;
        placeholder?: string;
        rows?: number;
        disabled?: boolean;
        invalid?: boolean;
        message?: string;
        messageType?: MessageType;
        labelText?: string;
        label?: string;
        isRequired?: boolean;
        helperMessage?: string;
        maxLength?: number;
    }>(),
    {
        modelValue: '',
        placeholder: '',
        rows: 4,
        disabled: false,
        invalid: false,
        message: '',
        messageType: 'error',
        labelText: '',
        label: '',
        isRequired: false,
        helperMessage: '',
        maxLength: undefined
    }
);

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'input', value: string): void;
    (e: 'blur'): void;
    (e: 'focus'): void;
}>();

const baseClasses = computed(() =>
    [
        'w-full rounded-lg border bg-white px-3 py-2 text-sm transition focus:outline-none',
        'placeholder:text-schedule-text-tertiary text-schedule-text-primary',
        'dark:bg-gray-900 dark:text-gray-200',
        props.disabled ? 'cursor-not-allowed opacity-60' : '',
        props.invalid
            ? 'border-red-500 focus:border-red-500'
            : 'border-schedule-border-primary focus:border-schedule-brand-blue dark:border-gray-600'
    ].join(' ')
);

function onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    emit('update:modelValue', value);
    emit('input', value);
}
</script>

<template>
    <div class="w-full">
        <MainLabel
            :isRequired="props.isRequired"
            :labelText="props.label || props.labelText"
            :helperMessage="props.helperMessage" />

        <textarea
            :value="modelValue ?? ''"
            :placeholder="placeholder"
            :rows="rows"
            :disabled="disabled"
            :maxlength="maxLength"
            :class="baseClasses"
            @input="onInput"
            @blur="emit('blur')"
            @focus="emit('focus')" />

        <p
            v-if="message"
            class="mt-1 text-xs"
            :class="{
                'text-red-500': messageType === 'error',
                'text-green-500': messageType === 'success',
                'text-yellow-500': messageType === 'warning',
                'text-blue-500': messageType === 'info'
            }">
            {{ message }}
        </p>
    </div>
</template>
