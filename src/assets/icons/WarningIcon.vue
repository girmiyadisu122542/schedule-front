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
        class="h-10 w-10 text-gray-400"
        :width="props.size || 24"
        :height="props.size || 24"
        fill="none"
        :stroke="props.stroke || props.color || 'currentColor'"
        :stroke-width="props.strokeWidth || 1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24">
        <path d="M10.29 3.86l-7.4 12.8A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.71-3.34l-7.4-12.8a2 2 0 0 0-3.42 0z" />

        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
</template>
