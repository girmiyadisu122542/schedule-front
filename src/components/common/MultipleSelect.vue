<script setup lang="ts">
import type { PropType } from 'vue';
import { storeToRefs } from 'pinia';
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

import { CREATE_NEW_DISPLAY, MAX_DISPLAY } from '@/config/appConfig';

import MainLabel from '@/components/common/MainLabel.vue';
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';
import { useLanguageStore } from '@/stores/languageStore';
import PlusIcon from '@/assets/icons/PlusIcon.vue';

const props = defineProps({
    modelValue: { type: Array as PropType<(string | number)[]>, default: () => [] },
    options: { type: Array as PropType<any[]>, default: () => [] },
    optionLabel: { type: String, default: 'label' },
    optionValue: { type: String, default: 'value' },
    placeholder: { type: String, default: 'Select options' },
    size: { type: String as PropType<'small' | 'normal' | 'large'>, default: 'small' },
    variant: { type: String as PropType<'outlined' | 'filled'>, default: 'outlined' },
    disabled: { type: Boolean, default: false },
    invalid: { type: Boolean, default: false },
    showClear: { type: Boolean, default: false },
    showRefresh: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    message: { type: String, default: '' },
    messageType: { type: String as PropType<'error' | 'success' | 'warning' | 'info'>, default: 'error' },
    search: { type: Boolean, default: true },
    label: { type: String, default: '' },
    labelText: { type: String, default: '' },
    isRequired: { type: Boolean, default: false },
    helperMessage: { type: String, default: '' },
    maxDisplay: { type: Number, default: MAX_DISPLAY }, // Maximum number of items to display before showing count
    showSelectedItems: { type: Boolean, default: true },
    autoOpen: { type: Boolean, default: false },
    searchQueryParam: { type: String, default: '' },
    max: { type: Number, default: undefined },
    min: { type: Number, default: undefined },
    refreshTitle: { type: String, default: '' },
    createNew: { type: Boolean, default: false },
    createNewText: { type: String, default: '' },
    createNewRoute: { type: String, default: '' },
});

const emit = defineEmits([
    'update:modelValue',
    'update:searchQueryParam',
    'change',
    'create',
    'clear',
    'search-input',
    'refresh',
    'close'
]);

const open = ref(false);
const searchQuery = ref(props.searchQueryParam);
const isRefreshing = ref(false);

const { translations } = storeToRefs(useLanguageStore());
const refreshLabel = computed(() => props.refreshTitle || translations.value.refresh || 'Refresh');
const isBusy = computed(() => isRefreshing.value || props.loading);
const filteredOptions = ref<any[]>(props.options);

const selectedItems = computed(() => {
    if (!props.modelValue || !Array.isArray(props.modelValue)) {
        return [];
    }
    return props.options.filter((opt) => {
        const value = typeof opt === 'object' ? opt[props.optionValue] : opt;
        return props.modelValue.includes(value);
    });
});

const isMaxReached = computed(() => {
    return props.max !== undefined && props.modelValue.length >= props.max;
});

const displayText = computed(() => {
    if (selectedItems.value.length === 0) return props.placeholder;

    const labels = selectedItems.value.map((item) => (typeof item === 'object' ? item[props.optionLabel] : item));

    if (labels.length <= props.maxDisplay) {
        return labels.join(', ');
    }

    // Show first maxDisplay items and count of remaining
    const displayedLabels = labels.slice(0, props.maxDisplay).join(', ');
    const remainingCount = labels.length - props.maxDisplay;
    return `${displayedLabels} +${remainingCount} more`;
});

