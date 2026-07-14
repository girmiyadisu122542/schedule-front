<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';

/**
 * Used by the EditIconModal and
 * the IconImportModal per-item editor for the `tags` field.
 *
 * Press Enter or comma to confirm; backspace on an empty input removes
 * the last tag. v-model binds to a `string[]` (empty array = no tags).
 */
const props = withDefaults(
    defineProps<{
        modelValue: string[] | null;
        placeholder?: string;
        maxLength?: number;
        disabled?: boolean;
    }>(),
    {
        placeholder: '',
        maxLength: 64,
        disabled: false
    }
);

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
}>();

const { translations } = storeToRefs(useLanguageStore());
const draft = ref<string>('');

function tags(): string[] {
    return props.modelValue ?? [];
}

function commit(): void {
    const value = draft.value.trim();
    draft.value = '';
    if (!value) return;
    if (tags().includes(value)) return;
    if (value.length > props.maxLength) return;
    emit('update:modelValue', [...tags(), value]);
}

function remove(tag: string): void {
    emit(
        'update:modelValue',
        tags().filter((t) => t !== tag)
    );
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        commit();
        return;
    }
    if (event.key === 'Backspace' && draft.value === '' && tags().length > 0) {
        const next = tags().slice(0, -1);
        emit('update:modelValue', next);
    }
}
</script>

<template>
    <div
        :class="[
            'border-schedule-border-primary bg-schedule-generic-white focus-within:ring-schedule-border-brand focus-within:shadow-schedule-border-brand dark:focus-within:ring-primary-500/70 flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-lg border px-4 py-2 transition duration-200 ease-in-out focus-within:shadow-xs focus-within:ring-[1px] dark:border-gray-700 dark:bg-gray-900',
            disabled ? 'opacity-60' : 'cursor-text'
        ]"
        @click="!disabled && ($refs.inputRef as HTMLInputElement)?.focus()">
        <span
            v-for="tag in tags()"
            :key="tag"
            class="bg-schedule-brand-blue-subtle text-schedule-brand-blue inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
            {{ tag }}
            <button
                v-if="!disabled"
                type="button"
                class="text-schedule-brand-blue hover:bg-schedule-brand-blue/10 rounded-full p-0.5 leading-none"
                :aria-label="`Remove ${tag}`"
                @click.stop="remove(tag)">
                ×
            </button>
        </span>
        <input
            ref="inputRef"
            v-model="draft"
            type="text"
            :placeholder="placeholder || translations.tagPlaceholder || 'Press Enter to add'"
            :disabled="disabled"
            class="text-schedule-text-primary placeholder:text-schedule-text-tertiary min-w-[80px] flex-1 border-0 bg-transparent text-sm outline-none"
            @keydown="onKeydown"
            @blur="commit" />
    </div>
</template>
