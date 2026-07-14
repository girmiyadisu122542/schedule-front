<script setup lang="ts">
import { computed, type Component } from 'vue';
import type { ApexOptions } from 'apexcharts';

import { formatMoney } from '@/utils/format';
import { compactNumber } from '@/config/chartTheme';

import ChartCard from '@/components/common/dashboard/ChartCard.vue';
import BrandChart from '@/components/common/dashboard/BrandChart.vue';

const props = withDefaults(
    defineProps<{
        title: string;
        subtitle?: string;
        icon?: Component;
        categories: string[];
        series: { name: string; data: number[] }[];
        colors: string[];
        currency?: string;
        height?: number;
        legend?: boolean;
    }>(),
    { currency: 'ETB', height: 300, legend: true }
);

const options = computed<ApexOptions>(() => ({
    chart: { type: 'area' },
    colors: props.colors,
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.32, opacityTo: 0.02, stops: [0, 95] } },
    xaxis: { categories: props.categories, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (value: number) => compactNumber(value) } },
    legend: { show: props.legend, position: 'top', horizontalAlign: 'right', markers: { strokeWidth: 0 } },
    tooltip: { y: { formatter: (value: number) => formatMoney(value, props.currency) } }
}));
</script>

<template>
    <ChartCard
        :title="title"
        :subtitle="subtitle"
        :icon="icon">
        <BrandChart
            type="area"
            :height="height"
            :options="options"
            :series="series" />
    </ChartCard>
</template>
