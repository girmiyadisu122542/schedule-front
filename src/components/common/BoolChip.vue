<script setup lang="ts">
defineProps<{ value: boolean }>();
</script>
<template>
    <span
        :class="
            value
                ? 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        ">
        <span
            class="h-1.5 w-1.5 rounded-full"
            :class="value ? 'bg-emerald-500' : 'bg-gray-400'" />
        {{ value ? 'Yes' : 'No' }}
    </span>
</template>
