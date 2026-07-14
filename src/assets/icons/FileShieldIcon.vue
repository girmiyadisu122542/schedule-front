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
        <path d="M14 2H6a2 2 0 0 0-2 2v6" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M20 8v2" />
        <path d="M12 22c2.667-.8 4-3.067 4-5.6V13l-4-1.5-4 1.5v3.4c0 2.533 1.333 4.8 4 5.6Z" />
    </svg>
</template>
