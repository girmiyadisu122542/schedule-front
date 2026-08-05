<script setup lang="ts">
import type { Component } from 'vue';
import CircleIcon from '@/assets/icons/CircleIcon.vue';
import ExternalLink from '@/assets/icons/ExternalLink.vue';

export interface StepItem {
    id?: string | number;
    title: string;
    icon?: string;
    disabled?: boolean;
    name?: string;
    version?: string;
}

interface Props {
    title?: string;
    version?: number;
    titleIcon?: Component;
    color?: string;
    currentStep?: number;
    clickable?: boolean;
    showNumbers?: boolean;
    items: StepItem[];
    needBorder?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    color: '',
    currentStep: 0,
    clickable: true,
    showNumbers: false,
    needBorder: true,
});

const emit = defineEmits<{
    (e: 'stepClick', step: StepItem, index: number): void;
    (e: 'view'): void;
}>();

const handleClick = (step: StepItem, index: number) => {
    if (!props.clickable || step.disabled) {
        return;
    }

    emit('stepClick', step, index);
};
</script>

<template>
    <div 
        class="bg-surface-card mt-3 rounded-3xl p-6"
        :class="[props.needBorder ? 'border-schedule-border-subtle border' : '']">
        <div
            class="mb-4"
            :class="[props.titleIcon ? 'flex items-center gap-4' : '']">
            <div v-if="props.titleIcon">
                <Component :is="props.titleIcon" />
            </div>
            <div>
                <h2
                    v-if="title"
                    class="text-2xl font-bold">
                    {{ title || $lang.steps || 'Steps' }}
                </h2>
            </div>
        </div>
        <div
            class="space-y-0">
            <div
                v-for="(step, index) in items"
                :key="step.id ?? index"
                class="relative grid grid-cols-[55px_1fr] gap-4">
                <div
                    v-if="index < items.length - 1"
                    class="absolute top-3 bottom-3 left-6.75 w-[0.5px]"
                    :class="color ? color : 'bg-schedule-neutral-700'" />

                <div class="relative flex justify-center">
                    <div
                        :class="[
                            'relative z-10 flex h-2 w-2 items-center justify-center rounded-full font-semibold text-white transition-all',
                            color ? color : 'bg-schedule-neutral-700'
                        ]">
                        <template v-if="step.icon">
                            <span class="h-1 w-1 rounded-full">
                                <component
                                    :is="step.icon || CircleIcon"
                                    class="h-1 w-1" />
                            </span>
                        </template>

                        <template v-else-if="showNumbers">
                            {{ index + 1 }}
                        </template>
                    </div>
                </div>

                <div
                    class="pb-1"
                    :class="[clickable && !step.disabled ? 'cursor-pointer' : '']"
                    @click="handleClick(step, index)">
                    <div class="px-5 py-1 transition-all">
                        <slot
                            name="step"
                            :step="step"
                            :index="index">
                            <div class="group flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-gray-50">
                                <p class="text-gray-500">
                                    {{ step.title }}
                                </p>

                                <div v-if="props.clickable"
                                    class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium opacity-0 transition-all duration-200 group-hover:opacity-100">
                                    <span>{{ step.name }} {{ $lang.version }} {{ step.version }}</span>

                                    <ExternalLink @click="$emit('view')"/>
                                </div>
                            </div>
                        </slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
