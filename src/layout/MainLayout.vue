<script setup>
import { watch, onMounted, onUnmounted } from 'vue';
import { useSidebar } from '@/composables/useSidebar';
import AppHeader from '@/layout/components/AppHeader.vue';
import AppSidebar from '@/layout/components/AppSidebar.vue';
const { isExpanded, isMobileOpen } = useSidebar();

const disableBodyScroll = () => {
    document.body.style.overflow = 'hidden';
};

const enableBodyScroll = () => {
    document.body.style.overflow = '';
};

watch(isMobileOpen, (isOpen) => {
    if (isOpen) {
        disableBodyScroll();
    } else {
        enableBodyScroll();
    }
});

onUnmounted(() => {
    enableBodyScroll();
});
</script>

<template>
    <div class="text-text-primary bg-schedule-disabled dark:bg-schedule-dark min-h-screen">
        <AppSidebar />
        <AppHeader :class="['transition-all delay-150 duration-150', isExpanded ? 'lg:pl-72' : 'lg:pl-20']" />
        <div
            :class="[
                'max-w-full pl-0 transition-all delay-150 duration-150',
                isExpanded ? 'lg:max-w-full lg:pl-72' : 'lg:max-w-full lg:pl-20'
            ]">
            <div class="mx-auto max-w-full p-2 md:p-4 xl:p-6">
                <!-- Key the routed component by PATH so it fully remounts on every
                     navigation — including detail→detail (same component, new param),
                     which Vue would otherwise reuse in place and leave showing stale
                     data. No <Transition> wrapper: a keyed dynamic component inside
                     mode=out-in can, on rapid/superseded navigations, leave the old
                     component mounted (URL changes, content doesn't). Keying by path
                     (not fullPath) means query-only changes like pagination do NOT
                     remount. -->
                <router-view v-slot="{ Component }">
                    <component
                        :is="Component"
                        :key="$route.path" />
                </router-view>
            </div>
        </div>
    </div>
</template>
