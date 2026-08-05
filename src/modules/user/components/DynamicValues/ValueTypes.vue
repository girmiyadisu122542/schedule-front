<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import Modal from '@/components/common/Modal.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import DetailModal from '@/modules/user/components/DynamicValues/DetailModal.vue';

import { useDynamicValues } from '@/modules/user/composables/CustomeFields/useDynamicValues';

const router = useRouter();
const {
    isLoading,
    tableColumns,
    isModalVisible,
    isDetailOpened,
    types,
    isEditing,
    valueFields,
    formData,
    formErrors,
    dialogVisible,
    confirmState,
    selectedData,
    filterFields,
    clearError,
    handleSubmit,
    toggleModal,
    handleSearch,
    fetchModels,
    fetchTypes,
    handleFilterChange,
    getActionOptions,
    openFullDetailFromModal
} = useDynamicValues();

const onExpandFullForm = () => {
    dialogVisible.value = false;
    router.push({ name: 'CreateLookupType' });
};
onMounted(() => {
    fetchModels();
    fetchTypes();
});
</script>

<template>
    <MainTable
        :columns="tableColumns"
        :items="types"
        :loading="isLoading"
        :show-sort="true"
        :is-full-screen-on="true"
        :selectable="true"
        :filter-fields="filterFields"
        :add-button-label="$lang.createDynamicValueType"
        @add="toggleModal"
        @search="handleSearch"
        @filter-change="handleFilterChange"
        @update:currentPage="(page) => fetchTypes({ page })"
        @update:limit="(val) => fetchTypes({ perPage: val })">
        <template #cell-applies_to_model="{ item }">
            <span
                v-for="apply in item.applies_to_model"
                :key="apply"
                class="text-text-primary mr-2 space-x-2 text-sm">
                {{ apply.charAt(0).toUpperCase() + apply.slice(1).toLowerCase() }}
            </span>
        </template>
        <template #cell-is_system="{ item }">
            <span
                :class="[
                    'dark:text-schedule-tertiary mr-2 space-x-2 rounded-full px-3 py-1 text-xs',
                    item.is_system
                        ? 'bg-schedule-tertiary text-schedule-text-secondary dark:bg-gray-700'
                        : 'bg-schedule-brand-blue-subtle text-schedule-brand-blue-primary dark:bg-schedule-brand-blue-primary dark:text-schedule-tertiary'
                ]">
                {{ item.is_system ? $lang.system : $lang.custom }}
            </span>
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

        <template #action="{ item }">
            <ActionMenu :options="getActionOptions(item)" />
        </template>
    </MainTable>
    <Modal
        v-model:visible="isModalVisible"
        :header="isEditing ? $lang.editLookupType : $lang.createLookupType"
        :fields="valueFields"
        :is-expandable="true"
        :submitLabel="isEditing ? $lang.update : $lang.save"
        :initialData="formData"
        :errors="formErrors"
        @expand="onExpandFullForm"
        @clear-field-error="clearError"
        @submit="handleSubmit" />

    <ConfirmDialog
        v-model:show="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :type="confirmState.type"
        :item-label="$lang.lookupType || 'Lookup Type'"
        :item-name="selectedData?.name || ''"
        :confirm-label="confirmState.confirmLabel"
        :loading="confirmState.loading"
        @confirm="confirmState.onConfirm" />

    <DetailModal
        :show="isDetailOpened"
        :data="selectedData"
        @close="isDetailOpened = false"
        @openFullDetail="openFullDetailFromModal" />
</template>
