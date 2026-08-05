<script setup lang="ts">
import { onMounted } from 'vue';
import EyeIcon from '@/assets/icons/EyeIcon.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import EyeSlashIcon from '@/assets/icons/EyeSlashIcon.vue';

import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

import { useAddedValue } from '@/modules/user/composables/CustomeFields/useAddedValue';
import { useDynamicValues } from '@/modules/user/composables/CustomeFields/useDynamicValues';
import AddedValueCreator from '@/modules/user/components/DynamicValues/AddedValueCreator.vue';

const { fields, isPreviewVisible, confirmState, addField, initiateDelete, handleValuesSubmit, initiateUpdate } =
    useAddedValue();
const { lastSavedId, formData, filteredTypeOptions, fetchTypes } = useDynamicValues();

const props = defineProps<{ showActions?: boolean; showModel?: boolean }>();

const onSaveClick = async () => {
    let targetId = formData.id || lastSavedId.value || formData.look_type_id;
    if (targetId) {
        await handleValuesSubmit(targetId);
    } else {
        return;
    }
};
onMounted(() => {
    fetchTypes();
});
</script>

<template>
    <div
        v-if="props.showModel"
        class="bg-surface-card w-full items-center rounded-xl p-6 md:flex md:justify-between">
        <div class="w-full">
            <h1 class="text-text-primary text-xl font-semibold">{{ $lang.selectValueType }}</h1>
            <p class="text-text-tertiary text-md font-normal">
                {{ $lang.selectModelForLookup }}
            </p>
        </div>
        <div class="w-full">
            <FieldWrapper
                :label="$lang.selectValueType"
                :required="true">
                <MainSelect
                    size="large"
                    v-model="formData.look_type_id"
                    :options="filteredTypeOptions"
                    :placeholder="$lang.selectModel" />
            </FieldWrapper>
        </div>
    </div>
    <div class="bg-surface-muted mt-4">
        <div class="bg-surface-card border-border-default grid grid-cols-12 items-start gap-8 rounded-2xl border p-4">
            <div class="border-border-default col-span-12 rounded-2xl border p-5 lg:col-span-8">
                <div class="mb-6 items-center justify-between md:flex">
                    <div>
                        <h2 class="text-md text-text-primary font-semibold">
                            {{ $lang.customLookupValues }}
                        </h2>
                        <p class="text-md text-text-tertiary font-normal">{{ fields.length }} {{ $lang.fields }}</p>
                    </div>
                    <div class="flex gap-3">
                        <MainButton
                            outlined
                            @click="isPreviewVisible = !isPreviewVisible"
                            :icon="isPreviewVisible ? EyeSlashIcon : EyeIcon"
                            :label="isPreviewVisible ? $lang.hidePreview : $lang.showPreview" />
                        <MainButton
                            @click="addField"
                            :icon="PlusIcon"
                            :label="$lang.addValue" />
                    </div>
                </div>

                <div
                    v-if="fields.length === 0"
                    class="bg-surface-card border-border-strong rounded-3xl border-2 border-dashed p-16 text-center">
                    <p class="text-text-tertiary mb-4 text-sm">
                        {{ $lang.noCustomLookupValues }}
                    </p>
                </div>

                <AddedValueCreator
                    v-for="field in fields"
                    :key="field.id"
                    :field="field"
                    @save="onSaveClick"
                    :show-actions="props.showActions"
                    @remove="initiateDelete(field)"
                    @edit="initiateUpdate" />
            </div>

            <div
                v-if="isPreviewVisible"
                class="sticky top-6 col-span-12 lg:col-span-4">
                <div class="bg-surface-card border-border-default max-h-100 rounded-2xl border p-6 shadow-xs">
                    <h3 class="text-text-primary mb-6 pb-2 text-xl font-semibold">
                        {{ $lang.liveFormPreview }}
                    </h3>
                    <div class="space-y-4">
                        <div
                            v-if="fields.length === 0"
                            class="border-border-default flex items-center justify-center rounded-xl border border-dashed p-8">
                            <p class="text-text-tertiary text-sm">{{ $lang.addLookupToPreview }}.</p>
                        </div>
                        <div
                            v-for="field in fields"
                            :key="field.id"
                            class="bg-surface-muted border-border-default flex items-center space-x-1 rounded-xl border p-3">
                            <label
                                class="bg-surface-subtle text-text-secondary flex items-center space-x-2 rounded-full px-2 py-0.5 text-sm font-bold">
                                {{ field.order }}
                            </label>
                            <div
                                class="text-text-secondary flex items-center space-x-2 rounded-l-full rounded-r-full px-2"
                                :style="{ backgroundColor: field.color }">
                                <p>{{ field.name }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <ConfirmDialog
        v-model:show="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :type="confirmState.type"
        :item-label="$lang.lookupValue || 'Lookup Value'"
        :confirm-label="confirmState.confirmLabel"
        :loading="confirmState.loading"
        @confirm="confirmState.onConfirm" />
</template>
