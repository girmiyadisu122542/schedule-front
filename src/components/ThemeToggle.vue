<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';

import MoonIcon from '@/assets/icons/MoonIcon.vue';
import SunIcon from '@/assets/icons/SunIcon.vue';

interface Props {
    withText?: boolean;
    text?: string;
}

const props = withDefaults(defineProps<Props>(), {
    withText: true
});

const languageStore = useLanguageStore();
const isDark = ref<boolean>(false);

const translations = computed(() => languageStore.translations);

const displayText = computed(() => {
    return props.text || translations.value.toggleTheme;
});

const tooltip = computed(() => {
    return isDark.value ? 'Switch to light mode' : 'Switch to dark mode';
});

const setTheme = (dark: boolean) => {
    isDark.value = dark;

    const root = document.documentElement;

    if (dark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
};

const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    setTheme(savedTheme ? savedTheme === 'dark' : prefersDark);
};

const toggleTheme = () => setTheme(!isDark.value);

onMounted(() => {
    initializeTheme();
});
</script>

<template>
    <button
        type="button"
        :title="tooltip"
        @click="toggleTheme"
        class="hover:bg-surface-hover hover:text-text-primary flex h-10 w-10 items-center justify-center rounded-md transition-colors">
        <component
            :is="isDark ? SunIcon : MoonIcon"
            class="h-5 w-5 self-center" />

        <span
            v-if="withText"
            class="hidden sm:inline">
            {{ displayText }}
        </span>
    </button>
</template>
