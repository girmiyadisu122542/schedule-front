<script setup lang="ts">
defineProps<{ label: string; value: boolean }>();
</script>
<template>
    <div class="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
        <span class="text-sm text-gray-600 dark:text-gray-400">{{ label }}</span>
        <span class="flex items-center gap-1.5">
            <span
                class="h-2 w-2 shrink-0 rounded-full"
                :class="value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'" />
            <span
                class="text-xs font-medium"
                :class="value ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'">
                {{ value ? 'On' : 'Off' }}
            </span>
        </span>
    </div>
</template>
