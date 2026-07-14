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
        <path d="M12 12.5s-3-2-3-4a1.5 1.5 0 0 1 3-1 1.5 1.5 0 0 1 3 1c0 2-3 4-3 4Z" />
        <path d="M2 15h2.5a2 2 0 0 1 1.3.5l2 1.7a2 2 0 0 0 1.3.5H15a2 2 0 0 1 0 4H8" />
        <path d="M2 15v6" />
    </svg>
</template>
