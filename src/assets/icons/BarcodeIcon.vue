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
        :stroke="props.stroke || props.color || 'currentColor'"
        :stroke-width="props.strokeWidth || 1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24">
        <path d="M4 6v12" />
        <path d="M7 6v12" />
        <path d="M9 6v12" />
        <path d="M13 6v12" />
        <path d="M16 6v12" />
        <path d="M18 6v12" />
        <path d="M20 6v12" />
    </svg>
</template>
