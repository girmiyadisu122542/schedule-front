<script setup lang="ts">
import { computed, type Component } from 'vue';

import { resolveStatusIconClass } from '@/utils/statusIcon';

interface Props {
    label: string;
    variant?: 'primary' | 'success' | 'error' | 'info' | 'warning' | 'light' | 'danger' | 'none';
    size?: 'sm' | 'md' | 'lg';
    labelText?: string;
    icon?: Component;
    outlined?: boolean;
    labelDirection?: 'left' | 'right';
    iconPosition?: 'before' | 'after';
    clickable?: boolean;
    color?: string;
    faIcon?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'primary',
    size: 'md',
    outlined: false,
    clickable: false
});

const variantClasses = computed(() => {
    // Solid badges keep their saturated brand color in both modes -- they read
    // fine on slate-900 cards.  warning + light get a subtle dark backdrop so
    // the high-saturation yellow / gray doesn't blow out on dark.
    const solid = {
        primary: 'bg-schedule-brand-blue text-schedule-text-on-brand',
        success: 'bg-schedule-success-500 text-white',
        error: 'bg-schedule-error-500 text-white',
        danger: 'bg-schedule-error-500 text-white',
        info: 'bg-schedule-info-500 text-white',
        warning: 'bg-schedule-warning-500 text-schedule-text-on-warning dark:bg-schedule-warning-500/85',
        light: 'bg-gray-500 text-white dark:bg-gray-700 dark:text-gray-100',
        none: 'bg-surface-subtle text-text-tertiary'
    };

    // Outlined / subtle badges -- light mode uses the existing pastel
    // backdrop, dark mode uses a low-alpha tint of the variant color
    // (e.g. bg-schedule-success-500/15) plus a light, readable text color
    // (e.g. text-schedule-success-300).  Same approach HomeView.vue uses
    // for its feature-card chips (dark:bg-blue-500/20 dark:text-blue-300).
    const subtle = {
        primary:
            'bg-schedule-brand-blue-subtle text-schedule-text-brand-primary dark:bg-schedule-brand-blue/20 dark:text-schedule-text-brand-secondary',
        success:
            'bg-schedule-success-subtle text-schedule-text-success dark:bg-schedule-success-500/15 dark:text-schedule-success-300',
        error: 'bg-schedule-error-subtle text-schedule-text-error dark:bg-schedule-error-500/15 dark:text-schedule-error-300',
        danger: 'bg-schedule-error-subtle text-schedule-text-error dark:bg-schedule-error-500/15 dark:text-schedule-error-300',
        info: 'bg-schedule-info-subtle text-schedule-text-info dark:bg-schedule-info-500/15 dark:text-schedule-info-300',
        warning:
            'bg-schedule-warning-subtle text-schedule-text-warning dark:bg-schedule-warning-500/15 dark:text-schedule-warning-300',
        light: 'bg-schedule-tertiary text-schedule-text-tertiary dark:bg-surface-subtle dark:text-text-secondary',
        none: 'bg-surface-subtle text-text-tertiary'
    };

    return props.outlined ? subtle[props.variant] : solid[props.variant];
});

const sizeClasses = computed(() => {
    switch (props.size) {
        case 'sm':
            return 'text-xs px-2 py-0.5 gap-1';
        case 'lg':
            return 'text-sm px-3 py-1.5 gap-2';
        default:
            return 'text-xs px-2.5 py-1 gap-1.5';
    }
});

const customStyle = computed(() => {
    if (!props.color) return {};

    // Outlined + color => tinted status pill: low-opacity color background with the
    // color itself as the text/icon (same concept as the status pill button).
    if (props.outlined) {
        return {
            backgroundColor: `${props.color}2A`,
            color: props.color
        };
    }

    return {
        backgroundColor: props.color,
        color: '#fff'
    };
});

const hasFaIcon = computed(() => !!props.faIcon);
const resolvedFaIcon = computed(() => resolveStatusIconClass(props.faIcon));

const clickableClass = props.clickable ? 'cursor-pointer' : '';
</script>

<template>
    <div
        :class="[
            labelDirection === 'right'
                ? 'flex flex-col-reverse gap-4 sm:flex-row-reverse'
                : 'flex flex-col gap-4 sm:flex-row'
        ]">
        <span
            v-if="props.labelText"
            class="mr-2 text-gray-500">
            {{ props.labelText }}
        </span>
        <span
            class="inline-flex items-center rounded-full font-medium"
            :class="[variantClasses, sizeClasses, clickableClass]"
            :style="customStyle">
            <component
                v-if="icon && iconPosition === 'before'"
                :is="icon"
                class="h-3.5 w-3.5" />
            <i
                v-else-if="faIcon && iconPosition === 'before'"
                :class="resolvedFaIcon" />

            {{ label }}

            <component
                v-if="icon && iconPosition === 'after'"
                :is="icon"
                class="h-3.5 w-3.5" />
            <i
                v-else-if="faIcon && iconPosition === 'after'"
                :class="resolvedFaIcon" />
        </span>
    </div>
</template>
