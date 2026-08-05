<script setup lang="ts">
import { onMounted } from 'vue';

import Editor from '@/components/common/Editor.vue';
import InputText from '@/components/common/InputText.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';
import MultipleSelect from '@/components/common/MultipleSelect.vue';

import { useDynamicValues } from '@/modules/user/composables/CustomeFields/useDynamicValues';

const { formData, filteredModelOptions, fetchModels } = useDynamicValues();

onMounted(() => {
    fetchModels();
});
</script>

<template>
    <div class="bg-surface-card border-border-default rounded-xl border p-5">
        <div class="items-center space-x-2 md:flex">
            <FieldWrapper
                :label="$lang.name"
                class="w-full">
                <InputText
                    :placeholder="$lang.egOrderStatusType"
                    v-model="formData.name" />
            </FieldWrapper>
            <div class="w-full pt-5">
                <FieldWrapper :label="$lang.selectModel">
                    <MultipleSelect
                        size="large"
                        v-model="formData.applies_to_model"
                        :options="filteredModelOptions"
                        :placeholder="$lang.selectModel" />
                    <p class="text-text-tertiary ml-2 text-xs font-normal">{{ $lang.selectTowhichModel }}</p>
                </FieldWrapper>
            </div>
        </div>
        <div class="mt-4">
            <FieldWrapper :label="$lang.description">
                <Editor v-model="formData.description" />
            </FieldWrapper>
        </div>
    </div>
</template>
