<script setup lang="ts">
import { computed } from 'vue';
import type { ApexOptions } from 'apexcharts';
import VueApexCharts from 'vue3-apexcharts';

import { useIsDark } from '@/composables/common/useIsDark';
import { baseChartOptions } from '@/config/chartTheme';

type ChartType = 'area' | 'line' | 'bar' | 'donut' | 'pie' | 'radialBar' | 'polarArea';
type ChartSeries = number[] | { name?: string; data: (number | null)[] }[];

const props = withDefaults(
    defineProps<{
        type: ChartType;
        series: ChartSeries;
        options?: ApexOptions;
        height?: number | string;
        width?: number | string;
    }>(),
    { height: 300, options: () => ({}) }
);

const { isDark } = useIsDark();

const merged = computed<ApexOptions>(() => {
    const base = baseChartOptions(isDark.value);
    const extra = props.options ?? {};
    return {
        ...base,
        ...extra,
        chart: { ...base.chart, ...(extra.chart ?? {}) },
        grid: { ...base.grid, ...(extra.grid ?? {}) },
        tooltip: { ...base.tooltip, ...(extra.tooltip ?? {}) }
    };
});
</script>

<template>
    <VueApexCharts
        :type="type"
        :height="height"
        :width="width"
        :options="merged"
        :series="series" />
</template>
