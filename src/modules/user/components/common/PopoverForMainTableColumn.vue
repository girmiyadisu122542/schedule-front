<script setup lang="ts">
import { toRef, ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import XmarkIcon from '@/assets/icons/XmarkIcon.vue';

import type { UserAllowedAction } from '@/modules/user/constants/allowedActions';
import { usePopoverForMainTableColumn } from '@/composables/common/usePopoverForMainTableColumn';

const hoveredDatum = ref<number | null>(null);

const props = withDefaults(
    defineProps<{
        data?: any[];
        maxVisible?: number;
        permission: UserAllowedAction;
        title?: string;
        onClick?: (datum: any) => void;
        getRouteLocation?: ((datum: any) => RouteLocationRaw | null) | null;
    }>(),
    {
        data: () => [],
        maxVisible: 3,
        title: '',
        onClick: undefined,
        getRouteLocation: null
    }
);

const { 
    rootRef, 
    triggerRef, 
    popoverRef, 
    popoverStyle, 
    hiddenCount, 
    isOpen, 
    getDatumLabel, 
    isDatumNavigable, 
    handleDatumClick, 
    togglePopover 
} = usePopoverForMainTableColumn({
        data: toRef(props, 'data'),
        maxVisible: toRef(props, 'maxVisible'),
        getRouteLocation: toRef(props, 'getRouteLocation')
    });

const truncate = (text: string | any , length = 50) => {
    return text?.length > length
        ? `${text.slice(0, length)}...`
        : text;
};

defineEmits(['update:data']);

</script>

<template>
    <div
        ref="rootRef"
        class="flex w-fit flex-row items-center gap-2">
        <!-- Visible data -->
        <span
            v-for="datum in props.data.slice(0, props.maxVisible)"
            :key="datum.id"
            :title="getDatumLabel(datum)"
            @click="togglePopover"
            :aria-expanded="isOpen"
            class="text-schedule-text-brand-primary line-clamp-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-medium dark:border-gray-700 dark:bg-blue-900/30 dark:text-white">
            {{truncate(getDatumLabel(datum), 20)}}
        </span>

        <!-- popover Badge -->
        <div
            v-if="hiddenCount > 0"
            ref="triggerRef"
            class="relative inline-flex">
            <button
                type="button"
                :aria-expanded="isOpen"
                class="cursor-pointer rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500 transition hover:bg-gray-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                @click="togglePopover">
                +{{ hiddenCount }}
            </button>

            <!-- Popover -->
            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="scale-95 opacity-0"
                enter-to-class="scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="scale-100 opacity-100"
                leave-to-class="scale-95 opacity-0">
                <div
                    v-show="isOpen"
                    ref="popoverRef"
                    :style="popoverStyle"
                    class="z-[999] flex w-max max-w-[calc(100vw-8.5rem)] min-w-[10Srem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    <div class="mb-3 border-b border-gray-100 pb-2">
                        <h4 class="text-sm font-semibold text-gray-800 dark:text-schedule-text-tertiary">
                            {{ props.title }}
                        </h4>
                    </div>

                    <div class="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1">
                        <component
                            v-for="(datum, index) in props.data"
                            :is="isDatumNavigable(datum) ? 'button' : 'div'"
                            :key="datum.id ?? index"
                            :type="isDatumNavigable(datum) ? 'button' : undefined"
                            @mouseover="hoveredDatum = index"
                            @mouseleave="hoveredDatum = null"
                            class="group relative" >
                            <div
                                :class="[
                                    'text-schedule-text-brand-primary dark:text-schedule-text-tertiary flex items-center gap-2 px-3 text-left text-xs font-medium transition',
                                    hoveredDatum === index ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                                ]">
                                <span
                                    class="text-schedule-text-brand-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                    {{ index + 1 }}
                                </span>
                                <div>
                                    <span 
                                        :title="getDatumLabel(datum)"
                                        :class="[
                                            'line-clamp-2 break-words',
                                            isDatumNavigable(datum)
                                                ? 'cursor-pointer hover:underline'
                                                : 'cursor-default'
                                        ]"
                                        @click="handleDatumClick(datum)">
                                            {{ truncate(getDatumLabel(datum), 100) }}
                                    </span>
                                    <!-- Delete Icon -->
                                    <XmarkIcon
                                        :title="props.title"
                                        v-if=" hoveredDatum === index && $can(props.permission)"
                                        @click.stop="props.onClick ? props.onClick(datum) : undefined"
                                        class="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full p-1 text-red-500 transition hover:bg-red-100 hover:text-red-600 dark:hover:text-schedule-text-tertiary group-hover:flex dark:hover:bg-red-900 cursor-pointer"/>
                                </div>
                            </div>
                        </component>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>
