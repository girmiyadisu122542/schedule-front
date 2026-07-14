<script setup lang="ts">
import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import MonitorIcon from '@/assets/icons/MonitorIcon.vue';

import TabList from '@/components/common/TabList.vue';
import MainButton from '@/components/common/MainButton.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import BasicInfo from '@/modules/user/components/DynamicValues/BasicInfo.vue';
import AddedValues from '@/modules/user/components/DynamicValues/AddedValues.vue';
import AllowedTransitions from '@/modules/user/components/DynamicValues/AllowedTransitions.vue';

import { useAddedValue } from '@/modules/user/composables/CustomeFields/useAddedValue';
import { useDynamicValues } from '@/modules/user/composables/CustomeFields/useDynamicValues';

const { createTabOptions, activeCreateTab, currentTabSavedStatus, formData, isLoading, handleSubmit } =
    useDynamicValues();
const { fields } = useAddedValue();

const onSaveClick = () => {
    if (activeCreateTab.value === 'basic') {
        handleSubmit(formData);
    } else if (activeCreateTab.value === 'values') {
        handleSubmit(fields.value);
    }
};
</script>

<template>
    <div class="">
        <div class="flex justify-between py-2">
            <div class="pb-4">
                <Breadcrumb
                    :icon="MonitorIcon"
                    :status="{
                        type: currentTabSavedStatus ? 'success' : 'warning',
                        text: currentTabSavedStatus ? $lang.saved : $lang.notSaved
                    }" />
            </div>
            <div
                v-if="activeCreateTab !== 'transitions'"
                class="flex items-center space-x-4">
                <MainButton
                    :label="$lang.clearForm"
                    variant="text"
                    outlined
                    iconPos="left"
                    :icon="XmarkIcon" />
                <MainButton
                    :label="$lang.save"
                    :loading="isLoading"
                    @click="onSaveClick" />
            </div>
        </div>
        <div></div>
        <TabList
            v-model="activeCreateTab"
            :options="createTabOptions" />
        <div
            v-if="activeCreateTab === 'basic'"
            class="mt-4">
            <BasicInfo />
        </div>
        <div v-if="activeCreateTab === 'values'">
            <AddedValues :showModel="false" />
        </div>
        <div
            v-if="activeCreateTab === 'transitions'"
            class="pt-5">
            <AllowedTransitions />
        </div>
    </div>
</template>
