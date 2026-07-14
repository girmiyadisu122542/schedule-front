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
        viewBox="0 0 20 20"
        fill="none">
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M2.5 17.5L2.5 14.1667L17.5 14.1667L17.5 17.5L2.5 17.5Z"
            stroke="#737373"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M2.5 11.666L2.5 8.33268L12.7633 8.33268L12.7633 11.666L2.5 11.666Z"
            stroke="#737373"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M2.5 5.83398L2.5 2.50065L8.02667 2.50065L8.02667 5.83398L2.5 5.83398Z"
            stroke="#737373"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round" />
    </svg>
</template>
