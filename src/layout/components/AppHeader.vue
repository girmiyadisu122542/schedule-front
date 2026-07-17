<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

import { useSidebar } from '@/composables/useSidebar';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/modules/user/store/authStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';

import UserMenu from '@/layout/components/UserMenu.vue';
import Notification from '@/layout/components/Notification.vue';

import ThemeToggle from '@/components/ThemeToggle.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import MainButton from '@/components/common/MainButton.vue';
import FullscreenMenu from '@/components/common/FullscreenMenu.vue';

import Humburger from '@/assets/icons/Humburger.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';
import GlobeIcon from '@/assets/icons/GlobeIcon.vue';
import SidebarOpen from '@/assets/icons/SidebarOpen.vue';
import SidebarClosed from '@/assets/icons/SidebarClosed.vue';
import VerticalLineIcon from '@/assets/icons/VerticalLineIcon.vue';

const { isExpanded, isMobileOpen, toggleMobileSidebar, handleToggleSidebar } = useSidebar();

const searchQuery = ref('');
const authStore = useAuthStore();
const languageStore = useLanguageStore();
const allowedRoutesStore = useAllowedRoutesStore();
const currentLang = ref(languageStore.currentLanguage);
const menuGroups = computed(() => allowedRoutesStore.filteredSidebarMenu);
const dashboardPath = computed(() => allowedRoutesStore.authRedirect || '/dashboard');

const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const languageDropdownOpen = ref(false);

const toggleLanguageDropdown = () => {
    languageDropdownOpen.value = !languageDropdownOpen.value;
};

const closeLanguageDropdown = () => {
    languageDropdownOpen.value = false;
};

const selectLanguage = (langCode: string) => {
    currentLang.value = langCode;
    languageStore.setLanguage(langCode);
    closeLanguageDropdown();
};

