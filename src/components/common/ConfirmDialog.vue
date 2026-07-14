<script setup lang="ts">
import { computed } from 'vue';

import MainButton from '@/components/common/MainButton.vue';

import InfoIcon from '@/assets/icons/InfoIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import ToggleLeft from '@/assets/icons/ToggleLeft.vue';
import ToggleRight from '@/assets/icons/ToggleRight.vue';
import RightArrowIcon from '@/assets/icons/RightArrowIcon.vue';
import ExclamationTriangleIcon from '@/assets/icons/ExclamationTriangleIcon.vue';
import type { ConfirmType } from '@/modules/user/constants/fixedValues';

interface Props {
    show?: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: ConfirmType;
    loading?: boolean;
    itemLabel?: string;
    itemName?: string;
    itemNames?: string[];
    statusTransition?: { from: string; to: string };
    fromCssClass?: string;
    toCssClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    type: 'info',
    loading: false
});

const emit = defineEmits(['confirm', 'cancel', 'update:show']);
const normalizedItemNames = computed(() => props.itemNames?.filter(Boolean) ?? []);

const typeConfig = computed(() => {
    switch (props.type) {
        case 'danger':
            return {
                button: 'bg-red-600 hover:bg-red-700 ring-red-100',
                border: 'border-red-300 bg-red-50/40',
                iconColor: 'text-red-500',
                icon: ExclamationTriangleIcon
            };
        case 'activate':
            return {
                button: 'bg-[#0056b3] ring-blue-100',
                border: 'border-green-100 bg-green-50/30',
                iconColor: 'text-green-500',
                icon: ToggleRight
            };
        case 'deactivate':
            return {
                button: 'bg-red-500 ring-blue-100',
                border: 'border-red-300 bg-red-50/30',
                iconColor: 'text-red-500',
                icon: ToggleLeft
            };
        case 'warning':
            return {
                button: 'bg-amber-500 ring-amber-100 hover:bg-amber-600',
                border: 'border-amber-300 bg-amber-50/40',
                iconColor: 'text-amber-500',
                icon: ExclamationTriangleIcon
            };
        default:
            return {
                button: 'bg-[#0056b3]  ring-blue-100',
                border: 'border-blue-100 bg-blue-50/30',
                iconColor: 'text-blue-500',
                icon: InfoIcon
            };
    }
});

const close = () => emit('update:show', false);
const confirm = () => emit('confirm');
</script>
<template>
    <div
        v-if="show"
        class="fixed inset-0 z-999999 flex items-center justify-center">
        <div
            class="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            @click="close"></div>

        <div
            class="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-2xl transition-all dark:bg-gray-900">
            <slot name="header">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-4">
                        <div
                            :class="typeConfig.iconColor"
                            class="flex items-center justify-center">
                            <component :is="typeConfig.icon" />
                        </div>
                        <h3 class="text-schedule-text-primary dark:text-schedule-primary text-xl font-semibold">
                            {{ title }}
                        </h3>
                    </div>
                    <button
                        @click="close"
                        class="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                        <XmarkIcon class="h-6 w-6" />
                    </button>
                </div>
            </slot>

            <div class="mt-6">
                <slot name="body">
                    <p class="text-schedule-text-tertiary text-sm font-normal">
                        {{ message }}
                    </p>
                </slot>
            </div>

            <slot name="content">
                <div
                    v-if="itemLabel || itemName || normalizedItemNames.length > 0"
                    class="mt-4 flex items-start justify-between gap-4 rounded-2xl border p-6"
                    :class="typeConfig.border">
                    <div class="min-w-0 flex-1">
                        <span class="text-schedule-text-primary dark:text-schedule-primary block text-sm font-semibold">
                            {{ itemLabel }}
                        </span>

                        <div
                            v-if="normalizedItemNames?.length > 0"
                            class="mt-2 flex flex-wrap gap-2">
                            <span
                                v-for="(name, index) in normalizedItemNames.slice(0, 5)"
                                :key="name"
                                class="text-schedule-text-tertiary rounded-full bg-white/70 px-3 py-1 text-sm font-normal shadow-xs dark:bg-gray-800/70">
                                {{ index + 1 }}. {{ name }}
                            </span>

                            <span
                                v-if="normalizedItemNames.length > 5"
                                class="text-schedule-text-info hover:text-schedule-text-primary cursor-pointer rounded-full bg-white/70 px-3 py-1 text-sm font-medium italic shadow-xs dark:bg-gray-800/70">
                                and {{ normalizedItemNames.length - 5 }} other
                                {{ normalizedItemNames.length - 5 > 1 ? 'values' : 'value' }}
                            </span>
                        </div>

                        <span
                            v-else
                            class="text-schedule-text-tertiary mt-1 block text-sm font-normal">
                            {{ itemName }}
                        </span>
                    </div>

                    <div
                        v-if="statusTransition"
                        class="flex shrink-0 items-center gap-3">
                        <span
                            :class="[
                                type === 'deactivate' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600',
                                fromCssClass
                            ]"
                            class="rounded-full px-4 py-1 text-sm font-medium">
                            {{ statusTransition.from }}
                        </span>
                        <RightArrowIcon class="text-schedule-text-tertiary text-xs" />
                        <span
                            :class="[
                                type === 'activate' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600',
                                toCssClass
                            ]"
                            class="rounded-full px-4 py-1 text-sm font-medium">
                            {{ statusTransition.to }}
                        </span>
                    </div>
                </div>
            </slot>

            <div class="mt-6 flex justify-end gap-4 border-t border-gray-50 pt-4">
                <slot name="footer">
                    <MainButton
                        @click="close"
                        outlined
                        :label="cancelLabel"
                        size="large" />

                    <button
                        @click="confirm"
                        :disabled="loading"
                        class="text-md inline-flex min-w-36 items-center justify-center gap-2 rounded-2xl px-8 py-2.5 font-semibold text-white transition-all disabled:opacity-50"
                        :class="typeConfig.button">
                        <span
                            v-if="loading"
                            class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        <TrashIcon
                            v-if="type === 'danger' && !loading"
                            class="h-4 w-4" />
                        {{ confirmLabel }}
                    </button>
                </slot>
            </div>
        </div>
    </div>
</template>
