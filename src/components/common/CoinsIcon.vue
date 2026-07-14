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
        <ellipse
            cx="8.99859"
            cy="9.99933"
            rx="6.0025"
            ry="2.50104" />
        <path
            d="M15.0011 13.5007C15.0011 14.882 12.3137 16.0018 8.99859 16.0018C5.6835 16.0018 2.99609 14.882 2.99609 13.5007" />
        <path d="M21.0035 9.99927C21.0035 11.3806 18.3161 12.5003 15.001 12.5003" />
        <path
            d="M15.0011 9.99927V17.5024C15.0011 18.8837 12.3137 20.0034 8.99859 20.0034C5.6835 20.0034 2.99609 18.8837 2.99609 17.5024V9.99927" />
        <path d="M21.0035 6.4978V14.0009C21.0035 15.3822 18.3161 16.502 15.001 16.502" />
        <path
            d="M9.49923 7.50829C9.20224 7.25335 9.02168 6.88861 8.99902 6.49787C8.99902 5.11729 11.6901 3.99683 15.0015 3.99683C18.3129 3.99683 21.004 5.11729 21.004 6.49787C21.004 7.87844 18.3129 8.99891 15.0015 8.99891C14.8315 8.99891 14.6614 8.99891 14.5013 8.98891" />
    </svg>
</template>
