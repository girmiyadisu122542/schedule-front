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
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10.018 11H13.982C14.544 11 15 11.443 15 11.99V15.011C15 15.558 14.544 16.001 13.982 16.001H10.018C9.456 16 9 15.557 9 15.01V11.99C9 11.443 9.456 11 10.018 11V11Z" />
        <path d="M10.3159 11V9.684C10.3159 8.754 11.0699 8 11.9999 8C12.9299 8 13.6839 8.754 13.6839 9.684V11" />
        <path
            d="M6.33203 19.1954C7.89203 20.4264 9.85803 21.1664 12 21.1664C17.063 21.1664 21.167 17.0624 21.167 11.9994C21.167 10.6554 20.871 9.38242 20.351 8.23242L18.417 10.1664" />
        <path
            d="M17.668 4.80403C16.107 3.57303 14.142 2.83203 12 2.83203C6.93701 2.83203 2.83301 6.93603 2.83301 11.999C2.83301 13.343 3.12901 14.616 3.64901 15.766L5.58301 13.832" />
    </svg>
</template>
