<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import CircleIcon from '@/assets/icons/CircleIcon.vue';
import { useCommonIconRegistry } from '@/composables/useCommonIconRegistry';
import { COMPLETED, CURRENT, HORIZONTAL, PENDING, VERTICAL } from '@/modules/user/constants/fixedValues';

export interface StepItem {
    id?: string | number;
    title: string;
    description?: string;
    icon?: string;
    disabled?: boolean;
}

interface Props {
    title?: string;
    subtitle?: string;
    titleIcon?: Component;
    direction?: typeof VERTICAL | typeof HORIZONTAL;
    color?: string;
    currentStep?: number;
    clickable?: boolean;
    showNumbers?: boolean;
    items: StepItem[];
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
    direction: VERTICAL,
    color: '',
    currentStep: 0,
    clickable: true,
    showNumbers: false
});

const emit = defineEmits<{
    stepClick: [step: StepItem, index: number];
}>();

const isVertical = computed(() => props.direction === VERTICAL);

const resolveIcon = (icon?: string): Component => {
    return (icon && useCommonIconRegistry[icon]) || CircleIcon;
};

const getStatus = (index: number) => {
    if (index < props.currentStep) {
        return COMPLETED;
    }

    if (index === props.currentStep) {
        return CURRENT;
    }

    return PENDING;
};

const handleClick = (step: StepItem, index: number) => {
    if (!props.clickable || step.disabled) {
        return;
    }

    emit('stepClick', step, index);
};
</script>

<template>
    <div class="border-schedule-border-subtle dark:bg-schedule-dark rounded-3xl border bg-white p-6">
        <div
            class="mb-8"
            :class="[props.titleIcon ? 'flex items-center gap-4' : '']">
            <div v-if="props.titleIcon">
                <Component :is="props.titleIcon" />
            </div>
            <div>
                <h2
                    v-if="title"
                    class="text-xl font-bold">
                    {{ title || $lang.steps || 'Steps' }}
                </h2>

                <p
                    v-if="subtitle"
                    class="mt-1 text-gray-500">
                    {{ subtitle || $lang.stepsDescription || 'Steps description' }}
                </p>
            </div>
        </div>
        <div
            v-if="isVertical"
            class="space-y-0">
            <div
                v-for="(step, index) in items"
                :key="step.id ?? index"
                class="relative grid grid-cols-[56px_1fr] gap-4">
                <div
                    v-if="index < items.length - 1"
                    class="absolute top-10 bottom-0 left-6.75 w-0.5"
                    :class="color ? color : 'bg-schedule-brand-blue'" />

                <div class="relative flex justify-center">
                    <div
                        :class="[
                            'relative z-10 flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white transition-all',
                            color ? color : 'bg-schedule-brand-blue'
                        ]">
                        <template v-if="step.icon">
                            <span class="h-5 w-5 rounded-full">
                                <component
                                    :is="resolveIcon(step.icon)"
                                    class="h-5 w-5 font-bold" />
                            </span>
                        </template>

                        <template v-else-if="showNumbers">
                            {{ index + 1 }}
                        </template>

                        <template v-else>
                            <span class="h-3 w-3 rounded-full bg-white"></span>
                        </template>
                    </div>
                </div>

                <div
                    class="pb-8"
                    :class="[clickable && !step.disabled ? 'cursor-pointer' : '']"
                    @click="handleClick(step, index)">
                    <div
                        class="bg-schedule-primary dark:bg-schedule-dark border-schedule-border-subtle rounded-2xl border p-5 transition-all"
                        :class="clickable && !step.disabled ? 'hover:shadow-md' : ''">
                        <slot
                            name="step"
                            :step="step"
                            :index="index"
                            :status="getStatus(index)">
                            <h3 class="text-schedule-text-secondary text-lg font-semibold">
                                {{ step.title }}
                            </h3>

                            <p
                                v-if="step.description"
                                class="text-schedule-text-tertiary mt-2 text-xs">
                                {{ step.description }}
                            </p>
                        </slot>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-else
            class="relative">
            <div class="relative flex justify-start">
                <div
                    v-for="(step, index) in items"
                    :key="step.id ?? index"
                    class="flex flex-1 flex-col items-start">
                    <div
                        v-if="index < items.length - 1"
                        class="absolute top-5 right-0 left-0 h-0.5"
                        :class="color ? color : 'bg-schedule-brand-blue'" />

                    <div
                        :class="[
                            'relative z-10 flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white transition-all',
                            color ? color : 'bg-schedule-brand-blue',
                            clickable && !step.disabled ? 'cursor-pointer' : ''
                        ]"
                        @click="handleClick(step, index)">
                        <template v-if="step.icon">
                            <span class="h-5 w-5 rounded-full">
                                <component
                                    :is="resolveIcon(step.icon)"
                                    class="h-5 w-5" />
                            </span>
                        </template>

                        <template v-else-if="showNumbers">
                            {{ index + 1 }}
                        </template>

                        <template v-else>
                            <span class="h-3 w-3 rounded-full bg-white"></span>
                        </template>
                    </div>

                    <div
                        class="mt-4 w-full px-2 text-start"
                        :class="clickable && !step.disabled ? 'cursor-pointer' : ''"
                        @click="handleClick(step, index)">
                        <slot
                            name="step"
                            :step="step"
                            :index="index"
                            :status="getStatus(index)">
                            <div class="font-semibold">
                                {{ step.title }}
                            </div>

                            <div
                                v-if="step.description"
                                class="mt-1 text-sm text-gray-500">
                                {{ step.description }}
                            </div>
                        </slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
