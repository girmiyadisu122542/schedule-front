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
            x="2"
            y="2"
            width="5"
            height="5"
            rx="1" />
        <rect
            x="17"
            y="2"
            width="5"
            height="5"
            rx="1" />
        <rect
            x="2"
            y="17"
            width="5"
            height="5"
            rx="1" />
        <rect
            x="17"
            y="17"
            width="5"
            height="5"
            rx="1" />
        <path d="M7 4.5h10" />
        <path d="M7 19.5h10" />
        <path d="M4.5 7v10" />
        <path d="M19.5 7v10" />
    </svg>
</template>
