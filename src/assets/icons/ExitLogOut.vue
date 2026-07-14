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
        <path d="M15 12H3" />
        <path
            d="M3.94678 16C5.41978 18.961 8.46778 21 11.9998 21C16.9708 21 20.9998 16.971 20.9998 12C20.9998 7.029 16.9708 3 11.9998 3C8.46778 3 5.41978 5.039 3.94678 8" />
        <path d="M12 9L15 12L12 15" />
    </svg>
</template>
