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
        <path
            d="M19 11V7.828C19 7.298 18.789 6.789 18.414 6.414L15.586 3.586C15.211 3.211 14.702 3 14.172 3H7C5.895 3 5 3.895 5 5V19C5 20.105 5.895 21 7 21H11" />
        <path d="M19 8H15C14.448 8 14 7.552 14 7V3" />
        <path d="M17.6602 15.174V14.002" />
        <path d="M17.6602 21.0001V19.8281" />
        <path d="M19.6719 16.329L20.6859 15.751" />
        <path d="M14.6343 19.2499L15.6313 18.6719" />
        <path d="M19.6719 18.6729L20.6859 19.2509" />
        <path d="M14.6343 15.752L15.6313 16.33" />
        <path
            d="M17.6582 15.167C18.9482 15.167 19.9922 16.211 19.9922 17.501C19.9922 18.791 18.9482 19.835 17.6582 19.835C16.3682 19.835 15.3242 18.789 15.3242 17.501C15.3242 16.213 16.3682 15.167 17.6582 15.167" />
    </svg>
</template>
