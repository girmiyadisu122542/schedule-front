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
        <rect
            x="2.99609"
            y="2.99622"
            width="18.0075"
            height="18.0075"
            rx="2" />
        <path d="M8.99826 21.0037V2.99622" />
        <path d="M15.0002 21.0037V2.99622" />
        <path d="M2.99609 8.99874H21.0036" />
        <path d="M2.99609 15.0012H21.0036" />
    </svg>
</template>
