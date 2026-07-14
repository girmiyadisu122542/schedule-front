<script setup lang="ts">
import 'vue-sonner/style.css';
import '@/assets/css/toasts.css';

import { computed } from 'vue';
import { RouterView } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';

import PageLoaderIcon from '@/assets/icons/PageLoaderIcon.vue';

import AppToaster from '@/components/common/AppToaster.vue';
import SidebarProvider from '@/components/common/SidebarProvider.vue';

const languageStore = useLanguageStore();
const allowedRoutesStore = useAllowedRoutesStore();

const isAppLoading = computed(() => {
    return languageStore.isLoading || (allowedRoutesStore.isLoading && !allowedRoutesStore.isInitialized);
});
</script>

<template>
    <div class="bg-schedule-pattern-diamonds dark:bg-schedule-pattern-diamonds-elevated min-h-screen">
        <AppToaster />

        <div
            v-if="isAppLoading"
            class="flex h-screen items-center justify-center">
            <PageLoaderIcon />
        </div>

        <SidebarProvider v-else>
            <RouterView />
        </SidebarProvider>
    </div>
</template>
