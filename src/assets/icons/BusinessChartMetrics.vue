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
        :stroke-width="props.strokeWidth || 2"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24">
        <path d="M16 9V7H14" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5.778 3H18.222C19.204 3 20 3.895 20 5V19C20 20.105 19.204 21 18.222 21H5.778C4.796 21 4 20.105 4 19V5C4 3.895 4.796 3 5.778 3Z" />
        <path d="M8 13.5H16" />
        <path d="M8 17H12" />
        <path d="M16 7L13 10L10.286 8L8 10" />
    </svg>
</template>
