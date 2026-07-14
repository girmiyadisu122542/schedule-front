<script setup lang="ts">
import { Toaster } from 'vue-sonner';
</script>

<template>
    <Toaster
        class="app-sonner"
        position="top-right"
        :close-button="true"
        :expand="true"
        :gap="20"
        :rich-colors="false"
        :toast-options="{
            class: 'app-toast'
        }" />
</template>
