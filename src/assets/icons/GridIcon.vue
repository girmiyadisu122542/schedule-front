<script setup>
defineProps({
    size: {
        type: [Number, String],
        default: 1
    },
    unit: {
        type: String,
        default: 'rem'
    },
    color: {
        type: String,
        default: 'currentColor'
    }
});
</script>

<template>
    <svg
        :style="{
            width: size + unit,
            height: size + unit
        }"
        viewBox="0 0 15 15"
        fill="none"
        :stroke="color"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path
            d="M5.5 0.5H1.5C0.947715 0.5 0.5 0.947715 0.5 1.5V5.5C0.5 6.05228 0.947715 6.5 1.5 6.5H5.5C6.05228 6.5 6.5 6.05228 6.5 5.5V1.5C6.5 0.947715 6.05228 0.5 5.5 0.5Z" />
        <path
            d="M13.5 0.5H9.5C8.94772 0.5 8.5 0.947715 8.5 1.5V5.5C8.5 6.05228 8.94772 6.5 9.5 6.5H13.5C14.0523 6.5 14.5 6.05228 14.5 5.5V1.5C14.5 0.947715 14.0523 0.5 13.5 0.5Z" />
        <path
            d="M13.5 8.5H9.5C8.94772 8.5 8.5 8.94772 8.5 9.5V13.5C8.5 14.0523 8.94772 14.5 9.5 14.5H13.5C14.0523 14.5 14.5 14.0523 14.5 13.5V9.5C14.5 8.94772 14.0523 8.5 13.5 8.5Z" />
        <path
            d="M5.5 8.5H1.5C0.947715 8.5 0.5 8.94772 0.5 9.5V13.5C0.5 14.0523 0.947715 14.5 1.5 14.5H5.5C6.05228 14.5 6.5 14.0523 6.5 13.5V9.5C6.5 8.94772 6.05228 8.5 5.5 8.5Z" />
    </svg>
</template>
