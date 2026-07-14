<script setup lang="ts">
import { computed, type Component } from 'vue';
import type { ApexOptions } from 'apexcharts';

import { formatMoney } from '@/utils/format';
import { compactNumber, BRAND_PRIMARY, SMART_PALETTE } from '@/config/chartTheme';

import ChartCard from '@/components/common/dashboard/ChartCard.vue';
import BrandChart from '@/components/common/dashboard/BrandChart.vue';

const props = withDefaults(
    defineProps<{
        title: string;
        subtitle?: string;
        icon?: Component;
        categories: string[];
        data: number[];
        seriesName?: string;
        horizontal?: boolean;
        distributed?: boolean;
        colors?: string[];
        kind?: 'money' | 'count';
        currency?: string;
        height?: number;
        dataLabels?: boolean;
    }>(),
    {
        seriesName: 'Value',
        horizontal: false,
        distributed: false,
        kind: 'money',
        currency: 'ETB',
        height: 280,
        dataLabels: false
    }
);

const series = computed(() => [{ name: props.seriesName, data: props.data }]);
const palette = computed(() => props.colors ?? (props.distributed ? SMART_PALETTE : [BRAND_PRIMARY]));

const options = computed<ApexOptions>(() => ({
    chart: { type: 'bar' },
    colors: palette.value,
    plotOptions: {
        bar: {
            horizontal: props.horizontal,
            distributed: props.distributed,
            borderRadius: 6,
            columnWidth: '52%',
            barHeight: '62%'
        }
    },
    dataLabels: props.dataLabels
        ? {
              enabled: true,
              textAnchor: props.horizontal ? 'end' : 'middle',
              offsetX: props.horizontal ? -8 : 0,
              style: { fontSize: '11px', fontWeight: 600, colors: ['#fff'] },
              formatter: (value: number) => compactNumber(Number(value))
          }
        : { enabled: false },
    xaxis: props.horizontal
        ? { categories: props.categories, labels: { formatter: (value: string) => compactNumber(Number(value)) } }
        : { categories: props.categories, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: props.horizontal ? {} : { labels: { formatter: (value: number) => compactNumber(value) } },
    legend: { show: false },
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
            type="bar"
            :height="height"
            :options="options"
            :series="series" />
    </ChartCard>
</template>
