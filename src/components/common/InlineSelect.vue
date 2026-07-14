<script setup lang="ts">
import type { PropType } from 'vue';
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

import {
    BADGE_VARIANT,
    CONTROL_SIZE,
    OPTION_VALUE_OBJECT,
    TYPE_OBJECT,
    OPTION_FIELD,
    CSS_POSITION_FIXED,
    TRANSFORM_ORIGIN,
    type BadgeVariant,
    type ControlSize,
    type TransformOrigin
} from '@/config/appConfig';

import SearchIcon from '@/assets/icons/Search.vue';
import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import FormLoader from '@/assets/icons/FormLoader.vue';
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';
import CheckTickIcon from '@/assets/icons/CheckTickIcon.vue';
import ChevronArrowDown from '@/assets/icons/ChevronArrowDown.vue';

const props = defineProps({
    modelValue: { type: [String, Number, Object, Array, null] as PropType<any>, default: null },
    options: { type: Array as PropType<any[]>, default: () => [] },
    optionLabel: { type: String, default: OPTION_FIELD.LABEL },
    optionValue: { type: String, default: OPTION_FIELD.VALUE },
    placeholder: { type: String, default: '' },
    multiple: { type: Boolean, default: false },
    bordered: { type: Boolean, default: false },
    chevron: { type: Boolean, default: false },
    isOptionsIcon: { type: Boolean, default: false },
    optionIcon: { type: String, default: OPTION_FIELD.ICON },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    search: { type: Boolean, default: false },
    serverSide: { type: Boolean, default: false },
    showClear: { type: Boolean, default: false },
    showRefresh: { type: Boolean, default: false },
    refreshTitle: { type: String, default: '' },
    autoOpen: { type: Boolean, default: false },
    invalid: { type: Boolean, default: false },
    message: { type: String, default: '' },
    messageType: { type: String as PropType<BadgeVariant>, default: BADGE_VARIANT.ERROR },
    size: { type: String as PropType<ControlSize>, default: CONTROL_SIZE.NORMAL },
    maxDisplay: { type: Number, default: 2 },
    searchQueryParam: { type: String, default: '' }
});

const emit = defineEmits([
    'update:modelValue',
    'change',
    'clear',
    'refresh',
    'close',
    'search-input',
    'update:search-query-param'
]);

const open = ref(false);
const isRefreshing = ref(false);
const isBusy = computed(() => isRefreshing.value || props.loading);
const searchQuery = ref(props.searchQueryParam);
const buttonRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const optionValueOf = (option: any) => {
    if (!props.optionValue || props.optionValue === OPTION_VALUE_OBJECT) return option;
    return typeof option === TYPE_OBJECT && option !== null ? option[props.optionValue] : option;
};
const optionLabelOf = (option: any) =>
    typeof option === TYPE_OBJECT && option !== null ? option[props.optionLabel] : option;
const optionIconOf = (option: any) =>
    typeof option === TYPE_OBJECT && option !== null ? option[props.optionIcon] : null;

const selectedValues = computed<any[]>(() => {
    if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : [];
    return props.modelValue === null || props.modelValue === undefined ? [] : [props.modelValue];
});

const isSelected = (option: any) => selectedValues.value.some((value) => value === optionValueOf(option));

const selectedOptions = computed(() => props.options.filter((option) => isSelected(option)));

const selectedSingleOption = computed(() => (props.multiple ? null : (selectedOptions.value[0] ?? null)));

const hasSelection = computed(() => selectedValues.value.length > 0);
const allFilteredSelected = computed(
    () => filteredOptions.value.length > 0 && filteredOptions.value.every((option) => isSelected(option))
);

const displayText = computed(() => {
    const labels = selectedOptions.value.map((option) => optionLabelOf(option));
    if (labels.length === 0) return '';
    if (labels.length <= props.maxDisplay) return labels.join(', ');
    return `${labels.slice(0, props.maxDisplay).join(', ')} +${labels.length - props.maxDisplay}`;
});

const filteredOptions = ref<any[]>([...props.options]);

function applyLocalFilter(query: string) {
    if (!props.search || props.serverSide || !query) {
        filteredOptions.value = [...props.options];
        return;
    }
    const lowered = query.toLowerCase();
    filteredOptions.value = props.options.filter((option) =>
        String(optionLabelOf(option)).toLowerCase().includes(lowered)
    );
}

watch(
    () => props.searchQueryParam,
    (value) => {
        if (value !== searchQuery.value) searchQuery.value = value;
    }
);

watch(searchQuery, (value) => {
    emit('update:search-query-param', value);
    applyLocalFilter(value);
    emit('search-input', value);
});

