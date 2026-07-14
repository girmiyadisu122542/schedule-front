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
        viewBox="0 0 24 24"
        fill="none"
        :stroke="props.stroke || 'currentColor'"
        :stroke-width="props.strokeWidth || 1.5"
        stroke-linecap="round"
        stroke-linejoin="round">
        <circle
            cx="8"
            cy="15"
            r="3" />

        <path d="M10.5 12.5L20 3" />

        <path d="M17 6H20V9" />
        <path d="M14 9H17V12" />
    </svg>
</template>
