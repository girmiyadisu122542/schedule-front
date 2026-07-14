<script setup lang="ts">
const props = defineProps<{
    size?: number | string;
    stroke?: string;
    strokeWidth?: number | string;
}>();
</script>

<template>
    <svg
        :width="props.size || 24"
        :height="props.size || 24"
        viewBox="0 0 24 24"
        fill="none"
        :stroke="props.stroke || 'currentColor'"
        :stroke-width="props.strokeWidth || 1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="schedule-icon">
        <circle
            cx="11"
            cy="7"
            r="4" />

        <path d="M2.5 20v-1.5a6.5 4.5 0 0 1 5.5-4.5h1.5" />

        <rect
            x="13"
            y="13"
            width="8.5"
            height="8"
            rx="1.4" />

        <line
            x1="14"
            y1="16.6"
            x2="21"
            y2="16.5" />

        <line
            x1="17.5"
            y1="13"
            x2="17.5"
            y2="16.5" />
    </svg>
</template>
