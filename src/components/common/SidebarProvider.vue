<script setup lang="ts">
import { useSidebarProvider } from '@/composables/useSidebar';

useSidebarProvider();
</script>

<template>
    <slot></slot>
</template>
