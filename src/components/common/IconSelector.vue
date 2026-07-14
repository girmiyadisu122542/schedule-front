<script setup lang="ts">
import { computed, watch, shallowRef } from 'vue';
import { camelCaseToTitleCase } from '@/utils/commonUtils';
import MainSelect from '@/components/common/MainSelect.vue';
import { useAllIconRegistry } from '@/composables/useAllIconRegistry';

const allIcons = useAllIconRegistry;
const iconNames = Object.keys(allIcons);

const props = defineProps<{
    modelValue: string | null;
    placeholder?: string;
    invalid?: boolean;
    message?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const options = computed(() =>
    iconNames.map((name) => ({
        label: camelCaseToTitleCase(name),
        value: name,
        icon: allIcons[name]
    }))
);

const iconComponent = shallowRef<any>(null);

watch(
    () => props.modelValue,
    (newVal) => {
        iconComponent.value = newVal ? allIcons[newVal] || null : null;
    },
    { immediate: true }
);
</script>

<template>
    <div class="space-y-2">
        <MainSelect
            :modelValue="modelValue"
            :options="options"
            :placeholder="placeholder || 'Select an icon'"
            :invalid="invalid"
            :message="message"
            :search="true"
            showClear
            :isOptionsIcon="true"
            :selectedIcon="iconComponent"
            @update:modelValue="emit('update:modelValue', $event)"
            class="w-full" />
    </div>
</template>
