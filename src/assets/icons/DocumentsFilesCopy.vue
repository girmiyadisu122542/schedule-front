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
            d="M15.0007 19.4013V10.8607C15.0007 10.4355 14.8316 10.0284 14.5315 9.72823L12.2685 7.46529C11.9684 7.16516 11.5612 6.99609 11.1361 6.99609H5.59676C4.71239 6.99609 3.99609 7.71239 3.99609 8.59676V19.4013C3.99609 20.2856 4.71239 21.0019 5.59676 21.0019H13.4C14.2844 21.0019 15.0007 20.2856 15.0007 19.4013Z" />
        <path
            d="M15.0005 17.0019H18.402C19.2863 17.0019 20.0026 16.2856 20.0026 15.4013V6.8607C20.0026 6.43553 19.8336 6.02836 19.5334 5.72823L17.2705 3.46529C16.9704 3.16516 16.5632 2.99609 16.138 2.99609H10.5987C9.71435 2.99609 8.99805 3.71239 8.99805 4.59676V6.99776" />
        <path d="M20.0017 6.99776H16.8003C16.3581 6.99776 16 6.63961 16 6.19743V2.99609" />
        <path d="M14.9997 10.9978H11.7984C11.3562 10.9978 10.998 10.6396 10.998 10.1974V6.99609" />
    </svg>
</template>
