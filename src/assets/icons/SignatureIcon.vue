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
        <path d="M4 18c2.5 0 3-9 5.5-9 1.5 0 1.5 5 3 5 1.2 0 1.5-3 3-3 1.3 0 1.7 2 3.5 2" />
        <path d="M3 21.5h18" />
    </svg>
</template>
