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
        <path d="M21 15V19C21 20.1046 20.1046 21 19 21H16" />
        <path d="M3 9V5C3 3.89543 3.89543 3 5 3H8" />
        <rect
            x="3"
            y="12"
            width="10"
            height="9"
            rx="2" />
        <path d="M14 6C14 7.10457 14.8954 8 16 8C17.1046 8 18 7.10457 18 6" />
        <path d="M6 15C6 16.1046 6.89543 17 8 17C9.10457 17 10 16.1046 10 15" />
        <path d="M11 9V5C11 3.89543 11.8954 3 13 3H19C20.1046 3 21 3.89543 21 5V10C21 11.1046 20.1046 12 19 12H16" />
    </svg>
</template>
