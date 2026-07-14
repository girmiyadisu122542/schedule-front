<script setup lang="ts">
const props = defineProps<{
    labelText?: string;
    isRequired?: boolean;
    helperMessage?: string;
    /** NEW: Enables floating behavior */
    isFloating?: boolean;
    /** NEW: State passed from parent to trigger the float */
    isFloated?: boolean;
}>();
</script>

<template>
    <div
        v-if="labelText"
        :class="{ relative: isFloating }">
        <label
            :class="[
                'pointer-events-none mb-1.5 block text-sm font-medium',
                isFloating ? 'absolute z-10' : '',
                // Position when floated (on top of border)
                isFloating && isFloated
                    ? 'text-schedule-border-brand -top-2 left-2 bg-white px-1 text-xs dark:bg-gray-900'
                    : '',
                // Position when acting as placeholder
                isFloating && !isFloated ? 'top-2.5 left-3 text-base text-gray-400' : '',
                !isFloating ? 'text-schedule-text-secondary dark:text-gray-400' : ''
            ]">
            {{ props.labelText }}
            <span
                v-if="props.isRequired"
                class="text-red-500">
                *
            </span>
        </label>

        <p
            v-if="props.helperMessage && !isFloating"
            class="mb-1 text-xs font-normal text-gray-600 dark:text-gray-400">
            {{ props.helperMessage }}
        </p>
    </div>
</template>
