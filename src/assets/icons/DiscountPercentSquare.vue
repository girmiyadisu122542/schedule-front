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
        <path d="M9.32812 14.6713L14.6704 9.3291" />
        <path
            d="M14.9111 14.4838C15.0256 14.602 15.0235 14.7902 14.9066 14.9059C14.7897 15.0216 14.6014 15.0216 14.4844 14.9059C14.3675 14.7902 14.3655 14.602 14.4799 14.4838C14.5365 14.4254 14.6143 14.3925 14.6955 14.3925C14.7768 14.3925 14.8546 14.4254 14.9111 14.4838" />
        <path
            d="M9.51951 9.08536C9.63396 9.20353 9.63195 9.3918 9.515 9.5075C9.39806 9.6232 9.20978 9.6232 9.09283 9.5075C8.97589 9.3918 8.97388 9.20353 9.08833 9.08536C9.14486 9.02698 9.22266 8.99403 9.30392 8.99403C9.38518 8.99403 9.46297 9.02698 9.51951 9.08536" />
        <rect
            x="2.99609"
            y="2.99609"
            width="18.0075"
            height="18.0075"
            rx="5" />
    </svg>
</template>
