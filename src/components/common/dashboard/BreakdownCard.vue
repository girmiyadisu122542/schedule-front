<script setup lang="ts">
import { computed, type Component } from 'vue';
import type { ApexOptions } from 'apexcharts';

import { formatMoney } from '@/utils/format';
import { compactNumber } from '@/config/chartTheme';
import type { BreakdownSlice } from '@/types/dashboard';

import ChartCard from '@/components/common/dashboard/ChartCard.vue';
import BrandChart from '@/components/common/dashboard/BrandChart.vue';
import MoneyValue from '@/components/common/dashboard/MoneyValue.vue';

const props = withDefaults(
    defineProps<{
        title: string;
        subtitle?: string;
        icon?: Component;
        items: BreakdownSlice[];
        kind?: 'money' | 'count';
        centerLabel?: string;
        variant?: 'donut' | 'polar';
        currency?: string;
        height?: number;
    }>(),
    { kind: 'money', variant: 'donut', currency: 'ETB', height: 250 }
);

const series = computed(() => props.items.map((slice) => (props.kind === 'money' ? slice.value : slice.count)));
const total = computed(() => series.value.reduce((sum, value) => sum + value, 0));

const options = computed<ApexOptions>(() => ({
    chart: { type: props.variant === 'polar' ? 'polarArea' : 'donut' },
    labels: props.items.map((slice) => slice.label),
    colors: props.items.map((slice) => slice.color),
    stroke: { width: props.variant === 'polar' ? 1 : 0 },
    fill: props.variant === 'polar' ? { opacity: 0.85 } : {},
    yaxis: props.variant === 'polar' ? { show: false } : {},
    legend: { show: false },
    plotOptions:
        props.variant === 'donut'
            ? {
                  pie: {
                      donut: {
                          size: '72%',
                          labels: {
                              show: true,
                              total: {
                                  show: true,
                                  label: props.centerLabel ?? '',
                                  formatter: () =>
                                      props.kind === 'money' ? compactNumber(total.value) : String(total.value)
                              }
                          }
                      }
                  }
              }
            : {},
    tooltip: {
        y: { formatter: (value: number) => (props.kind === 'money' ? formatMoney(value, props.currency) : `${value}`) }
    }
}));
</script>

<template>
    <ChartCard
        :title="title"
        :subtitle="subtitle"
        :icon="icon">
        <BrandChart
            v-if="total > 0"
            :type="variant === 'polar' ? 'polarArea' : 'donut'"
            :height="height"
            :options="options"
            :series="series" />
        <p
            v-else
            class="text-text-tertiary py-10 text-center text-sm">
            No data for this period
        </p>
        <ul class="mt-4 space-y-2">
            <li
                v-for="slice in items"
                :key="slice.code"
                class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2">
                    <span
                        class="h-2.5 w-2.5 rounded-full"
                        :style="{ backgroundColor: slice.color }"></span>
                    <span class="text-text-secondary">{{ slice.label }}</span>
                </span>
                <MoneyValue
                    v-if="kind === 'money'"
                    :amount="slice.value" />
                <span
                    v-else
                    class="text-text-primary font-semibold">
                    {{ slice.count }}
                </span>
            </li>
        </ul>
    </ChartCard>
</template>