const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-dropdown-trigger') && !target.closest('.language-dropdown-menu')) {
        closeLanguageDropdown();
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <header class="bg-surface-elevated border-border-default sticky top-0 z-50 flex lg:border-b">
        <div class="flex grow flex-col items-center justify-between lg:flex-row lg:px-0">
            <!-- Mobile Layout -->
            <div class="border-border-default flex w-full items-center justify-between gap-2 border-b p-2 lg:hidden">
                <!-- Sidebar Toggle Button (Mobile) -->
                <div
                    @click="toggleMobileSidebar"
                    class="hover:schedule-icon-inverse flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors duration-200 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800">
                    <SidebarOpen v-if="isMobileOpen" />
                    <SidebarClosed v-else />
                </div>

                <!-- Search Bar with Sidebar Menu functionality -->
                <div class="flex-1 px-2">
                    <SearchBar
                        v-model="searchQuery"
                        :menuData="menuGroups" />
                </div>

                <!-- Theme Toggle & Hamburger -->
                <div class="flex items-center gap-2">
                    <ThemeToggle :with-text="false" />
                    <div
                        @click="toggleMobileMenu"
                        class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors duration-200 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800">
                        <Humburger
                            v-if="isMobileMenuOpen"
                            :d="'M6 18L18 6M6 6l12 12'" />
                        <Humburger
                            v-else
                            :d="'M4 6h16M4 12h16M4 18h16'" />
                    </div>
                </div>
            </div>

            <!-- Mobile Menu Dropdown -->
            <transition name="fade-header">
                <div
                    v-if="isMobileMenuOpen"
                    class="absolute top-full right-0 left-0 z-50 flex justify-between gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <MainButton
                                @click="toggleLanguageDropdown"
                                rounded
                                ghost
                                icon="fa-solid fa-language"
                                class="language-dropdown-trigger hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"></MainButton>

                            <transition
                                enter-active-class="transition ease-out duration-200"
                                enter-from-class="opacity-0 translate-y-1 scale-95"
                                enter-to-class="opacity-100 translate-y-0 scale-100"
                                leave-active-class="transition ease-in duration-150"
                                leave-from-class="opacity-100 translate-y-0 scale-100"
                                leave-to-class="opacity-0 translate-y-1 scale-95">
                                <div
                                    v-if="languageDropdownOpen"
                                    class="language-dropdown-menu absolute top-full left-0 z-50 mt-2 flex w-48 flex-col items-center rounded-xl border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                    <MainButton
                                        ghost
                                        v-for="lang in languageStore.availableLanguages"
                                        :key="lang.code"
                                        @click="selectLanguage(lang.code)"
                                        :class="[
                                            'w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800',
                                            currentLang === lang.code
                                                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                                                : 'text-gray-700 dark:text-gray-300'
                                        ]">
                                        {{ lang.name }}
                                    </MainButton>
                                </div>
                            </transition>
                        </div>
                        <Notification class="text-schedule-text-tertiary dark:text-gray-300" />
                        <UserMenu />
                    </div>
                    <router-link
                        v-if="authStore.user"
                        :to="dashboardPath"
                        class="border-qmtBlue-200 bg-qmtBlue-50 text-qmtBlue-700 hover:bg-qmtBlue-100 dark:border-qmtBlue-500/40 dark:bg-qmtBlue-500/10 dark:text-qmtBlue-300 dark:hover:bg-qmtBlue-500/20 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
                        <i class="fa-solid fa-table-cells-large"></i>
                        <span>{{ $lang.dashboard || 'Dashboard' }}</span>
                    </router-link>
                </div>
            </transition>

            <!-- Desktop Layout -->
            <div class="hidden lg:flex lg:h-16 lg:w-full lg:items-center lg:gap-3 lg:px-2">
                <!-- Left: Sidebar Toggle -->
                <div
                    @click="handleToggleSidebar"
                    class="border-border-default bg-surface-card text-text-tertiary hover:bg-surface-hover hover:text-text-primary flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors">
                    <SidebarOpen v-if="isExpanded" />
                    <SidebarClosed v-else />
                </div>

                <div class="flex min-w-0 flex-1 justify-center">
                    <SearchBar
                        :placeholder="$lang.searchEverything || $lang.searchPlaceholder || 'Search Everything...'"
                        v-model="searchQuery"
                        :menuData="menuGroups"
                        class="w-full max-w-2xl" />
                </div>

                <!-- Right: Actions -->
                <div class="flex shrink-0 items-center gap-1.5">
                    <!-- <FullscreenMenu class="text-text-tertiary" /> -->

                    <ThemeToggle
                        :with-text="false"
                        class="text-text-tertiary" />

                    <!-- Language Dropdown -->
                    <div class="text-text-tertiary relative">
                        <!-- <button
                            type="button"
                            @click="toggleLanguageDropdown"
                            class="language-dropdown-trigger text-text-tertiary hover:bg-surface-hover hover:text-text-primary flex h-10 w-10 items-center justify-center rounded-md transition-colors">
                            <i class="fa-solid fa-language text-lg"></i>
                        </button> -->

                        <div
                            v-if="languageDropdownOpen"
                            class="bg-surface-card border-border-default absolute right-0 z-50 mt-2 flex w-48 flex-col rounded-xl border py-2 shadow-xl">
                            <MainButton
                                ghost
                                v-for="lang in languageStore.availableLanguages"
                                :key="lang.code"
                                @click="selectLanguage(lang.code)"
                                :class="[
                                    'text-text-secondary hover:bg-surface-hover w-full px-3 py-2 text-left text-sm',
                                    currentLang === lang.code
                                        ? 'bg-surface-subtle text-text-primary'
                                        : 'text-text-secondary'
                                ]">
                                <div class="flex w-full items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <GlobeIcon class="h-5 w-5" />

                                        <span>{{ lang.name }}</span>
                                    </div>

                                    <CheckIcon
                                        v-if="currentLang === lang.code"
                                        class="h-4 w-4" />
                                </div>
                            </MainButton>
                        </div>
                    </div>

                    <!-- <Notification class="text-text-tertiary" /> -->
                    <!-- <VerticalLineIcon class="text-text-muted mx-1" /> -->

                    <!-- User Menu -->
                    <UserMenu :force-expanded="true" />
                </div>
            </div>
        </div>
    </header>
</template>
