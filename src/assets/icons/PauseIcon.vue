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
            x="14"
            y="4"
            width="4"
            height="16"
            rx="1" />
        <rect
            x="6"
            y="4"
            width="4"
            height="16"
            rx="1" />
    </svg>
</template>
