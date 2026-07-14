import { ref } from 'vue';
import { useMutationObserver } from '@vueuse/core';

/**
 * Reactive flag that mirrors the global `.dark` class on <html>.
 * The app toggles dark mode by adding/removing that class (see ThemeToggle.vue),
 * so anything that needs to react to the theme (e.g. canvas charts that can't use
 * Tailwind tokens) can watch this instead of re-reading the DOM.
 */
export function useIsDark() {
    const isDark = ref(document.documentElement.classList.contains('dark'));

    useMutationObserver(
        document.documentElement,
        () => {
            isDark.value = document.documentElement.classList.contains('dark');
        },
        { attributes: true, attributeFilter: ['class'] }
    );

    return { isDark };
}
