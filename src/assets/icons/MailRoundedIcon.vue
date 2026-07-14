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
        <rect
            x="3"
            y="4.5"
            width="18"
            height="15"
            rx="4" />
        <path d="M7 8.98438L11.2046 10.8176C11.7124 11.039 12.2893 11.0399 12.7978 10.82L17 9.00299" />
    </svg>
</template>
