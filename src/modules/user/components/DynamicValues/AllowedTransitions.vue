<script setup lang="ts">
import { onMounted } from 'vue';

import PlusIcon from '@/assets/icons/PlusIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';

import MainTable from '@/components/common/MainTable.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

import { useDynamicValues } from '@/modules/user/composables/CustomeFields/useDynamicValues';
import DynamicTable, { type TableColumn } from '@/components/common/DynamicTable.vue';

const {
    lookupValuesTableColumn,
    isLoading,
    transitions,
    transitionsRow,
    formData,
    lastSavedId,
    confirmState,
    selectedData,
    columns,
    lookupValuesOptions,
    initiateTranstionDelete,
    addRow,
    fetchModels,
    fetchTransitions,
    handleSubmit
} = useDynamicValues();

const onSaveClick = async () => {
    const payload = {
        lookup_type_id: formData.id || lastSavedId.value || formData.look_type_id,
        from_value_id: formData.from_value_id,
        to_value_id: formData.to_value_id
    };
    await handleSubmit(payload);

    formData.from_value_id = '';
    formData.to_value_id = '';
};

onMounted(() => {
    fetchModels();
    fetchTransitions();
});
</script>

<template>
    <div class="bg-surface-card border-border-default mb-5 rounded-xl border p-5">
        <div class="items-center space-x-2 md:flex">
            <FieldWrapper
                :label="$lang.from"
                class="w-full">
                <MainSelect
                    size="large"
                    v-model="formData.from_value_id"
                    :options="lookupValuesOptions"
                    :placeholder="$lang.selectFromList" />
            </FieldWrapper>
            <div class="w-full">
                <FieldWrapper :label="$lang.to">
                    <MainSelect
                        size="large"
                        v-model="formData.to_value_id"
                        :options="lookupValuesOptions"
                        :placeholder="$lang.selectFromList" />
                </FieldWrapper>
            </div>
            <div class="w-1/2 pt-6">
                <MainButton
                    outlined
                    :icon="PlusIcon"
                    @click="onSaveClick"
                    :label="$lang.addTransition" />
            </div>
        </div>
    </div>
    <DynamicTable
        :title="$lang.addIngredients"
        :columns="columns"
        :rows="transitionsRow"
        :show-checkbox-column="true"
        :show-actions-column="true"
        @add-row="addRow"
        @remove-row="initiateTranstionDelete"></DynamicTable>
    <!-- <MainTable
        :columns="lookupValuesTableColumn"
        :items="transitions"
        :loading="isLoading"
        :title="$lang.lookupTransition"
        :show-sort="false"
        :is-full-screen-on="false"
        :show-column-toggle="false"
        :show-add-button="false"
        :show-search="false"
        :need-action-column="false"
        @update:currentPage="(page) => fetchTransitions({ page })"
        @update:limit="(val) => fetchTransitions({ perPage: val })">
        <template #cell-action="{ item }">
            <div class="flex items-center">
                <TrashIcon
                    class="cursor-pointer text-red-500 hover:text-red-700"
                    @click="initiateTranstionDelete(item)" />
            </div>
        </template>
        <template #cell-state_data="{ item }">
            <span
                :class="[
                    'dark:text-schedule-tertiary mr-2 space-x-2 rounded-full px-3 py-1 text-xs',
                    item.state === 1
                        ? 'bg-schedule-success-subtle text-schedule-text-success'
                        : 'bg-schedule-tertiary text-schedule-text-secondary'
                ]">
                {{ item.state_data?.name }}
            </span>
        </template>
        <template #cell-from_value="{ item }">
            <span
                :class="['mr-2 flex w-24 items-center gap-2 rounded-full px-3 py-1 text-center text-xs text-white']"
                :style="{ backgroundColor: item.from_value?.color }">
                <i
                    v-if="item.from_value?.icon"
                    :class="['fa', `fa-${item.from_value.icon}`]" />
                {{ item.from_value?.display_name }}
            </span>
        </template>
        <template #cell-to_value="{ item }">
            <span
                :class="['mr-2 flex w-24 items-center gap-2 rounded-full px-3 py-1 text-center text-xs text-white']"
                :style="{ backgroundColor: item.to_value?.color }">
                <i
                    v-if="item.from_value?.icon"
                    :class="['fa', `fa-${item.to_value.icon}`]" />
                {{ item.to_value?.display_name }}
            </span>
        </template>
    </MainTable> -->
    <ConfirmDialog
        v-model:show="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :type="confirmState.type"
        :item-label="$lang.transitions || 'transitions'"
        :confirm-label="confirmState.confirmLabel"
        :loading="confirmState.loading"
        @confirm="confirmState.onConfirm" />
</template>
