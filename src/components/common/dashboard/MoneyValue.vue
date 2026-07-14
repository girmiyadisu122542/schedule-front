<script setup lang="ts">
import { computed } from 'vue';
import { formatMoney } from '@/utils/format';

const props = withDefaults(
    defineProps<{
        amount: number | null | undefined;
        currency?: string;
        muted?: boolean;
        bold?: boolean;
        signed?: boolean;
    }>(),
    { currency: 'ETB', muted: false, bold: false, signed: false }
);

const text = computed(() => {
    const value = Number(props.amount ?? 0);
    const formatted = formatMoney(Math.abs(value), props.currency);
    if (props.signed && value !== 0) return `${value < 0 ? '-' : '+'} ${formatted}`;
    return formatMoney(value, props.currency);
});
</script>

<template>
    <span
        class="whitespace-nowrap tabular-nums"
        :class="[bold ? 'font-semibold' : '', muted ? 'text-text-tertiary' : 'text-text-primary']">
        {{ text }}
    </span>
</template>
