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
        <path d="M8 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M14 20H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v1" />
        <circle
            cx="18"
            cy="17"
            r="4" />
        <path d="M18 15.5v1.5l1 1" />
    </svg>
</template>
