<script setup lang="ts">
defineProps<{
    field: string;
    header: string | undefined;
    sortable?: boolean;
    expander?: boolean;
}>();
</script>

<template>
    <!-- Just a marker component for DataTable to read -->
    <slot />
</template>
