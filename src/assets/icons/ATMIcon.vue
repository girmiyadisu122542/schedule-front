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
        <path d="M17 20H7V7H17V20" />
        <path d="M10 10H14" />
        <path d="M14 13H10" />
        <path d="M10 16H13" />
        <path
            d="M17 11H19C20.105 11 21 10.105 21 9V5C21 3.895 20.105 3 19 3H5C3.895 3 3 3.895 3 5V9C3 10.105 3.895 11 5 11H7" />
    </svg>
</template>