watch(
    () => props.options,
    () => applyLocalFilter(searchQuery.value),
    { deep: true, immediate: true }
);

function selectOption(option: any) {
    const value = optionValueOf(option);

    if (props.multiple) {
        const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
        const index = current.indexOf(value);
        if (index > -1) current.splice(index, 1);
        else current.push(value);
        emit('update:modelValue', current);
        emit('change', current);
        return;
    }

    emit('update:modelValue', value);
    emit('change', value);
    open.value = false;
}

function clearSelection() {
    emit('update:modelValue', props.multiple ? [] : null);
    emit('change', props.multiple ? [] : null);
    emit('clear');
}

// Multi-select only: select every option currently in view (search-filtered),
// or clear them all if they are already selected. Mirrors MultipleSelect.
function toggleSelectAll() {
    if (allFilteredSelected.value) {
        emit('update:modelValue', []);
        emit('change', []);
        return;
    }
    const values = filteredOptions.value.map((option) => optionValueOf(option));
    emit('update:modelValue', values);
    emit('change', values);
}

function handleRefresh() {
    if (isBusy.value) return;
    isRefreshing.value = true;
    emit('refresh');
    // Fallback release when the host doesn't drive a `loading` prop.
    setTimeout(() => {
        isRefreshing.value = false;
    }, 1200);
}

function toggleDropdown() {
    if (props.disabled || props.loading) return;
    open.value = !open.value;
}
function closeDropdown() {
    open.value = false;
}

function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.value?.contains(event.target as Node)) return;
    if (buttonRef.value?.contains(event.target as Node)) return;
    closeDropdown();
}

function updateDropdownPosition() {
    if (!buttonRef.value || !open.value) return;
    const rect = buttonRef.value.getBoundingClientRect();
    const dropdownHeight = dropdownRef.value?.offsetHeight || 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + 4;
    let transformOrigin: TransformOrigin = TRANSFORM_ORIGIN.TOP;
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight - 4;
        transformOrigin = TRANSFORM_ORIGIN.BOTTOM;
    }

    dropdownStyle.value = {
        position: CSS_POSITION_FIXED,
        top: `${top}px`,
        left: `${rect.left}px`,
        minWidth: `${rect.width}px`,
        'transform-origin': transformOrigin
    };
}

function handleScroll() {
    if (open.value) updateDropdownPosition();
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
        searchQuery.value = '';
        document.removeEventListener('click', handleClickOutside, true);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
        emit('close');
    }
});

onMounted(() => {
    if (props.autoOpen) open.value = true;
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside, true);
    window.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('resize', handleScroll);
});
</script>

