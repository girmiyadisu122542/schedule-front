<script setup lang="ts">
import BoxIcon from '@/assets/icons/BoxIcon.vue';

defineProps<{
    title: string;
    description?: string;
}>();
</script>

<template>
    <div class="space-y-8">
        <header>
            <h1 class="text-text-primary text-2xl font-bold">{{ title }}</h1>
            <p
                v-if="description"
                class="text-text-tertiary mt-1 text-sm">
                {{ description }}
            </p>
        </header>

        <div
            class="bg-surface-card border-border-default flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
            <span
                class="bg-schedule-brand-blue-subtle text-schedule-icon-brand flex h-14 w-14 items-center justify-center rounded-2xl">
                <BoxIcon class="h-6 w-6" />
            </span>
            <p class="text-text-secondary text-base font-semibold">Coming soon</p>
            <p class="text-text-tertiary max-w-md text-sm">This page is scaffolded and ready to be built out.</p>
        </div>
    </div>
</template>
