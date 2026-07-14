<script setup lang="ts">
import { computed } from 'vue';

/**
 * Lightweight, dependency-free barcode renderer. It deterministically derives
 * vertical bars from the character codes of `value`, producing a stable
 * barcode-like visual without pulling in an external library.
 */
const props = withDefaults(
    defineProps<{
        value: string;
        height?: number;
        unit?: number;
        showValue?: boolean;
        monochrome?: boolean;
    }>(),
    {
        height: 64,
        unit: 2,
        showValue: false,
        monochrome: false
    }
);

const bars = computed<{ black: boolean; width: number }[]>(() => {
    const value = props.value || '';
    if (!value) return [];

    let bits = '';
    for (const char of value) {
        bits += char.charCodeAt(0).toString(2).padStart(8, '0');
    }

    const runs: { black: boolean; width: number }[] = [];
    let index = 0;
    while (index < bits.length) {
        const bit = bits[index];
        let run = 1;
        while (index + run < bits.length && bits[index + run] === bit) {
            run++;
        }
        runs.push({ black: bit === '1', width: run });
        index += run;
    }

    return runs;
});
</script>

<template>
    <div class="flex flex-col items-center">
        <div
            v-if="bars.length"
            class="flex items-stretch"
            :style="{ height: `${height}px` }"
            role="img"
            :aria-label="value">
            <span
                v-for="(bar, index) in bars"
                :key="index"
                :style="{
                    width: `${bar.width * unit}px`,
                    backgroundColor: bar.black && monochrome ? '#000000' : undefined
                }"
                :class="bar.black ? (monochrome ? '' : 'bg-black dark:bg-white') : 'bg-transparent'"></span>
        </div>
        <span
            v-if="showValue && value"
            class="text-schedule-text-secondary mt-2 text-sm tracking-widest">
            {{ value }}
        </span>
    </div>
</template>
