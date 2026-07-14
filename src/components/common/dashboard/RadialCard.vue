<script setup lang="ts">
import { computed, type Component } from 'vue';
import type { ApexOptions } from 'apexcharts';

import { formatMoney } from '@/utils/format';
import { SMART_PALETTE } from '@/config/chartTheme';
import { useIsDark } from '@/composables/common/useIsDark';

import ChartCard from '@/components/common/dashboard/ChartCard.vue';
import BrandChart from '@/components/common/dashboard/BrandChart.vue';
import MoneyValue from '@/components/common/dashboard/MoneyValue.vue';

const props = withDefaults(
    defineProps<{
        title: string;
        subtitle?: string;
        icon?: Component;
        items: { label: string; value: number }[];
        currency?: string;
        height?: number;
    }>(),
    { currency: 'ETB', height: 280 }
);

const { isDark } = useIsDark();
const top = computed(() => props.items.slice(0, 5));
const max = computed(() => Math.max(1, ...top.value.map((item) => item.value)));
const series = computed(() => top.value.map((item) => Math.round((item.value / max.value) * 100)));
const leader = computed(() => top.value[0]);

const options = computed<ApexOptions>(() => ({
    chart: { type: 'radialBar' },
    labels: top.value.map((item) => item.label),
    colors: SMART_PALETTE,
    plotOptions: {
        radialBar: {
            hollow: { size: '34%' },
            track: { background: isDark.value ? '#1E293B' : '#F3F4F6' },
            dataLabels: {
                name: { fontSize: '12px' },
                value: { fontSize: '14px', fontWeight: 600, formatter: (value: number) => `${Math.round(value)}%` },
                total: {
                    show: true,
                    label: leader.value?.label ?? '',
                    formatter: () => formatMoney(leader.value?.value ?? 0, props.currency)
                }
            }
        }
    }
}));
</script>

<template>
    <ChartCard
        :title="title"
        :subtitle="subtitle"
        :icon="icon">
        <div class="flex flex-col items-center gap-4 sm:flex-row">
            <BrandChart
                v-if="series.length > 0"
                type="radialBar"
                :height="height"
                :width="260"
                :options="options"
                :series="series" />
            <ul class="w-full flex-1 space-y-2.5">
                <li
                    v-for="(item, index) in top"
                    :key="item.label"
                    class="flex items-center justify-between gap-2 text-sm">
                    <span class="flex items-center gap-2">
                        <span
                            class="h-2.5 w-2.5 rounded-full"
                            :style="{
                                backgroundColor: SMART_PALETTE[index % SMART_PALETTE.length]
                            }"></span>
                        <span class="text-text-secondary">{{ item.label }}</span>
                    </span>
                    <MoneyValue
                        :amount="item.value"
                        :bold="true" />
                </li>
            </ul>
        </div>
    </ChartCard>
</template>
