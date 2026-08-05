<script setup lang="ts">
import TabList from '@/components/common/TabList.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';

import MonitorIcon from '@/assets/icons/MonitorIcon.vue';
import ExternalLink from '@/assets/icons/ExternalLink.vue';
import MessageQuestionMarkIcon from '@/assets/icons/MessageQuestionMarkIcon.vue';

import ValueTypes from '@/modules/user/components/DynamicValues/ValueTypes.vue';
import { useDynamicValues } from '@/modules/user/composables/CustomeFields/useDynamicValues';
import AddedValues from '@/modules/user/components/DynamicValues/AddedValues.vue';

const { tabOptions, activeSub } = useDynamicValues();
</script>
<template>
    <div class="">
        <div class="pb-4">
            <Breadcrumb :icon="MonitorIcon" />
        </div>
        <div></div>
        <div class="bg-surface-card border-border-default rounded-2xl border px-4 py-4">
            <div class="">
                <h1 class="text-text-primary flex items-center space-x-2 py-2 text-xl font-semibold">
                    {{ $lang.dynamicValuesManagement }}
                    <div class="group relative inline-block">
                        <MessageQuestionMarkIcon
                            class="ml-2 cursor-help opacity-70 transition-opacity hover:opacity-100" />

                        <div
                            class="bg-surface-elevated border-border-strong text-text-primary invisible absolute top-0 left-full z-50 mb-3 w-80 rounded-2xl border p-4 shadow-2xl transition-all duration-200 ease-in-out group-hover:visible">
                            <h3 class="mb-2 text-sm font-bold">{{ $lang.aboutDynamicValues }}</h3>

                            <p class="text-text-secondary mb-4 text-xs leading-relaxed">
                                {{ $lang.createDynamicValues }}
                            </p>

                            <a
                                href="#"
                                target="_blank"
                                class="bg-surface-subtle text-text-primary hover:bg-surface-hover flex w-full items-center justify-center rounded-xl py-2 text-sm font-semibold transition-colors">
                                {{ $lang.learnMore }}
                                <ExternalLink />
                            </a>
                        </div>
                    </div>
                </h1>
                <h2 class="text-md text-text-tertiary max-w-5xl pb-4 font-normal">
                    {{ $lang.configureWhichDynamicValues }}
                </h2>
            </div>
            <TabList
                v-model="activeSub"
                :options="tabOptions" />
        </div>
        <div class="py-6">
            <div v-if="activeSub === 'type'">
                <ValueTypes />
            </div>
            <div v-if="activeSub === 'value'">
                <AddedValues
                    :show-actions="true"
                    :show-model="true" />
            </div>
        </div>
    </div>
</template>
