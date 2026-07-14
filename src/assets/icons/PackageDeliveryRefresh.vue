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
        <path d="M22.0057 16.268L20.7611 15.0234L19.5156 16.268" />
        <path d="M13.0234 16.7578L14.268 18.0023L15.5125 16.7578" />
        <path
            d="M14.2695 18.0025V14.6831C14.2693 14.2429 14.444 13.8206 14.7554 13.5093C15.0667 13.1979 15.489 13.0232 15.9292 13.0234H19.0305" />
        <path d="M20.7623 15.0234V18.3428C20.7596 19.2571 20.0199 19.9981 19.1056 20.0025H16.0273" />
        <path
            d="M15.0025 3.07313V6.56358C15.0025 7.11609 14.5546 7.564 14.0021 7.564H10.0004C9.4479 7.564 9 7.11609 9 6.56358V2.99609" />
        <path
            d="M21.0036 9.99901V4.99693C21.0036 3.8919 20.1078 2.99609 19.0028 2.99609H4.99693C3.8919 2.99609 2.99609 3.8919 2.99609 4.99693V18.0023C2.99609 19.1074 3.8919 20.0032 4.99693 20.0032H10.9994" />
    </svg>
</template>
