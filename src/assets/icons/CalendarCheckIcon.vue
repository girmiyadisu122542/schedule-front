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
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2" />
        <path d="M3 10h18" />
        <path d="m9 16 2 2 4-4" />
    </svg>
</template>
