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
        <path d="M10 20C6.686 20 4 17.314 4 14" />
        <path d="M14 4C17.314 4 20 6.686 20 10" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8 10H5C3.895 10 3 9.105 3 8V5C3 3.895 3.895 3 5 3H8C9.105 3 10 3.895 10 5V8C10 9.105 9.105 10 8 10Z" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M19 21H16C14.895 21 14 20.105 14 19V16C14 14.895 14.895 14 16 14H19C20.105 14 21 14.895 21 16V19C21 20.105 20.105 21 19 21Z" />
    </svg>
</template>
