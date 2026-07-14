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
        <path d="M9 2v4" />
        <path d="M15 2v4" />
        <path d="M7 6h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5z" />
        <path d="M12 14v3" />
        <circle
            cx="18.5"
            cy="18.5"
            r="3.5" />
        <path d="m17.2 17.2 2.6 2.6" />
        <path d="m19.8 17.2-2.6 2.6" />
    </svg>
</template>
