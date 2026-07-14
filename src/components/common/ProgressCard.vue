<script setup lang="ts">
import { computed } from 'vue';
import MainBadge from '@/components/common/MainBadge.vue';

interface Props {
    title: string;
    startDate?: string;
    endDate?: string;
    value?: number;
    max?: number;
    statusLabel?: string;
    statusSeverity?: 'success' | 'danger' | 'info' | 'primary' | 'secondary' | 'warn' | 'contrast';
    activeColor?: string;
    // Optional props if you don't want to use slots
    leftLabel?: string;
    rightLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
    max: 100,
    activeColor: 'bg-red-500',
    statusSeverity: 'success'
});

const progressData = computed(() => {
    if (props.startDate && props.endDate) {
        const start = new Date(props.startDate).getTime();
        const end = new Date(props.endDate).getTime();
        const now = Date.now();

        if (isNaN(start) || isNaN(end) || end <= start) {
            return {
                percentage: 0,
                status: 'Invalid Date',
                severity: 'warn' as Props['statusSeverity']
            };
        }

        if (now < start) {
            return {
                percentage: 0,
                status: props.statusLabel || 'Not Started',
                severity: 'info' as Props['statusSeverity']
            };
        }

        if (now >= end) {
            return {
                percentage: 100,
                status: props.statusLabel || 'Expired',
                severity: 'danger' as Props['statusSeverity']
            };
        }

        const pct = ((now - start) / (end - start)) * 100;

        return {
            percentage: Math.floor(pct),
            status: props.statusLabel || 'Active',
            severity: props.statusSeverity || 'success'
        };
    }

    const pct = Math.max(0, Math.min(100, ((props.value || 0) / props.max) * 100));

    return {
        percentage: pct,
        status: props.statusLabel,
        severity: props.statusSeverity
    };
});
</script>

<template>
    <div class="dark:bg-schedule-dark w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-center justify-between">
            <h3 class="text-schedule-text-secondary text-sm font-medium">{{ title }}</h3>
            <MainBadge
                v-if="progressData.status"
                :value="progressData.status"
                :severity="progressData.severity" />
        </div>

        <div class="relative mb-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
                class="h-full rounded-full transition-all duration-1000 ease-out"
                :class="activeColor"
                :style="{ width: `${progressData.percentage}%` }"></div>
        </div>

        <div class="text-schedule-text-tertiary flex justify-between text-xs font-normal">
            <div>
                <slot name="left-footer">
                    {{ leftLabel || (startDate ? `${$lang.subscribedOn}: ${startDate}` : '') }}
                </slot>
            </div>

            <div>
                <slot name="right-footer">
                    {{ rightLabel || (endDate ? `${$lang.expireIn}: ${endDate}` : '') }}
                </slot>
            </div>
        </div>
    </div>
</template>
