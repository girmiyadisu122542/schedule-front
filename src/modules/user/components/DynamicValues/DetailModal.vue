<script setup lang="ts">
import XMarkIcon from '@/assets/icons/XmarkIcon.vue';
import ArrowDown from '@/assets/icons/ArrowDown.vue';
import MainButton from '@/components/common/MainButton.vue';

interface Props {
    show: boolean;
    data: any;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'openFullDetail']);

const getBadgeStyle = (color: string) => {
    return {
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`
    };
};
</script>

<template>
    <div
        v-if="show"
        class="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div
            class="dark:bg-schedule-dark w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
            <div class="flex items-center justify-between p-6 pb-0">
                <h2 class="text-schedule-text-primary text-xl font-semibold dark:text-white">
                    {{ $lang.viewLookupType }}
                </h2>
                <MainButton
                    @click="$emit('close')"
                    text
                    :icon="XMarkIcon" />
            </div>

            <div class="p-6">
                <div class="mb-8 flex items-start justify-between">
                    <div>
                        <div class="mb-1 flex items-center gap-3">
                            <h3 class="text-schedule-text-primary text-xl font-semibold dark:text-white">
                                {{ data?.display_name }}
                            </h3>
                            <span
                                class="rounded-full px-3 py-1 text-xs font-medium"
                                :style="getBadgeStyle(data?.state_data?.color || '#007A55')">
                                {{ data?.state_data?.name }}
                            </span>
                        </div>
                        <p class="text-md text-schedule-text-tertiary dark:text-gray-400">{{ $lang.valueType }}</p>
                    </div>

                    <div class="text-right">
                        <div
                            class="flex items-center justify-end gap-2 rounded-full px-4 py-2"
                            :style="getBadgeStyle(data?.status_lookup_value?.color || '#974711')">
                            <i
                                v-if="data?.status_lookup_value?.icon"
                                :class="['fa', `fa-${data?.status_lookup_value?.icon}`, 'text-[10px]']"></i>
                            <span class="text-sm font-medium">
                                {{ data?.status_lookup_value?.display_name || $lang.noStatus }}
                            </span>
                        </div>
                        <p class="text-schedule-text-tertiary text-md dark:text-schedule-text-tertiary mt-1">
                            {{ $lang.status }}
                        </p>
                    </div>
                </div>

                <div
                    class="bg-schedule-primary rounded-3xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900/20">
                    <div class="flex items-center gap-2 p-5 dark:border-gray-800">
                        <span class="font-bold text-gray-900 dark:text-white">{{ $lang.dynamicValue }}</span>
                        <ArrowDown class="h-4 w-4 text-gray-500" />
                    </div>

                    <div class="custom-scrollbar max-h-72 overflow-y-auto">
                        <div
                            v-for="(val, index) in data?.values"
                            :key="val.id"
                            class="flex items-center justify-between p-5 transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                            <div class="flex items-center gap-4">
                                <span class="text-gray-400">{{ Number(index) + 1 }}.</span>
                                <span class="font-medium text-gray-700 dark:text-gray-300">
                                    {{ val?.display_name }}
                                </span>
                            </div>

                            <div
                                class="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold transition-all"
                                :style="getBadgeStyle(val.color || '#10B981')">
                                <i
                                    v-if="val.icon"
                                    :class="['fa', `fa-${val.icon}`, 'text-[10px]']"></i>
                                {{ val?.display_name }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="flex justify-end border-t border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800/40">
                <MainButton
                    @click="$emit('openFullDetail')"
                    outlined
                    large
                    :label="$lang.openFullDetail" />
            </div>
        </div>
    </div>
</template>
