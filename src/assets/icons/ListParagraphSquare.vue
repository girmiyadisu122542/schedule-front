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
        <path d="M12 5H20" />
        <rect
            x="4"
            y="3"
            width="4"
            height="4"
            rx="1" />
        <path d="M12 12H20" />
        <rect
            x="4"
            y="10"
            width="4"
            height="4"
            rx="1" />
        <path d="M12 19H20" />
        <rect
            x="4"
            y="17"
            width="4"
            height="4"
            rx="1" />
    </svg>
</template>
