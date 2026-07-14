<script setup lang="ts">
/**
 * A descriptive on/off card: icon + title + a tip line that spells out what the
 * CURRENT state actually does. Use instead of a bare switch when a setting's
 * effect is not self-evident (integration flags, automation behaviour, etc.).
 */
import { computed } from 'vue';

import ToggleSwitch from '@/components/common/ToggleSwitch.vue';

const props = withDefaults(
    defineProps<{
        modelValue: boolean;
        title: string;
        icon?: string;
        onHint?: string;
        offHint?: string;
        disabled?: boolean;
    }>(),
    { icon: 'fas fa-toggle-on', onHint: '', offHint: '', disabled: false }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const hint = computed(() => (props.modelValue ? props.onHint : props.offHint));
</script>

<template>
    <div
        class="rounded-xl border p-3.5 transition-colors"
        :class="
            modelValue ? 'border-schedule-brand-blue/40 bg-schedule-brand-blue/5' : 'border-border-default bg-surface-card'
        ">
        <div class="flex items-start gap-3">
            <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                :class="modelValue ? 'bg-schedule-brand-blue text-white' : 'bg-surface-subtle text-text-tertiary'">
                <i :class="icon" />
            </span>
            <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                    <p class="text-text-primary text-sm font-semibold">{{ title }}</p>
                    <ToggleSwitch
                        :model-value="modelValue"
                        :disabled="disabled"
                        variant="primary"
                        @update:model-value="(value: boolean) => emit('update:modelValue', value)" />
                </div>
                <p
                    v-if="hint"
                    class="text-text-tertiary mt-1 flex items-start gap-1.5 text-xs leading-relaxed">
                    <i
                        class="mt-0.5 shrink-0"
                        :class="
                            modelValue
                                ? 'fas fa-circle-check text-schedule-icon-success'
                                : 'fas fa-circle-info text-text-muted'
                        " />
                    <span>{{ hint }}</span>
                </p>
            </div>
        </div>
    </div>
</template>
