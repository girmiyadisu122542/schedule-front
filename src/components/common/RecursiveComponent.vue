<script setup lang="ts">
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import { useRecursiveComponent } from '@/composables/useRecursiveComponent';

interface Props {
    baseComponent: any;
    componentProps?: Record<string, any>;
    maxCols?: number;
    initialLabel?: string;
    dataTree: any[];
    isMultiSelect?: boolean;
    displayKey?: string;
    valueKey?: string;
    labelKey?: string;
    apiUrl?: string;
    modelValue?: any;
    isEditing?: boolean;
    isRequired?: boolean;
    placeholderTemplate?: string;
    initialParams?: Record<string, any>;
    fetchChildren?: (parent: any, level: number) => Promise<any[]>;
}

const searchQueryParam = defineModel<string>('search-query-param');
const props = withDefaults(defineProps<Props>(), {
    maxCols: 4,
    initialLabel: '',
    componentProps: () => ({}),
    isMultiSelect: false,
    displayKey: 'name',
    valueKey: 'id',
    labelKey: 'display_name',
    placeholderTemplate: '',
    initialParams: () => ({}),
    isEditing: false,
    isRequired: false
});

const emit = defineEmits(['change', 'clear', 'update:modelValue', 'resetToRoot', 'update:search-query-param']);

const { selections, gridClass, resetToRoot, handleUpdate, clearSelection, getPlaceholder } = useRecursiveComponent(
    props,
    emit
);
</script>

<template>
    <div class="bg-schedule-surface-elevated dark:border-schedule-border-inverse dark:bg-schedule-dark rounded-2xl">
        <div
            v-if="props.isEditing"
            class="mb-4 flex justify-start">
            <main-button
                :label="$lang.backToRoot"
                :rounded="true"
                :text="true"
                severity="secondary"
                size="small"
                @click="resetToRoot" />
        </div>
        <div :class="['grid gap-4', gridClass]">
            <div
                v-for="(level, index) in selections"
                :key="`${index}-${level.label}`"
                class="animate-in fade-in slide-in-from-left-2 w-full">
                <component
                    :is="props.baseComponent"
                    :modelValue="level.selectedId ?? props.modelValue"
                    :loading="level.isLoading"
                    @update:modelValue="(val: any) => handleUpdate(index, val)"
                    @clear="(val: any) => clearSelection(val)"
                    @update:search-query-param="
                        (val: string) => {
                            level.searchQuery = val;
                            searchQueryParam = val;
                            emit('update:search-query-param', val);
                        }
                    "
                    v-bind="{
                        ...props.componentProps,

                        options: level.options,
                        optionLabel: props.displayKey,
                        optionValue: props.valueKey,
                        labelText: level.label,
                        placeholder: getPlaceholder(level, index),
                        isRequired: props.isRequired && index === 0,

                        ...(props.baseComponent === MainSelect
                            ? {
                                  searchQueryParam: searchQueryParam ?? level.searchQuery
                              }
                            : {})
                    }" />
            </div>
        </div>
    </div>
</template>
