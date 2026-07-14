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
        <rect
            x="2"
            y="2"
            width="20"
            height="8"
            rx="2" />
        <rect
            x="2"
            y="14"
            width="20"
            height="8"
            rx="2" />
        <line
            x1="6"
            x2="6.01"
            y1="6"
            y2="6" />
        <line
            x1="6"
            x2="6.01"
            y1="18"
            y2="18" />
    </svg>
</template>
