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
            d="M3.51953 8.99881C4.85962 5.22397 8.53418 2.78997 12.5327 3.02854C16.5313 3.26712 19.8903 6.1208 20.772 10.0282C21.6538 13.9356 19.8457 17.9553 16.337 19.8878C12.8284 21.8204 8.46469 21.2003 5.63341 18.3667" />
        <path d="M8.99878 15.0014L12 12.0001V6.99805" />
        <path d="M6.998 8.99898H2.99634V4.99731" />
    </svg>
</template>
