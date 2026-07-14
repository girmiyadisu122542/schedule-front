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
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10 10.6973H14C14.55 10.6973 15 11.1473 15 11.6973V14.7503C15 15.3023 14.552 15.7503 14 15.7503H10C9.448 15.7503 9 15.3023 9 14.7503V11.6973C9 11.1453 9.448 10.6973 10 10.6973Z" />
        <path
            d="M10.3159 10.697V9.434C10.3159 8.504 11.0699 7.75 11.9999 7.75C12.9299 7.75 13.6839 8.504 13.6839 9.434V10.695" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.11084 14.469V9.531C3.11084 7.949 3.95184 6.486 5.31984 5.69L9.76384 3.103C11.1458 2.299 12.8528 2.299 14.2348 3.103L18.6798 5.69C20.0478 6.486 20.8888 7.949 20.8888 9.531V14.469C20.8888 16.051 20.0478 17.514 18.6798 18.31L14.2358 20.897C12.8538 21.701 11.1468 21.701 9.76484 20.897L5.31984 18.31C3.95184 17.514 3.11084 16.051 3.11084 14.469Z" />
    </svg>
</template>
