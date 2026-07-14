<script setup lang="ts">
import RefreshIcon from '@/assets/icons/RefreshIcon.vue';

const props = withDefaults(
    defineProps<{
        loading?: boolean;
        title?: string;
    }>(),
    {
        loading: false,
        title: ''
    }
);

defineEmits<{
    (event: 'click'): void;
}>();
</script>

<template>
    <button
        type="button"
        class="text-text-tertiary hover:text-schedule-brand-blue inline-flex items-center justify-center transition disabled:cursor-wait"
        :disabled="props.loading"
        :title="props.title || $lang.refresh"
        :aria-label="props.title || $lang.refresh"
        @click="$emit('click')">
        <RefreshIcon
            :size="14"
            :class="{ 'animate-spin': props.loading }" />
    </button>
</template>
