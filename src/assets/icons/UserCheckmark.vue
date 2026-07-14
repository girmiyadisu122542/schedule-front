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
            d="M16.002 14.7692C14.6155 14.7744 13.4872 13.6546 13.482 12.2681C13.4767 10.8816 14.5965 9.75334 15.983 9.74807C17.3695 9.74283 18.4978 10.8626 18.5031 12.2491C18.5065 12.9152 18.2447 13.5553 17.7755 14.0281C17.3062 14.5009 16.6681 14.7676 16.002 14.7692V14.7692Z" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M20.3784 21.0035H11.6248C11.2799 21.0025 11.0005 20.7232 10.9995 20.3783V19.753C11.0036 18.3734 12.1209 17.256 13.5006 17.252H18.5026C19.8822 17.256 20.9996 18.3734 21.0037 19.753V20.3783C21.0027 20.7232 20.7233 21.0025 20.3784 21.0035V21.0035Z" />
        <path
            d="M15.7251 5.99702C13.968 3.48208 10.7772 2.40564 7.85575 3.34228C4.9343 4.27892 2.96418 7.00999 2.99699 10.0778C3.02979 13.1455 5.05785 15.8338 7.99867 16.7078" />
        <path d="M11.3326 9.33008L9.66692 10.9978L8.6665 9.99736" />
    </svg>
</template>
