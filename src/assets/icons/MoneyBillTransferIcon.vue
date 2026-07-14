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
            y="6"
            width="20"
            height="12"
            rx="2" />
        <path d="M7 10h8" />
        <path d="m13 8 2 2-2 2" />
        <path d="M17 14H9" />
        <path d="m11 12-2 2 2 2" />
    </svg>
</template>
