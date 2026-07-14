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
        viewBox="0 0 24 24">
        <path
            fill="none"
            :stroke="props.stroke || 'currentColor'"
            :stroke-width="props.strokeWidth || 1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.553 15.553a7.06 7.06 0 1 0-9.985-9.985a7.06 7.06 0 0 0 9.985 9.985m0 0L20 20" />
    </svg>
</template>