function filterOptions(query: string) {
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

watch(
    () => props.searchQueryParam,
    (nv) => {
        if (nv !== searchQuery.value) searchQuery.value = nv;
    }
);
watch(searchQuery, (newQuery) => {
    emit('update:searchQueryParam', newQuery);
    filterOptions(newQuery);
    emit('search-input', newQuery);
});

watch(
    () => props.options,
    (newOptions) => {
        filteredOptions.value = newOptions;
        filterOptions(searchQuery.value);
    }
);

function toggleOption(opt: any) {
    const value = typeof opt === 'object' ? opt[props.optionValue] : opt;
    const currentValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = currentValue.indexOf(value);

    if (index > -1) {
        currentValue.splice(index, 1);
    } else {
        if (props.max !== undefined && currentValue.length >= props.max) return;
        currentValue.push(value);
    }

    emit('update:modelValue', currentValue);
    emit('change', currentValue);
}

function removeSelectedItem(opt: any) {
    const value = typeof opt === 'object' ? opt[props.optionValue] : opt;
    const currentValue = [...props.modelValue];
    const index = currentValue.indexOf(value);

    if (index > -1) {
        currentValue.splice(index, 1);
        emit('update:modelValue', currentValue);
        emit('change', currentValue);
    }
}

function isSelected(opt: any): boolean {
    if (!props.modelValue || !Array.isArray(props.modelValue)) return false;
    const value = typeof opt === 'object' ? opt[props.optionValue] : opt;
    return props.modelValue.includes(value);
}

function clearSelection() {
    emit('update:modelValue', []);
    emit('clear');
}

function handleRefresh() {
    // Ignore double-clicks while the prior reload is still pending.
    if (isBusy.value) return;
    isRefreshing.value = true;
    emit('refresh');
    // Parent-driven loading keeps the spinner going until data lands;
    // this fallback releases when the host doesn't wire a loading prop.
    setTimeout(() => {
        isRefreshing.value = false;
    }, 1200);
}

function toggleDropdown() {
    if (!props.disabled && !props.loading) {
        open.value = !open.value;
    }
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
        dropdownStyle.value = {
            position: 'fixed',
            top: `${rect.bottom + 4}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`
        };
    }
}

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
                window.addEventListener('scroll', handleScroll, true);
                window.addEventListener('resize', handleScroll);
            });
        });
    } else {
        document.removeEventListener('click', handleClickOutside, true);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
        searchQuery.value = '';
        emit('close');
    }
});