<template>
    <div class="relative w-full">
        <button
            ref="buttonRef"
            type="button"
            :disabled="disabled"
            :class="[
                'flex w-full items-center gap-2 text-left transition focus:outline-none',
                bordered
                    ? 'border-border-default bg-surface-card rounded-lg border px-3 py-2'
                    : 'hover:bg-surface-hover rounded-md px-1.5 py-1',
                invalid ? 'border-schedule-error-500' : '',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                size === CONTROL_SIZE.SMALL ? 'text-sm' : size === CONTROL_SIZE.LARGE ? 'text-base' : 'text-sm'
            ]"
            aria-haspopup="listbox"
            :aria-expanded="open"
            @click="toggleDropdown">
            <span
                v-if="hasSelection"
                class="text-text-primary flex min-w-0 flex-1 items-center gap-1.5"
                :title="displayText">
                <slot
                    name="value"
                    :value="selectedSingleOption"
                    :values="selectedOptions"
                    :displayText="displayText">
                    <component
                        :is="optionIconOf(selectedSingleOption)"
                        v-if="isOptionsIcon && optionIconOf(selectedSingleOption)"
                        class="h-4 w-4 shrink-0" />
                    <span class="min-w-0 flex-1 truncate">{{ displayText }}</span>
                </slot>
            </span>
            <span
                v-else
                class="text-text-muted block flex-1 truncate"
                :title="placeholder">
                {{ placeholder }}
            </span>

            <span class="ml-auto flex shrink-0 items-center gap-1.5">
                <button
                    v-if="showRefresh"
                    type="button"
                    :disabled="isBusy"
                    :title="refreshTitle || $lang.refresh || 'Refresh'"
                    :class="[
                        'rounded-md p-0.5 transition-colors',
                        isBusy
                            ? 'text-schedule-brand-blue cursor-wait'
                            : 'text-text-tertiary hover:text-schedule-brand-blue hover:bg-surface-hover cursor-pointer'
                    ]"
                    @click.stop="handleRefresh">
                    <RefreshIcon
                        :size="14"
                        :class="{ 'animate-spin': isBusy }" />
                </button>
                <FormLoader
                    v-if="loading && !showRefresh"
                    class="text-schedule-brand-blue h-4 w-4 shrink-0 animate-spin"
                    aria-hidden="true" />
                <button
                    v-if="showClear && hasSelection && !loading"
                    type="button"
                    class="text-text-tertiary hover:text-schedule-error-500 cursor-pointer transition-colors"
                    :aria-label="$lang.clear || 'Clear'"
                    @click.stop="clearSelection">
                    <XmarkIcon class="h-4 w-4" />
                </button>
                <ChevronArrowDown
                    v-if="chevron && !loading"
                    class="text-text-tertiary h-4 w-4 shrink-0 transition-transform"
                    :class="[open ? 'rotate-180' : '']"
                    :stroke-width="2" />
            </span>
        </button>

        <Teleport to="body">
            <transition name="fade">
                <ul
                    v-if="open"
                    ref="dropdownRef"
                    :style="dropdownStyle"
                    class="border-border-default bg-surface-card z-100000 mt-1 max-h-60 space-y-1 overflow-auto rounded-2xl border p-1.5 shadow-xl"
                    role="listbox"
                    tabindex="-1"
                    @click.stop>
                    <li
                        v-if="search"
                        class="bg-surface-card sticky top-0 z-10 px-1 py-1.5">
                        <div class="relative">
                            <input
                                v-model="searchQuery"
                                type="text"
                                class="border-border-default bg-surface-subtle text-text-primary focus:border-border-strong focus:bg-surface-card w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-colors focus:outline-none"
                                :placeholder="$lang.search || 'Search...'"
                                autocomplete="off" />
                            <SearchIcon
                                class="text-text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                                :stroke-width="2" />
                        </div>
                    </li>

                    <li
                        v-if="multiple && filteredOptions.length > 0"
                        class="flex items-center justify-between px-2 py-1">
                        <button
                            type="button"
                            class="text-schedule-brand-blue cursor-pointer text-sm"
                            @click.stop="toggleSelectAll">
                            {{
                                allFilteredSelected
                                    ? $lang.deselectAll || 'Deselect All'
                                    : $lang.selectAll || 'Select All'
                            }}
                        </button>
                        <button
                            v-if="hasSelection"
                            type="button"
                            class="text-text-tertiary hover:text-schedule-error-500 cursor-pointer text-sm"
                            @click.stop="clearSelection">
                            {{ $lang.clear || 'Clear' }}
                        </button>
                    </li>

                    <li
                        v-if="filteredOptions.length === 0 && loading"
                        class="text-text-tertiary px-3 py-2 text-center text-sm">
                        {{ $lang.loading || 'Loading...' }}
                    </li>
                    <li
                        v-else-if="filteredOptions.length === 0"
                        class="text-text-tertiary px-3 py-2 text-center text-sm">
                        {{ $lang.noResultsFound || 'No results found' }}
                    </li>

                    <li
                        v-for="option in filteredOptions"
                        :key="optionValueOf(option)"
                        :class="[
                            'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                            isSelected(option)
                                ? 'bg-surface-subtle text-text-primary'
                                : 'text-text-secondary hover:bg-surface-hover'
                        ]"
                        role="option"
                        :aria-selected="isSelected(option)"
                        @click="selectOption(option)">
                        <slot
                            name="option"
                            :option="option"
                            :selected="isSelected(option)">
                            <span class="flex min-w-0 items-center gap-2.5">
                                <component
                                    :is="optionIconOf(option)"
                                    v-if="isOptionsIcon && optionIconOf(option)"
                                    class="h-4 w-4 shrink-0" />
                                <span class="truncate">{{ optionLabelOf(option) }}</span>
                            </span>
                        </slot>
                        <CheckTickIcon
                            v-if="isSelected(option)"
                            class="text-text-primary h-4 w-4 shrink-0"
                            :stroke-width="2.5" />
                    </li>
                </ul>
            </transition>
        </Teleport>

        <span
            v-if="message"
            :class="[
                'mt-1 block text-xs',
                messageType === BADGE_VARIANT.ERROR ? 'text-red-500' : '',
                messageType === BADGE_VARIANT.SUCCESS ? 'text-green-500' : '',
                messageType === BADGE_VARIANT.WARNING ? 'text-yellow-500' : '',
                messageType === BADGE_VARIANT.INFO ? 'text-blue-500' : ''
            ]">
            {{ message }}
        </span>
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
