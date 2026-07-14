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
        <circle
            cx="18"
            cy="5"
            r="3" />
        <circle
            cx="6"
            cy="12"
            r="3" />
        <circle
            cx="18"
            cy="19"
            r="3" />
        <line
            x1="8.59"
            y1="13.51"
            x2="15.42"
            y2="17.49" />
        <line
            x1="15.41"
            y1="6.51"
            x2="8.59"
            y2="10.49" />
    </svg>
</template>
