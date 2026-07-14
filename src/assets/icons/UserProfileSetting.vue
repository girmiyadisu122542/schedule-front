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
        <circle
            cx="6.99801"
            cy="5.24703"
            r="2.25094" />
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M4.99721 16.0005V20.0022C4.99721 20.5544 5.44539 21.0026 5.99762 21.0026H7.99846C8.55069 21.0026 8.99887 20.5544 8.99887 20.0022V16.0005L10.0543 15.2973C10.3324 15.1122 10.4995 14.799 10.4995 14.4649V10.9985C10.4995 10.4462 10.0513 9.99805 9.49908 9.99805H4.497C3.94477 9.99805 3.49658 10.4462 3.49658 10.9985V14.4649C3.49658 14.799 3.66365 15.1122 3.94177 15.2973L4.99721 16.0005Z" />
        <path d="M14.501 4.9963H20.5035" />
        <path d="M14.501 7.99826H20.5035" />
        <path d="M14.501 11.0002H18.5026" />
    </svg>
</template>
