<script setup lang="ts">
import type { Component } from 'vue';
import Skeleton from '@/components/common/Skeleton.vue';
import MainBadge from '@/components/common/MainBadge.vue';

export interface TabOption {
    label: string;
    value: string | number;
    /** Icon as a Vue component (existing usage). */
    icon?: Component;
    /** Icon as a Font Awesome class string, e.g. 'fas fa-grip'. */
    iconClass?: string;
    disabled?: boolean;
    count?: string | number;
    /** Native tooltip shown on hover — handy for explaining a disabled tab. */
    tooltip?: string;
}

type BadgeSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';

const props = withDefaults(
    defineProps<{
        modelValue: string | number;
        options?: TabOption[];
        badgeSeverity?: BadgeSeverity;
        badgeOverlay?: boolean;
        /** Background applied to the ACTIVE tab (any CSS color). Falls back to the surface style. */
        activeBgColor?: string;
        /** Text color applied to the ACTIVE tab (any CSS color). */
        activeTextColor?: string;
        /** Stretch the strip to the full container width. */
        block?: boolean;
        /** Square-ish tabs (rounded-lg) instead of the default pill (rounded-full). */
        rectangular?: boolean;
        /** Drop the strip container background/border/shadow — tabs sit directly on the page. */
        bare?: boolean;
        /** Override the strip surface classes (bg/border/shadow). Ignored when `bare`. */
        surfaceClass?: string;
    }>(),
    {
        options: () => [],
        badgeSeverity: 'primary',
        activeBgColor: '',
        activeTextColor: '',
        block: false,
        rectangular: false,
        bare: false,
        surfaceClass: ''
    }
);

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void;
    (e: 'change', value: string | number): void;
}>();

const isActive = (option: TabOption) => props.modelValue === option.value;

const selectTab = (option: TabOption) => {
    if (option.disabled) return;
    emit('update:modelValue', option.value);
    emit('change', option.value);
};

const activeStyle = (option: TabOption): Record<string, string> => {
    if (!isActive(option)) return {};
    const style: Record<string, string> = {};
    if (props.activeBgColor) style.backgroundColor = props.activeBgColor;
    if (props.activeTextColor) style.color = props.activeTextColor;
    return style;
};
</script>

<template>
    <div
        v-if="props.options.length > 0"
        class="flex items-center gap-2 overflow-x-auto"
        :class="[
            bare ? '' : `${surfaceClass || 'bg-surface-subtle border-border-default border shadow-sm'} p-2`,
            rectangular ? 'rounded-xl' : 'rounded-full',
            block ? 'w-full' : 'w-full max-w-max'
        ]">
        <button
            v-for="option in options"
            :key="option.value"
            type="button"
            :disabled="option.disabled"
            :title="option.tooltip"
            :style="activeStyle(option)"
            class="group relative flex shrink-0 items-center gap-2 px-4 py-2 text-sm whitespace-nowrap transition-colors duration-200"
            :class="[
                rectangular ? 'rounded-md' : 'rounded-full',
                block ? 'flex-1 justify-center' : '',
                option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                isActive(option)
                    ? activeBgColor
                        ? 'font-semibold shadow-sm'
                        : 'bg-surface-card text-text-primary font-semibold shadow-sm'
                    : 'text-text-tertiary hover:bg-surface-hover hover:text-text-secondary'
            ]"
            @click="selectTab(option)">
            <i
                v-if="option.iconClass"
                class="text-base"
                :class="option.iconClass" />
            <component
                :is="option.icon"
                v-else-if="option.icon"
                class="h-5 w-5" />
            <span>{{ option.label }}</span>
            <MainBadge
                v-if="option.count"
                :value="option.count"
                :severity="badgeSeverity"
                size="small"
                class="ml-0.5" />
        </button>
        <slot name="trailing" />
    </div>

    <div
        v-else
        class="flex items-center gap-2 overflow-x-auto"
        :class="[
            bare ? '' : `${surfaceClass || 'bg-surface-subtle border-border-default border shadow-sm'} p-2`,
            rectangular ? 'rounded-xl' : 'rounded-full',
            block ? 'w-full' : 'w-full max-w-max'
        ]">
        <Skeleton
            v-for="n in 4"
            :key="n"
            height="2.25rem"
            width="7rem"
            :border-radius="rectangular ? '0.375rem' : '9999px'"
            class="shrink-0"
            :class="block ? 'flex-1' : ''" />
    </div>
</template>
