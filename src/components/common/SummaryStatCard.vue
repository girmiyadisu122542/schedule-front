<script setup lang="ts">
import { computed, type Component } from 'vue';

interface Props {
    title: string;
    value: string | number;
    subtitle?: string;
    badge?: string;
    badgeVariant?: 'success' | 'error' | 'warning' | 'info';
    icon?: Component;
    variant?: 'primary' | 'success' | 'error' | 'info' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'primary',
});

const variantStyles = computed(() => {
    const maps = {
        success: { iconBg: 'bg-schedule-success-subtle', iconColor: 'text-schedule-icon-success' },
        error: { iconBg: 'bg-schedule-error-subtle', iconColor: 'text-schedule-icon-error' },
        info: { iconBg: 'bg-schedule-info-subtle', iconColor: 'text-schedule-icon-info' },
        warning: { iconBg: 'bg-schedule-warning-subtle', iconColor: 'text-schedule-icon-warning' },
        primary: { iconBg: 'bg-schedule-brand-blue-subtle', iconColor: 'text-schedule-icon-brand' },
    };
    return maps[props.variant] || maps.primary;
});

const badgeStyles = computed(() => {
    const maps = {
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return props.badgeVariant ? maps[props.badgeVariant] : maps.success;
});
</script>

<template>
    <div
        class="bg-schedule-surface-elevated dark:bg-schedule-dark flex min-w-60 flex-1 flex-col gap-3 rounded-[20px] border border-schedule-border-subtle px-6 py-5 dark:border-schedule-border-inverse">
        <div class="flex items-start justify-between">
            <span class="text-xs font-semibold uppercase tracking-widest text-schedule-text-secondary dark:text-gray-400">
                {{ title }}
            </span>
            <slot name="actions" />
        </div>

        <div class="flex items-end justify-between gap-2">
            <div class="flex flex-col gap-1">
                <h2 class="text-3xl font-bold tracking-tight text-schedule-text-primary dark:text-schedule-text-inverse">
                    {{ value }}
                </h2>
                <div
                    v-if="subtitle || badge"
                    class="flex items-center gap-2">
                    <span
                        v-if="subtitle"
                        class="text-sm text-schedule-text-secondary dark:text-gray-400">
                        {{ subtitle }}
                    </span>
                    <span
                        v-if="badge"
                        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                        :class="badgeStyles">
                        {{ badge }}
                    </span>
                </div>
            </div>
            <div
                v-if="icon"
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                :class="variantStyles.iconBg">
                <component
                    :is="icon"
                    class="h-7 w-7"
                    :class="variantStyles.iconColor" />
            </div>
        </div>
    </div>
</template>
