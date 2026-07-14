<script setup lang="ts">
const props = defineProps<{
    size?: number | string;
    color?: string;
    stroke?: string;
    strokeWidth?: number | string;
}>();
</script>

<template>
    <svg
        :width="props.size || 24"
        :height="props.size || 24"
        fill="none"
        :stroke="props.stroke || props.color || 'currentColor'"
        :stroke-width="props.strokeWidth || 1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24">
        <path d="M4 10v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10" />
        <path
            d="M2 9.5 4.6 4.4A1 1 0 0 1 5.5 4h13a1 1 0 0 1 .9.4L22 9.5a3 3 0 0 1-5 1.6A3 3 0 0 1 12 12.5a3 3 0 0 1-5-1.4A3 3 0 0 1 2 9.5Z" />
        <path d="m3 3 18 18" />
    </svg>
</template>