onMounted(() => {
    if (props.autoOpen) {
        open.value = true;
    }
});

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
            :labelText="props.label || props.labelText"
            :helperMessage="props.helperMessage" />
        <div class="relative w-full">
            <button
                ref="buttonRef"
                type="button"
                :class="[
                    'text-text-primary flex min-h-[2.75rem] w-full items-center rounded-lg border px-3 py-2 transition-colors focus:outline-none',
                    {
                        'border-border-default focus:border-border-strong': !invalid,
                        'border-schedule-error-500': invalid,
                        'bg-surface-card': variant === 'outlined',
                        'bg-surface-subtle': variant === 'filled',
                        'cursor-not-allowed opacity-60': disabled,
                        'min-h-[2.25rem] text-sm': size === 'small',
                        'min-h-[3rem] text-base': size === 'large'
                    }
                ]"
                :disabled="disabled"
                @click="toggleDropdown"
                aria-haspopup="listbox"
                :aria-expanded="open">
                <!-- Selected Items as Chips -->
                <div
                    v-if="showSelectedItems && selectedItems.length > 0"
                    class="flex flex-1 flex-wrap gap-1">
                    <template v-if="selectedItems.length <= maxDisplay">
                        <span
                            v-for="item in selectedItems"
                            :key="typeof item === 'object' ? item[optionValue] : item"
                            class="bg-schedule-brand-blue/10 text-schedule-brand-blue dark:bg-schedule-brand-blue/20 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                            {{ typeof item === 'object' ? item[optionLabel] : item }}
                            <button
                                type="button"
                                class="hover:text-schedule-error-500 inline-flex items-center justify-center transition-colors"
                                @click.stop="removeSelectedItem(item)">
                                <svg
                                    class="h-2 w-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="3"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    </template>
                    <template v-else>
                        <span
                            v-for="item in selectedItems.slice(0, maxDisplay)"
                            :key="typeof item === 'object' ? item[optionValue] : item"
                            class="bg-schedule-brand-blue/10 text-schedule-brand-blue dark:bg-schedule-brand-blue/20 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                            {{ typeof item === 'object' ? item[optionLabel] : item }}
                            <button
                                type="button"
                                class="hover:text-schedule-error-500 inline-flex items-center justify-center transition-colors"
                                @click.stop="removeSelectedItem(item)">
                                <svg
                                    class="h-2 w-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="3"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                        <span
                            class="bg-surface-hover text-text-secondary inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
                            +{{ selectedItems.length - maxDisplay }} more
                        </span>
                    </template>
                </div>
                <span
                    v-else
                    class="text-text-muted flex-1 text-left">
                    {{ placeholder }}
                </span>

                <span class="ml-2 flex items-center gap-2">
                    <button
                        v-if="showRefresh"
                        type="button"
                        :class="[
                            'shrink-0 rounded-md p-1 transition-colors',
                            isBusy
                                ? 'text-schedule-brand-blue cursor-wait'
                                : 'text-text-tertiary hover:text-schedule-brand-blue hover:bg-surface-hover cursor-pointer'
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
                        <!-- Selected Count Badge -->
                        <span
                            v-if="selectedItems.length > 0"
                            class="bg-schedule-brand-blue flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white">
                            {{ selectedItems.length }}
                        </span>
                        <!-- Clear Button -->
                        <button
                            v-if="showClear && selectedItems.length > 0"
                            type="button"
                            class="text-text-tertiary shrink-0 transition-colors hover:text-red-500"
                            @click.stop="clearSelection"
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
                        <svg
                            class="text-text-tertiary h-4 w-4 shrink-0 transition-transform"
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
                    </template>
                </span>
            </button>

            <Teleport to="body">
                <transition name="fade">
                    <ul
                        v-if="open"
                        ref="dropdownRef"
                        :style="dropdownStyle"
                        class="border-border-default bg-surface-card z-100000 mt-1 max-h-60 overflow-auto rounded-xl border p-1 shadow-xl"
                        role="listbox"
                        tabindex="-1"
                        @click.stop>
                        <!-- Search input -->
                        <li
                            v-if="search"
                            class="bg-surface-card sticky top-0 z-10 px-1 py-1.5">
                            <div class="relative">
                                <input
                                    v-model="searchQuery"
                                    type="text"
                                    class="border-border-default bg-surface-subtle text-text-primary focus:border-border-strong focus:bg-surface-card w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-colors focus:outline-none"
                                    :placeholder="translations.search || 'Search...'"
                                    autocomplete="off" />
                                <svg
                                    class="text-text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
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

                        <!-- Select All / Deselect All -->
                        <li
                            v-if="filteredOptions.length > 0 && props.max === undefined"
                            class="px-2 py-1.5">
                            <button
                                type="button"
                                class="text-schedule-brand-blue hover:text-schedule-brand-blue-hover text-sm"
                                @click.stop="
                                    selectedItems.length === filteredOptions.length
                                        ? clearSelection()
                                        : emit(
                                              'update:modelValue',
                                              filteredOptions.map((opt) =>
                                                  typeof opt === 'object' ? opt[optionValue] : opt
                                              )
                                          )
                                ">
                                {{ selectedItems.length === filteredOptions.length ? translations.deselectAll || 'Deselect All' : translations.selectAll || 'Select All' }}
                            </button>
                        </li>

                        <!-- No results found -->
                        <li
                            v-if="filteredOptions.length === 0 && loading"
                            class="text-text-tertiary px-3 py-2 text-center text-sm">
                            {{ translations.loading || 'Loading...' }}
                        </li>
                        <li
                            v-if="filteredOptions.length === 0 && !loading"
                            class="text-text-tertiary px-3 py-2 text-center text-sm">
                            {{ translations.noResultsFound || 'No results found' }}
                        </li>

                        <!-- Options -->
                        <li
                            v-for="opt in filteredOptions"
                            :key="typeof opt === 'object' ? opt[optionValue] : opt"
                            :class="[
                                'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                                {
                                    'bg-surface-subtle': isSelected(opt),
                                    'hover:bg-surface-hover': !isSelected(opt),
                                    'cursor-not-allowed opacity-50': isMaxReached && !isSelected(opt)
                                }
                            ]"
                            @click="(!isMaxReached || isSelected(opt)) && toggleOption(opt)"
                            role="option"
                            :aria-selected="isSelected(opt)">
                            <!-- Checkbox -->
                            <span
                                :class="[
                                    'flex h-4 w-4 items-center justify-center rounded border-2 transition-colors',
                                    isSelected(opt)
                                        ? 'border-schedule-brand-blue bg-schedule-brand-blue'
                                        : 'border-border-strong bg-surface-card'
                                ]">
                                <svg
                                    v-if="isSelected(opt)"
                                    class="h-3 w-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="3"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            <!-- Option Label -->
                            <slot
                                name="option"
                                :option="opt"
                                :selected="isSelected(opt)">
                                {{ typeof opt === 'object' ? opt[optionLabel] : opt }}
                            </slot>
                        </li>
                        <li
                            v-if="!loading && createNew && (filteredOptions.length <= CREATE_NEW_DISPLAY)"
                            class="text-schedule-text-brand-primary flex cursor-pointer items-center gap-2 px-3 py-2 text-center hover:bg-gray-100 dark:hover:bg-gray-800"
                            @click.stop="
                                closeDropdown();
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
