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
        :stroke-width="props.strokeWidth || 2"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24">
        <path
            d="M6 16H5C3.61929 16 2.5 14.8807 2.5 13.5V6.5C2.5 5.11929 3.61929 4 5 4H16C17.3807 4 18.5 5.11929 18.5 6.5V8" />
        <rect
            x="6.5"
            y="8"
            width="15"
            height="12"
            rx="2.5" />
        <path d="M6.5 12H21.5" />
        <path d="M12 16H10" />
    </svg>
</template>
