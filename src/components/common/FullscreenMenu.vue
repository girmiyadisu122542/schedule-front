<script setup lang="ts">
import MaximizeIcon from '@/assets/icons/MaximizeIcon.vue';
import MinimizeIcon from '@/assets/icons/MinimizeIcon.vue';
import { ref, onMounted, onUnmounted } from 'vue';

const isFullscreen = ref<boolean>(false);

const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) element.requestFullscreen();
};

const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
};

const toggleFullscreen = () => {
    if (!document.fullscreenElement) enterFullscreen();
    else exitFullscreen();
};

const onFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
    document.addEventListener('fullscreenchange', onFullscreenChange);
});

onUnmounted(() => {
    document.removeEventListener('fullscreenchange', onFullscreenChange);
});
</script>

<template>
    <div
        @click="toggleFullscreen"
        class="text-text-tertiary hover:bg-surface-hover hover:text-text-primary flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors">
        <MinimizeIcon
            v-if="isFullscreen"
            class="h-5 w-5 self-center" />
        <MaximizeIcon
            v-else
            class="h-5 w-5 self-center" />
    </div>
</template>
