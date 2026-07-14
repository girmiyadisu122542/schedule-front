<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{ title: string; subtitle?: string; icon?: Component }>();
</script>

<template>
    <section class="schedule-card flex flex-col p-5">
        <header class="mb-4 flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
                <span
                    v-if="icon"
                    class="bg-schedule-brand-blue-subtle text-schedule-icon-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <component
                        :is="icon"
                        class="h-5 w-5" />
                </span>
                <div>
                    <h2 class="text-text-primary text-sm font-semibold">{{ title }}</h2>
                    <p
                        v-if="subtitle"
                        class="text-text-tertiary text-xs">
                        {{ subtitle }}
                    </p>
                </div>
            </div>
            <slot name="actions" />
        </header>

        <div class="flex-1">
            <slot />
        </div>

        <slot name="footer" />
    </section>
</template>
