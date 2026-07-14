<script setup lang="ts">
import { computed, type Component } from 'vue';

import MoneyValue from '@/components/common/dashboard/MoneyValue.vue';
import ChartCard from '@/components/common/dashboard/ChartCard.vue';

const props = withDefaults(
    defineProps<{
        title: string;
        subtitle?: string;
        icon?: Component;
        rows: { label: string; value: number; color: string }[];
        currency?: string;
    }>(),
    { currency: 'ETB' }
);

const total = computed(() => props.rows.reduce((sum, row) => sum + Math.max(0, row.value), 0));
const widthOf = (value: number): string => `${total.value > 0 ? (Math.max(0, value) / total.value) * 100 : 0}%`;
</script>

<template>
    <ChartCard
        :title="title"
        :subtitle="subtitle"
        :icon="icon">
        <div class="bg-surface-subtle flex h-3 w-full overflow-hidden rounded-full">
            <div
                v-for="row in rows"
                :key="row.label"
                class="h-full"
                :style="{ width: widthOf(row.value), backgroundColor: row.color }"></div>
        </div>
        <div class="mt-5 grid grid-cols-2 gap-4">
            <div
                v-for="row in rows"
                :key="row.label"
                class="space-y-1">
                <span class="flex items-center gap-2">
                    <span
                        class="h-2.5 w-2.5 rounded-full"
                        :style="{ backgroundColor: row.color }"></span>
                    <span class="text-text-tertiary text-xs font-medium">{{ row.label }}</span>
                </span>
                <MoneyValue
                    :amount="row.value"
                    :bold="true" />
            </div>
        </div>
    </ChartCard>
</template>
