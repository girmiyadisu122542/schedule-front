<script setup lang="ts">
const props = defineProps<{
    size?: number | string;
    stroke?: string;
    strokeWidth?: number | string;
}>();
</script>

<template>
    <svg
        :width="props.size || 16"
        :height="props.size || 16"
        viewBox="0 0 32 32"
        fill="none"
        :stroke="props.stroke || 'currentColor'"
        :stroke-width="props.strokeWidth || 2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="goods-carrier-icon">
        <path d="M14 30 L9 9 Q9 8 5 9" />

        <line
            x1="14"
            y1="28"
            x2="30"
            y2="24" />

        <circle
            cx="14"
            cy="28"
            r="3"
            fill="white" />

        <rect
            x="16"
            y="10"
            width="12"
            height="12"
            rx="3"
            transform="rotate(-12 22 16)" />
    </svg>
</template>
