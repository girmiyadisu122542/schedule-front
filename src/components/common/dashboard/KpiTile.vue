<script setup lang="ts">
import { computed, type Component } from 'vue';

import type { DashboardMetric, MetricTone } from '@/types/dashboard';
import ChevronArrowUp from '@/assets/icons/ChevronArrowUp.vue';
import ChevronArrowDown from '@/assets/icons/ChevronArrowDown.vue';

const props = withDefaults(defineProps<{ metric: DashboardMetric; icon: Component; size?: 'sm' | 'md' }>(), {
    size: 'md'
});

const CHIP: Record<MetricTone, string> = {
    brand: 'bg-schedule-brand-blue-subtle text-schedule-icon-brand',
    success: 'bg-schedule-success-subtle text-schedule-icon-success',
    info: 'bg-schedule-info-subtle text-schedule-icon-info',
    warning: 'bg-schedule-warning-subtle text-schedule-icon-warning',
    danger: 'bg-schedule-error-subtle text-schedule-icon-error',
    accent: 'bg-schedule-accent-primary-subtle-default text-schedule-accent-primary-fill-default',
    neutral: 'bg-surface-subtle text-text-tertiary'
};

const ui = computed(() =>
    props.size === 'sm'
        ? {
              pad: 'p-3',
              chip: 'h-8 w-8 rounded-lg',
              chipIcon: 'h-4 w-4',
              label: 'mt-2 text-xs',
              value: 'mt-0.5 text-base'
          }
        : {
              pad: 'p-5',
              chip: 'h-12 w-12 rounded-xl',
              chipIcon: 'h-6 w-6',
              label: 'mt-4 text-sm',
              value: 'mt-1 text-2xl'
          }
);

const deltaClass = computed(() => {
    if (props.metric.trend === 'up') return 'text-schedule-success-strong bg-schedule-success-subtle';
    if (props.metric.trend === 'down') return 'text-schedule-error-strong bg-schedule-error-subtle';
    return 'text-text-muted bg-surface-subtle';
});
</script>

<template>
    <div
        class="schedule-card transition-shadow duration-200 hover:shadow-md"
        :class="ui.pad">
        <div class="flex items-center justify-between gap-2">
            <span
                class="flex shrink-0 items-center justify-center"
                :class="[ui.chip, CHIP[metric.tone]]">
                <component
                    :is="icon"
                    :class="ui.chipIcon" />
            </span>
            <span
                v-if="metric.trend !== 'flat'"
                class="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold"
                :class="deltaClass">
                <component
                    :is="metric.trend === 'down' ? ChevronArrowDown : ChevronArrowUp"
                    class="h-3 w-3" />
                {{ Math.abs(metric.delta_percent) }}%
            </span>
        </div>
        <p
            class="text-text-tertiary font-medium"
            :class="ui.label">
            {{ metric.label }}
        </p>
        <p
            class="text-text-primary font-bold tracking-tight"
            :class="ui.value">
            {{ metric.formatted }}
        </p>
    </div>
</template>
