<script setup lang="ts">
import type { PropType } from 'vue';
import { storeToRefs } from 'pinia';
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';

import MainLabel from '@/components/common/MainLabel.vue';

import PlusIcon from '@/assets/icons/PlusIcon.vue';
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';

import { useLanguageStore } from '@/stores/languageStore';
import { CREATE_NEW_DISPLAY } from '@/config/appConfig';
import router from '@/router';

const props = defineProps({
    modelValue: { type: [String, Number, Object, null], default: null },
    options: { type: Array as PropType<any[]>, default: () => [] },
    optionLabel: { type: String, default: 'label' },
    optionValue: { type: String, default: 'value' },
    placeholder: { type: String, default: '' },
    size: { type: String as PropType<'small' | 'normal' | 'large'>, default: 'small' },
    variant: { type: String as PropType<'outlined' | 'filled' | 'none'>, default: 'outlined' },
    disabled: { type: Boolean, default: false },
    invalid: { type: Boolean, default: false },
    showClear: { type: Boolean, default: false },
    showRefresh: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    message: { type: String, default: '' },
    searchQueryParam: { type: String, default: '' },
    messageType: { type: String as PropType<'error' | 'success' | 'warning' | 'info'>, default: 'error' },
    search: { type: Boolean, default: false },
    labelText: { type: String, default: '' },
    isRequired: { type: Boolean, default: false },
    helperMessage: { type: String, default: '' },
    minWidth: { type: String, default: '100px' }, // New prop for minimum width
    isOptionsIcon: { type: Boolean, default: false },
    selectedIcon: { type: Object, default: null },
    createNew: { type: Boolean, default: false },
    createNewText: { type: String, default: 'Create New' },
    createNewRoute: { type: String, default: '' },
    refreshTitle: { type: String, default: '' }
});

const emit = defineEmits([
    'update:modelValue',
    'update:search-query-param',
    'change',
    'clear',
    'search-input',
    'refresh',
    'create'
]);

const open = ref(false);
const searchQuery = ref(props.searchQueryParam);
const isLoading = ref(false);
const isRefreshing = ref(false);

const { translations } = storeToRefs(useLanguageStore());
const refreshLabel = computed(() => props.refreshTitle || translations.value.refresh || 'Refresh');
const isBusy = computed(() => isRefreshing.value || props.loading);
const filteredOptions = ref<any[]>(props.options);

// Computed property to truncate placeholder text
const truncatedPlaceholder = computed(() => {
    if (!props.placeholder) return '';
    return props.placeholder.length > 25 ? props.placeholder.substring(0, 25) + '...' : props.placeholder;
});

const selected = computed(() => {
    if (props.modelValue == null) return null;
    // If optionValue is empty string or 'object', match by object reference
    if (!props.optionValue || props.optionValue === 'object') {
        return props.options.find((opt) => opt === props.modelValue);
    }
    return props.options.find((opt) => {
        if (typeof opt === 'object') {
            return opt[props.optionValue] === props.modelValue;
        }
        return opt === props.modelValue;
    });
});

watch(
    () => props.searchQueryParam,
    (nv) => {
        if (nv !== searchQuery.value) searchQuery.value = nv;
    }
);

// Only enable search/filter logic if search prop is true
if (props.search) {
    function doLocalFilter(query: string) {
        if (!query) {
            filteredOptions.value = props.options;
        } else {
            const q = query.toLowerCase();
            filteredOptions.value = props.options.filter((opt) => {
                const label = typeof opt === 'object' ? String(opt[props.optionLabel]) : String(opt);
                return label.toLowerCase().includes(q);
            });
        }
    }

    watch(searchQuery, (newQuery) => {
        emit('update:search-query-param', newQuery);
        doLocalFilter(newQuery);
        emit('search-input', newQuery);
    });

    watch(
        () => props.options,
        (newOptions) => {
            filteredOptions.value = [...newOptions];
        },
        {
            deep: true,
            immediate: true
        }
    );
} else {
    watch(
        () => props.options,
        (newOptions) => {
            filteredOptions.value = [...newOptions];
        },
        {
            deep: true,
            immediate: true
        }
    );

    filteredOptions.value = props.options;
}

function selectOption(opt: any) {
    let value;
    if (!props.optionValue || props.optionValue === 'object') {
        value = opt;
    } else {
        value = typeof opt === 'object' ? opt[props.optionValue] : opt;
    }
    emit('update:modelValue', value);
    emit('change', value);
    open.value = false;
}
function clearSelection(selectedItem?: any) {
    emit('update:modelValue', null);
    emit('clear', selected.value);
}
function handleRefresh() {
    if (isBusy.value) return;
    isRefreshing.value = true;
    emit('refresh');
    setTimeout(() => {
        isRefreshing.value = false;
    }, 1200);
}
function toggleDropdown() {
    if (!props.disabled && !props.loading) open.value = !open.value;
}
function closeDropdown() {
    open.value = false;
}

