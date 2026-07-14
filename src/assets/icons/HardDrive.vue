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
            d="M22 12H2M2 12L5.45 5.11C5.61558 4.77679 5.87083 4.49637 6.18704 4.30028C6.50326 4.10419 6.86792 4.0002 7.24 4H16.76C17.1321 4.0002 17.4967 4.10419 17.813 4.30028C18.1292 4.49637 18.3844 4.77679 18.55 5.11L22 12V18C22 18.5304 21.7893 19.0391 21.4142 19.4142C21.0391 19.7893 20.5304 20 20 20H4C3.46957 20 2.96086 19.7893 2.58579 19.4142C2.21071 19.0391 2 18.5304 2 18V12ZM6 16H6.01M10 16H10.01" />
    </svg>
</template>
