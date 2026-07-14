<script setup lang="ts">
defineProps({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: ''
    },
    iconComponent: {
        type: Object,
        default: null
    }
});
</script>

<template>
    <div class="flex items-center gap-3">
        <i
            v-if="icon"
            :class="[icon, 'h-5 w-5 text-lg opacity-80']"></i>
        <component
            v-else-if="iconComponent"
            :is="iconComponent"
            class="h-5 w-5" />
        <div class="flex flex-col">
            <span class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ title }}
            </span>
            <span
                v-if="subtitle"
                class="text-xs text-gray-500 dark:text-gray-400">
                {{ subtitle }}
            </span>
        </div>
    </div>
</template>
