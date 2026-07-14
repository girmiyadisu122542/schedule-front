<script setup lang="ts">
const props = defineProps<{
    size?: number | string;
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
        <rect
            x="3"
            y="9"
            width="18"
            height="12"
            rx="1.5" />
        <path d="M7 9V5a1 1 0 0 1 1-1h4l4 4v1" />
        <path d="M7 13h2" />
        <path d="M7 16.5h2" />
        <path d="M12.5 13.5h4.5" />
    </svg>
</template>
