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
        viewBox="0 0 20 20">
        <path d="M14.1667 2.5H17.5V5.83333" />
        <path d="M12.5 7.5L17.5 2.5" />
        <path d="M5.83333 17.5003H2.5V14.167" />
        <path d="M7.5 12.5L2.5 17.5" />
        <path d="M3.33334 9.16634V4.99967C3.33334 4.07884 4.07918 3.33301 5.00001 3.33301H9.16668" />
        <path d="M16.6667 10.833V14.9997C16.6667 15.9205 15.9208 16.6663 15 16.6663H10" />
    </svg>
</template>
