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
            cx="12"
            cy="12"
            r="9" />
        <line
            x1="12"
            y1="8"
            x2="12"
            y2="13" />
        <line
            x1="12"
            y1="16.5"
            x2="12.01"
            y2="16.5" />
    </svg>
</template>
