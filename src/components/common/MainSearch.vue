<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, computed, watch, type Component } from 'vue';
import { useDebounceFn, onClickOutside } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';

export interface SearchResult<T = any> {
    id: string | number;
    label: string;
    icon?: any;
    data?: T;
    [key: string]: any;
}

interface Props {
    modelValue?: string;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    containerClass?: string;
    roundedClass?: string;
    bgClass?: string;
    borderClass?: string;
    textColor?: string;
    customClass?: string;
    icon?: Component | null;
    iconPosition?: 'left' | 'right';
    iconColor?: string;
    hasInlineButton?: boolean;
    buttonPosition?: 'left' | 'right';
    buttonLabel?: string;
    buttonIcon?: Component | null;
    buttonClass?: string;
    buttonRoundedClass?: string;
    showResults?: boolean;
    results?: SearchResult[];
    isServerSide?: boolean;
    debounceMs?: number;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: undefined,
    size: 'md',
    roundedClass: 'rounded-xl',
    bgClass: 'bg-gray-50 dark:bg-schedule-dark focus:bg-white',
    borderClass: 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
    textColor: 'text-gray-700',
    iconPosition: 'left',
    iconColor: 'text-gray-400',
    buttonPosition: 'right',
    buttonClass: 'bg-blue-600 text-white hover:bg-blue-700',
    buttonRoundedClass: 'rounded-lg',
    debounceMs: 300,
    showResults: false,
    results: () => []
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'search', value: string): void;
    (e: 'action', value: string): void;
    (e: 'select', item: SearchResult): void;
}>();

const languageStore = useLanguageStore();

const { translations } = storeToRefs(languageStore);

const query = ref(props.modelValue || '');
const isFocused = ref(false);
const resultsRef = ref<HTMLElement | null>(null);

const resolvedSearchPlaceholder = computed(() => {
    return props.placeholder || translations.value.search;
});

watch(
    () => props.modelValue,
    (newVal) => {
        query.value = newVal || '';
    }
);

const hasLeftIcon = computed(() => !!props.icon && props.iconPosition === 'left');
const hasRightIcon = computed(() => !!props.icon && props.iconPosition === 'right');
const hasLeftButton = computed(() => props.hasInlineButton && props.buttonPosition === 'left');
const hasRightButton = computed(() => props.hasInlineButton && props.buttonPosition === 'right');

const paddingLeft = computed(() => {
    if (hasLeftButton.value && hasLeftIcon.value) return 'pl-40';
    if (hasLeftButton.value) return 'pl-28';
    if (hasLeftIcon.value) return 'pl-10';
    return 'pl-4';
});

const paddingRight = computed(() => {
    if (hasRightButton.value && hasRightIcon.value) return 'pr-40';
    if (hasRightButton.value) return 'pr-28';
    if (hasRightIcon.value) return 'pr-10';
    return 'pr-4';
});

const getHighlightedText = (text: string) => {
    if (!query.value) return text;
    const regex = new RegExp(`(${query.value})`, 'gi');
    return text.replace(regex, `<span class="text-blue-700 font-bold">$1</span>`);
};

const handleSelect = (item: SearchResult) => {
    query.value = item.label;
    isFocused.value = false;
    emit('select', item);
    emit('update:modelValue', item.label);
};

const executeSearch = useDebounceFn((val: string) => {
    props.isServerSide ? emit('search', val) : emit('update:modelValue', val);
}, props.debounceMs);

const handleInput = (e: Event) => {
    executeSearch((e.target as HTMLInputElement).value);
};

const sizeClasses = { sm: 'py-1.5 text-xs', md: 'py-2.5 text-sm', lg: 'py-3.5 text-base', xl: 'py-4 text-lg' };
const iconSizeClass = computed(() =>
    props.size === 'sm' ? 'h-3.5 w-3.5' : props.size === 'xl' ? 'h-6 w-6' : 'h-5 w-5'
);
const buttonSizeClass = computed(() =>
    props.size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs font-semibold'
);
onClickOutside(resultsRef, () => {
    isFocused.value = false;
});
</script>

<template>
    <div :class="['relative flex w-full items-center', containerClass]">
        <div
            v-if="hasLeftIcon || hasLeftButton"
            class="absolute inset-y-0 left-0 z-10 flex items-center gap-2 pl-3">
            <component
                v-if="hasLeftIcon"
                :is="icon"
                :class="[iconSizeClass, iconColor]"
                class="pointer-events-none" />
            <button
                v-if="hasLeftButton"
                type="button"
                @click.stop="$emit('action', query)"
                :class="[buttonSizeClass, buttonRoundedClass, buttonClass]">
                <component
                    :is="buttonIcon"
                    v-if="buttonIcon"
                    class="h-4 w-4" />
                <span
                    v-if="buttonLabel"
                    class="ml-1">
                    {{ buttonLabel }}
                </span>
            </button>
        </div>

        <input
            ref="inputRef"
            v-model="query"
            type="text"
            :placeholder="resolvedSearchPlaceholder"
            :class="[
                'block w-full border transition-all duration-200 outline-none',
                sizeClasses[size],
                paddingLeft,
                paddingRight,
                roundedClass,
                bgClass,
                borderClass,
                textColor,
                customClass
            ]"
            @input="handleInput"
            @focus="isFocused = true" />

        <div
            v-if="hasRightIcon || hasRightButton"
            class="absolute inset-y-0 right-0 z-10 flex items-center gap-2 pr-1.5">
            <component
                v-if="hasRightIcon"
                :is="icon"
                :class="[iconSizeClass, iconColor]"
                class="pointer-events-none" />
            <button
                v-if="hasRightButton"
                type="button"
                @click.stop="$emit('action', query)"
                :class="[buttonSizeClass, buttonRoundedClass, buttonClass]">
                <component
                    :is="buttonIcon"
                    v-if="buttonIcon"
                    class="h-4 w-4" />
                <span
                    v-if="buttonLabel"
                    class="ml-1">
                    {{ buttonLabel }}
                </span>
            </button>
        </div>

        <div
            v-if="showResults && isFocused && query.length > 0"
            ref="resultsRef"
            class="absolute top-full z-100 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div
                v-if="results && results.length > 0"
                class="max-h-72 overflow-y-auto p-2">
                <div
                    v-for="item in results"
                    :key="item.id"
                    @click="handleSelect(item)"
                    class="group flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div class="flex items-center gap-3">
                        <component
                            :is="item.icon || icon || 'i'"
                            class="group-hover:text-schedule-brand-blue h-4 w-4 text-gray-400" />
                        <span
                            class="text-sm text-gray-700 dark:text-gray-200"
                            v-html="getHighlightedText(item.label)"></span>
                    </div>
                    <i
                        class="fa-solid fa-chevron-right text-[10px] text-gray-300 opacity-0 group-hover:opacity-100"></i>
                </div>
            </div>

            <div
                v-else
                class="flex flex-col items-center justify-center py-10 text-center">
                <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700">
                    <i class="fa-solid fa-magnifying-glass text-gray-300"></i>
                </div>
                <p class="text-sm font-bold text-gray-600 dark:text-gray-300">{{ $lang.noResultsFound }}</p>
                <p class="text-xs text-gray-400">{{ $lang.tryADifferentSearchTerm }}</p>
            </div>
        </div>
    </div>
</template>
