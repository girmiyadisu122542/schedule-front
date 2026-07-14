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
        :stroke="props.stroke || 'currentColor'"
        :stroke-width="props.strokeWidth || 1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24">
        <path d="M7.5 4V7" />
        <path d="M20.5 20L16.5 11L12.5 20" />
        <path d="M13.3901 18H19.6101" />
        <path d="M3.5 15C7.595 14.676 11.176 11.095 11.501 7H3.501" />
        <path d="M11.5 15C8.941 14.798 6.702 12.559 6.5 10" />
    </svg>
</template>
