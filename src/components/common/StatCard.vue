<script setup lang="ts">
import { computed, type Component } from 'vue';
import ActionMenu, { type ActionOption } from '@/components/common/ActionMenu.vue';

interface Props {
    title?: string;
    value: string | number;
    icon?: Component;
    options?: ActionOption[];
    iconSize?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'success' | 'error' | 'info' | 'warning';
    titlePosition?: 'top' | 'bottom';
    needBorderStyle?: boolean;
    needPaddingY?: boolean;
    valueSize?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'primary',
    titlePosition: 'top',
    iconSize: 'md',
    needBorderStyle: true,
    needPaddingY: true,
    valueSize: 'lg'
});

const variantStyles = computed(() => {
    const maps = {
        success: { iconBg: 'bg-schedule-success-subtle', iconColor: 'text-schedule-icon-success' },
        error: { iconBg: 'bg-schedule-error-subtle', iconColor: 'text-schedule-icon-error' },
        info: { iconBg: 'bg-schedule-info-subtle', iconColor: 'text-schedule-icon-info' },
        warning: { iconBg: 'bg-schedule-warning-subtle', iconColor: 'text-schedule-icon-warning' },
        primary: { iconBg: 'bg-schedule-brand-blue-subtle', iconColor: 'text-schedule-icon-brand' }
    };
    return maps[props.variant] || maps.primary;
});

const iconSizeVariants = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-14 w-14'
};

const valueSizeVariants = {
    sm: 'text-sm',
    md: 'text-md',
    lg: 'text-3xl'
};
</script>

<template>
    <div
        class="bg-schedule-surface-elevated dark:bg-schedule-dark flex min-w-60 flex-1 items-center justify-between gap-4 rounded-[20px] px-6 py-0 transition-all duration-200 relative"
        :class="[
            needBorderStyle ? 'border-schedule-border-subtle dark:border-schedule-border-inverse border' : '',
            needPaddingY ? 'py-6' : ''
        ]">
        <div
            class="flex flex-col justify-center"
            :class="titlePosition === 'bottom' ? 'flex-col-reverse' : 'flex-col'">
            <span class="text-schedule-text-secondary text-sm font-medium dark:text-gray-400">
                {{ title }}
            </span>
            <h2
                class="text-schedule-text-primary dark:text-schedule-text-inverse font-bold tracking-tight"
                :class="[titlePosition === 'top' ? 'mt-1' : 'mb-1', valueSizeVariants[valueSize || 'lg']]">
                {{ value }}
            </h2>
        </div>

        <div
            v-if="icon"
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            :class="variantStyles.iconBg">
            <component
                :is="icon"
                :class="[variantStyles.iconColor, iconSizeVariants[iconSize || 'md']]" />
        </div>
        <div 
            v-if="options">
            <div class="absolute top-2 right-2 flex flex-col justify-center">
                <action-menu 
                    :options="options"/>
            </div>
        </div>
    </div>
</template>
