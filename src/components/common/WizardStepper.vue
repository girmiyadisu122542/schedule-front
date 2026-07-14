<script setup lang="ts">
/**
 * Horizontal step indicator for guided/wizard flows. Completed steps show a
 * check and are clickable to jump back (with a hover lift); the current step is
 * brand-filled with a soft focus ring; upcoming steps are muted. The connector
 * between steps animates its fill as you progress. Stacks vertically on mobile.
 */
defineProps<{
    steps: { label: string; description?: string }[];
    current: number;
}>();

const emit = defineEmits<{ (e: 'navigate', index: number): void }>();
</script>

<template>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <template
            v-for="(step, index) in steps"
            :key="index">
            <button
                type="button"
                :disabled="index > current"
                class="group flex items-center gap-2.5 rounded-xl px-1.5 py-1 text-left transition-all"
                :class="index < current ? 'hover:bg-surface-hover cursor-pointer' : 'disabled:cursor-default'"
                @click="index < current && emit('navigate', index)">
                <span
                    class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300"
                    :class="
                        index < current
                            ? 'border-schedule-brand-blue bg-schedule-brand-blue text-white group-hover:scale-105'
                            : index === current
                              ? 'border-schedule-brand-blue text-schedule-brand-blue bg-schedule-brand-blue/10 ring-schedule-brand-blue/15 ring-4'
                              : 'border-border-default text-text-muted'
                    ">
                    <i
                        v-if="index < current"
                        class="fas fa-check text-xs" />
                    <template v-else>{{ index + 1 }}</template>
                </span>
                <span class="min-w-0">
                    <span
                        class="block truncate text-sm font-semibold transition-colors"
                        :class="index <= current ? 'text-text-primary' : 'text-text-muted'">
                        {{ step.label }}
                    </span>
                    <span
                        v-if="step.description"
                        class="text-text-tertiary block truncate text-xs">
                        {{ step.description }}
                    </span>
                </span>
            </button>
            <span
                v-if="index < steps.length - 1"
                class="bg-border-default relative ml-4 hidden h-0.5 flex-1 overflow-hidden rounded-full sm:block">
                <span
                    class="bg-schedule-brand-blue absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    :class="index < current ? 'w-full' : 'w-0'" />
            </span>
        </template>
    </div>
</template>
