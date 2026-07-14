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
        <path
            d="M21 9.90055V8.70044C21 7.59256 20.3894 6.57485 19.4119 6.05344L13.4119 2.85302C12.5295 2.38233 11.4705 2.38233 10.5881 2.85302L4.58809 6.05344C3.61057 6.57485 2.99999 7.59256 3 8.70044V19C3 20.1046 3.89543 21 5 21H11" />
        <path d="M12.0018 13H8C7.44772 13 7 13.4477 7 14V21" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M17 21H15C14.4477 21 14 20.5523 14 20V18C14 17.4477 14.4477 17 15 17H17C17.5523 17 18 17.4477 18 18V20C18 20.5523 17.5523 21 17 21Z" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M21 21H19C18.4477 21 18 20.5523 18 20V18C18 17.4477 18.4477 17 19 17H21C21.5523 17 22 17.4477 22 18V20C22 20.5523 21.5523 21 21 21Z" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M19 17H17C16.4477 17 16 16.5523 16 16V14C16 13.4477 16.4477 13 17 13H19C19.5523 13 20 13.4477 20 14V16C20 16.5523 19.5523 17 19 17Z" />
        <path d="M11 17H7" />
        <path d="M10 9H14" />
    </svg>
</template>
