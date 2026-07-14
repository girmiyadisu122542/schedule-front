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
        <path d="M8.6 3.3999L5 6.9999L8.6 10.5999" />
        <path d="M19 7H5" />
        <path d="M15.3999 20.5999L18.9999 16.9999L15.3999 13.3999" />
        <path d="M5 17H19" />
    </svg>
</template>