function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.value && dropdownRef.value.contains(event.target as Node)) {
        return;
    }
    if (buttonRef.value && buttonRef.value.contains(event.target as Node)) {
        return;
    }
    closeDropdown();
}

const dropdownRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref({});

function updateDropdownPosition() {
    if (buttonRef.value && open.value) {
        const rect = buttonRef.value.getBoundingClientRect();
        const dropdownHeight = dropdownRef.value?.offsetHeight || 200; // estimated height if not yet rendered
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        let top = rect.bottom + 4; // default: below
        let transformOrigin = 'top';

        // If not enough space below but enough space above, open upward
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
            top = rect.top - dropdownHeight - 4;
            transformOrigin = 'bottom';
        }

        dropdownStyle.value = {
            position: 'fixed',
            top: `${top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            'transform-origin': transformOrigin,
            'min-width': props.minWidth // Ensure dropdown has same min-width as button
        };
    }
}

// Add scroll listener to update position
function handleScroll() {
    if (open.value) {
        updateDropdownPosition();
    }
}

watch(open, (isOpen) => {
    if (isOpen) {
        nextTick(() => {
            updateDropdownPosition();
            nextTick(() => {
                document.addEventListener('click', handleClickOutside, true);
                window.addEventListener('scroll', handleScroll, true); // Add scroll listener
                window.addEventListener('resize', handleScroll); // Add resize listener
            });
        });
    } else {
        document.removeEventListener('click', handleClickOutside, true);
        window.removeEventListener('scroll', handleScroll, true); // Remove scroll listener
        window.removeEventListener('resize', handleScroll); // Remove resize listener
    }
});

function handleCreate() {
    emit('create');
}

// Cleanup on unmount
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside, true);
    window.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('resize', handleScroll);
});
</script>

<template>
    <div>
        <MainLabel
            :isRequired="props.isRequired"
            :labelText="props.labelText"
            :helperMessage="props.helperMessage" />
        <div class="relative w-full">
            <button
                ref="buttonRef"
                type="button"
                :class="[
                    'inline-flex w-full items-center justify-between rounded-lg border p-3 whitespace-nowrap transition focus:outline-none',
                    {
                        'text-schedule-text-secondary border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100':
                            variant === 'outlined' && !invalid,
                        'text-schedule-text-secondary border-red-500 dark:border-red-500 dark:bg-gray-900 dark:text-red-400':
                            variant === 'outlined' && invalid,
                        'text-schedule-text-secondary border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100':
                            variant === 'filled' && !invalid,
                        'text-schedule-text-secondary border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950 dark:text-red-400':
                            variant === 'filled' && invalid,
                        'text-schedule-text-secondary border-transparent bg-transparent dark:text-gray-100':
                            variant === 'none' && !invalid,
                        'border-transparent bg-transparent text-red-500 dark:text-red-400':
                            variant === 'none' && invalid,
                        'cursor-not-allowed opacity-60': disabled,
                        'text-sm': size === 'small',
                        'h-12 px-4 py-3 text-base': size === 'large'
                    }
                ]"
                :style="{ minWidth: minWidth }"
                :disabled="disabled"
                @click="toggleDropdown"
                aria-haspopup="listbox"
                :aria-expanded="open">
                <span
                    v-if="selected"
                    class="block max-w-[90%] truncate text-left"
                    :title="typeof selected === 'object' ? selected[optionLabel] : selected">
                    <slot
                        name="value"
                        :value="selected">
                        <div
                            v-if="selectedIcon"
                            class="flex items-center justify-between gap-4">
                            <span>{{ typeof selected === 'object' ? selected[optionLabel] : selected }}</span>
                            <component
                                :is="selectedIcon"
                                class="h-4 w-4" />
                        </div>
                        <span v-else>{{ typeof selected === 'object' ? selected[optionLabel] : selected }}</span>
                    </slot>
                </span>
                <span
                    v-else
                    class="max-w-[calc(100%-60px)] truncate text-gray-400"
                    :title="placeholder">
                    {{ truncatedPlaceholder }}
                </span>
                <span class="ml-auto flex items-center gap-2">
                    <button
                        v-if="showRefresh"
                        type="button"
                        :class="[
                            'rounded-md p-1 transition-colors',
                            isBusy
                                ? 'text-schedule-brand-blue cursor-wait'
                                : 'text-schedule-text-tertiary hover:text-schedule-brand-blue hover:bg-schedule-brand-blue-subtle/40 cursor-pointer'
                        ]"
                        :disabled="isBusy"
                        :title="refreshLabel"
                        :aria-label="refreshLabel"
                        @click.stop="handleRefresh">
                        <RefreshIcon
                            :size="14"
                            :class="{ 'animate-spin': isBusy }" />
                    </button>
                    <template v-if="loading && !showRefresh">
                        <span
                            class="animate-spin"
                            :aria-label="$lang.loading">
                            <svg
                                class="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true">
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="#2563eb"
                                    stroke-width="4" />
                                <path
                                    class="opacity-75"
                                    fill="#2563eb"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        </span>
                    </template>
                    <template v-if="!loading">
                        <!-- Clear Button -->
                        <button
                            v-if="showClear && selected"
                            type="button"
                            class="text-gray-400 transition-colors hover:text-red-500"
                            @click.stop="(val: any) => clearSelection(val)"
                            :aria-label="$lang.clear">
                            <svg
                                class="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <!-- Dropdown Icon -->
                        <slot name="dropdownicon">
                            <svg
                                class="h-4 w-4 opacity-50 transition-transform"
                                :class="[open ? 'rotate-180' : '']"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </slot>
                    </template>
                </span>
            </button>
            <Teleport to="body">
                <transition name="fade">
                    <ul
                        v-if="open"
                        ref="dropdownRef"
                        :style="dropdownStyle"
                        class="z-100000 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                        role="listbox"
                        tabindex="-1"
                        @click.stop>
                        <slot name="header"></slot>
                        <!-- Search input (only if search is enabled) -->
                        <li
                            v-if="search"
                            class="sticky top-0 z-10 bg-white px-3 py-2 dark:bg-gray-900">
                            <div class="relative">
                                <input
                                    v-model="searchQuery"
                                    type="text"
                                    class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 pl-9 text-sm text-gray-800 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    :placeholder="translations.search || 'Search...'"
                                    autocomplete="off" />
                                <svg
                                    class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </li>
                        <!-- Loading indicator for remote search (only if search is enabled) -->
                        <li
                            v-if="filteredOptions.length === 0 && loading"
                            class="px-3 py-2 text-center text-gray-400">
                            <span class="inline-flex items-center">
                                <svg
                                    class="mr-2 h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true">
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="#2563eb"
                                        stroke-width="4" />
                                    <path
                                        class="opacity-75"
                                        fill="#2563eb"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                {{ $lang.isLoading || 'Loading...' }}
                            </span>
                        </li>
                        <!-- No results found (only if search is enabled) -->
                        <li
                            v-if="search && !loading && filteredOptions.length === 0"
                            class="px-3 py-2 text-center text-gray-400">
                            {{ $lang.noResultsFound || 'No results found' }}
                        </li>
                        <!-- Options -->
                        <li
                            v-for="opt in filteredOptions"
                            :key="typeof opt === 'object' ? opt[optionValue] : opt"
                            :class="[
                                'cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800',
                                {
                                    'bg-gray-100 dark:bg-gray-800':
                                        selected &&
                                        (typeof opt === 'object' ? opt[optionValue] : opt) ===
                                            (typeof selected === 'object' ? selected[optionValue] : selected)
                                }
                            ]"
                            @click="selectOption(opt)"
                            role="option"
                            :aria-selected="
                                selected &&
                                (typeof opt === 'object' ? opt[optionValue] : opt) ===
                                    (typeof selected === 'object' ? selected[optionValue] : selected)
                            ">
                            <slot
                                name="option"
                                :option="opt">
                                <div
                                    v-if="isOptionsIcon"
                                    class="flex items-center gap-2">
                                    <component
                                        :is="opt.icon"
                                        class="h-5 w-5"
                                        v-if="opt.icon" />
                                    <span>{{ typeof opt === 'object' ? opt[optionLabel] : opt }}</span>
                                </div>
                                <span v-else>{{ typeof opt === 'object' ? opt[optionLabel] : opt }}</span>
                            </slot>
                        </li>

                        <!--TODO: complete this add more functionality-->
                        <li
                            v-if="!loading && createNew && (filteredOptions.length <= CREATE_NEW_DISPLAY)"
                            class="text-schedule-text-brand-primary flex cursor-pointer items-center gap-2 px-3 py-2 text-center hover:bg-gray-100 dark:hover:bg-gray-800"
                            @click.stop="
                                handleCreate();
                                emit('create');
                            ">
                            <PlusIcon class="h-5 w-5" />
                            <span>{{ createNewText }}</span>
                        </li>
                    </ul>
                </transition>
            </Teleport>
            <span
                v-if="message"
                :class="[
                    'mt-1 block text-xs',
                    messageType === 'error' ? 'text-red-500' : '',
                    messageType === 'success' ? 'text-green-500' : '',
                    messageType === 'warning' ? 'text-yellow-500' : '',
                    messageType === 'info' ? 'text-blue-500' : ''
                ]">
                {{ message }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
