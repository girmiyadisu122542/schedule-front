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
        <path d="M4 10a7.31 7.31 0 0 0 10 10Z" />
        <path d="m9 15 3-3" />
        <path d="M17 13a6 6 0 0 0-6-6" />
        <path d="M21 13A10 10 0 0 0 11 3" />
    </svg>
</template>
