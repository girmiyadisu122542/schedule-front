<script setup lang="ts">
defineProps<{
    label?: string;
    hint?: string;
    hintPosition?: string;
    error?: string;
    required?: boolean;
}>();
</script>

<template>
    <div class="space-y-2">
        <div class="pl-1">
            <label class="flex space-x-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                <span class="self-center">{{ label }}</span>
                <span
                    v-if="required"
                    class="text-schedule-error-500 self-center text-base">
                    *
                </span>
            </label>
            <p
                v-if="hint && !hintPosition"
                class="text-xs text-gray-500 dark:text-gray-400">
                {{ hint }}
            </p>
        </div>
        <slot />

        <p
            v-if="hint && hintPosition"
            class="text-xs text-gray-500 dark:text-gray-400">
            {{ hint }}
        </p>
        <p
            v-if="error"
            class="pl-1 text-xs text-red-500">
            {{ error }}
        </p>
    </div>
</template>
