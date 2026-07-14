<script setup lang="ts">
import type { Component } from 'vue';

import MoneyValue from '@/components/common/dashboard/MoneyValue.vue';
import ChartCard from '@/components/common/dashboard/ChartCard.vue';

interface RankedItem {
    id: number | string;
    title: string;
    subtitle?: string;
    value: number;
}

withDefaults(
    defineProps<{ title: string; subtitle?: string; icon?: Component; items: RankedItem[]; showAvatar?: boolean }>(),
    { showAvatar: false }
);

const initials = (name: string): string =>
    name
        .split(' ')
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
</script>

<template>
    <ChartCard
        :title="title"
        :subtitle="subtitle"
        :icon="icon">
        <ul class="space-y-3">
            <li
                v-for="(item, index) in items"
                :key="item.id"
                class="flex items-center justify-between gap-3">
                <span class="flex min-w-0 items-center gap-2.5">
                    <span
                        v-if="showAvatar"
                        class="bg-schedule-brand-blue-subtle text-schedule-icon-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                        {{ initials(item.title) }}
                    </span>
                    <span
                        v-else
                        class="text-text-tertiary w-5 shrink-0 text-center text-xs font-bold">
                        {{ index + 1 }}
                    </span>
                    <span class="min-w-0">
                        <span class="text-text-primary block truncate text-sm font-medium">{{ item.title }}</span>
                        <span
                            v-if="item.subtitle"
                            class="text-text-tertiary text-xs">
                            {{ item.subtitle }}
                        </span>
                    </span>
                </span>
                <MoneyValue
                    :amount="item.value"
                    :bold="true" />
            </li>
        </ul>
    </ChartCard>
</template>
