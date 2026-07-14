<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';

import MoreVerticalIcon from '@/assets/icons/MoreVerticalIcon.vue';
import { VISIBLE_ACTIONS, ACTION_MENU_GAP, ACTION_MIN_SPACE_BELOW, ACTION_VIEWPORT_PADDING } from '@/config/appConfig';

export interface ActionOption {
    label: string;
    icon: any;
    onClick: (event?: MouseEvent) => void;
    variant?: 'danger' | 'info' | 'success' | 'warning' | 'activate' | 'deactivate' | 'primary';
    isOnFooter?: boolean;
}

const props = defineProps<{
    options: ActionOption[];
    triggerClass?: string;
    hasFooter?: boolean;
    cssClass?: string;
}>();

const mainOptions = computed(() => props.options.filter((o) => !o.isOnFooter));
const footerOptions = computed(() => props.options.filter((o) => o.isOnFooter));

const MAX_VISIBLE_ACTIONS = VISIBLE_ACTIONS;
const search = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);

const showSearch = computed(() => mainOptions.value.length > MAX_VISIBLE_ACTIONS);

const filteredMainOptions = computed(() => {
    if (!showSearch.value) return mainOptions.value;
    const term = search.value.trim().toLowerCase();
    return term ? mainOptions.value.filter((option) => option.label?.toLowerCase().includes(term)) : mainOptions.value;
});

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuStyles = ref<any>({ top: '0px', left: '0px', visibility: 'hidden' });

const GAP = ACTION_MENU_GAP;
const VIEWPORT_PADDING = ACTION_VIEWPORT_PADDING;
const MIN_SPACE_BELOW = ACTION_MIN_SPACE_BELOW;

const updatePosition = () => {
    if (!triggerRef.value || !menuRef.value) return;

    const rect = triggerRef.value.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const menuWidth = menuRef.value.offsetWidth;
    const menuHeight = menuRef.value.offsetHeight;

    const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_PADDING;
    const spaceAbove = rect.top - GAP - VIEWPORT_PADDING;

    const openUp = spaceBelow < MIN_SPACE_BELOW && spaceAbove > spaceBelow;
    const available = Math.max(openUp ? spaceAbove : spaceBelow, 0);
    const height = Math.min(menuHeight, available);

    let left = rect.right + scrollX - menuWidth;
    const minLeft = scrollX + VIEWPORT_PADDING;
    const maxLeft = scrollX + window.innerWidth - menuWidth - VIEWPORT_PADDING;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    menuStyles.value = {
        top: `${openUp ? rect.top + scrollY - height - GAP : rect.bottom + scrollY + GAP}px`,
        left: `${left}px`,
        position: 'absolute',
        maxHeight: `${available}px`,
        visibility: 'visible'
    };
};

const toggleMenu = async () => {
    if (isOpen.value) {
        closeMenu();
        return;
    }

    menuStyles.value.visibility = 'hidden';
    search.value = '';
    isOpen.value = true;

    await nextTick();
    updatePosition();
    if (showSearch.value) searchInputRef.value?.focus();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
};

const closeMenu = () => {
    isOpen.value = false;
    search.value = '';
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
};

watch(search, async () => {
    if (!isOpen.value) return;
    await nextTick();
    updatePosition();
});

onUnmounted(closeMenu);
</script>

<template>
    <div class="relative inline-block">
        <button
            ref="triggerRef"
            @click.stop="toggleMenu"
            :class="[
                'transition-all outline-none',
                !$slots.default ? 'dark:hover:bg-schedule-dark-border rounded-full p-2 hover:bg-gray-100' : '',
                triggerClass,
                { 'dark:bg-schedule-dark bg-gray-100': isOpen && !$slots.default }
            ]">
            <slot>
                <MoreVerticalIcon class="text-schedule-icon-tertiary h-6 w-6 font-semibold" />
            </slot>
        </button>

        <Teleport to="body">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-9998"
                @click="closeMenu"></div>

            <div
                v-if="isOpen"
                ref="menuRef"
                :style="menuStyles"
                class="bg-schedule-generic-white dark:bg-schedule-dark dark:border-schedule-dark-border absolute z-9999 flex w-max min-w-48 flex-col overflow-hidden rounded-2xl border border-gray-100 p-2 shadow-2xl">
                <div class="flex min-h-0 flex-1 flex-col">
                    <div
                        v-if="showSearch"
                        class="shrink-0 px-1 pb-2">
                        <input
                            ref="searchInputRef"
                            v-model="search"
                            type="search"
                            :placeholder="$lang.search || 'Search'"
                            class="dark:border-schedule-dark-border dark:bg-schedule-dark w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none dark:text-gray-200"
                            @click.stop />
                    </div>

                    <div class="flex min-h-0 flex-1 flex-col space-y-1 overflow-y-auto pr-1">
                        <button
                            v-for="(option, index) in filteredMainOptions"
                            :key="index"
                            @click="
                                (e) => {
                                    option.onClick(e);
                                    closeMenu();
                                }
                            "
                            class="group dark:hover:bg-schedule-dark-border flex w-full items-center rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50">
                            <component
                                :is="option.icon"
                                :class="[
                                    'mr-3 h-5 w-5 transition-colors',
                                    'text-gray-700 dark:text-gray-500',
                                    option.variant === 'danger'
                                        ? 'group-hover:text-red-500'
                                        : option.variant === 'success'
                                          ? 'group-hover:text-green-500'
                                          : 'group-hover:text-gray-900 dark:group-hover:text-white'
                                ]" />

                            <span
                                :class="[
                                    'text-sm font-medium transition-colors',
                                    'text-gray-700 dark:text-gray-300',
                                    option.variant === 'danger'
                                        ? 'group-hover:text-red-600'
                                        : option.variant === 'success'
                                          ? 'group-hover:text-green-600'
                                          : 'group-hover:text-gray-900 dark:group-hover:text-white'
                                ]">
                                {{ option.label }}
                            </span>
                        </button>
                        <p
                            v-if="showSearch && !filteredMainOptions.length"
                            class="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                            {{ $lang.noActionsFound || 'No actions found' }}
                        </p>
                    </div>

                    <div
                        v-if="hasFooter && footerOptions.length > 0"
                        class="shrink-0">
                        <div
                            class="bg-schedule-text-tertiary dark:border-schedule-dark-border my-1 border-t border-gray-200"></div>
                        <button
                            v-for="(option, index) in footerOptions"
                            :key="index"
                            @click="
                                () => {
                                    option.onClick();
                                    closeMenu();
                                }
                            "
                            :class="[
                                cssClass,
                                'group dark:hover:bg-schedule-dark-border flex w-full items-center rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50'
                            ]">
                            <component
                                :is="option.icon"
                                :class="[
                                    'mr-3 h-5 w-5',
                                    option.variant === 'danger'
                                        ? 'text-red-500'
                                        : 'text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-white'
                                ]" />
                            <span
                                :class="[
                                    'text-sm font-medium',
                                    option.variant === 'danger'
                                        ? 'text-red-600'
                                        : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white'
                                ]">
                                {{ option.label }}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
