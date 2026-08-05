<script setup lang="ts">
import { computed, ref } from 'vue';

import EditIcon from '@/assets/icons/EditIcon.vue';
import DragIcon from '@/assets/icons/DragIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';
import RightChevronIcon from '@/assets/icons/RightChevronIcon.vue';

import CheckBox from '@/components/common/CheckBox.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import FileUpload from '@/components/common/FileUpload.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';

import { type AddedValues } from '@/modules/user/types/CutsomeFields/customeFields';
import { useAddedValue } from '@/modules/user/composables/CustomeFields/useAddedValue';

const { isPickRule, toggleRulePicker } = useAddedValue();

const props = defineProps<{ field: AddedValues; showActions?: boolean }>();
const fileError = ref<string>('');

const emit = defineEmits(['remove', 'save', 'cancel', 'edit']);

const isEditingLocal = ref(false);

const shouldShowActions = computed(() => {
    return props.showActions || isEditingLocal.value;
});

const handleEditClick = () => {
    isEditingLocal.value = true;
    props.field.isExpanded = true;
};

const handleCancel = () => {
    isEditingLocal.value = false;
    props.field.isExpanded = false;
    emit('cancel');
};

const handleSave = () => {
    emit('edit', props.field);
    isEditingLocal.value = false;
};
</script>

<template>
    <div
        class="bg-surface-card border-border-default mb-4 overflow-hidden rounded-xl border"
        :class="{ 'border-border-default': field.isExpanded }">
        <div
            @click="field.isExpanded = !field.isExpanded"
            class="group hover:bg-surface-hover flex cursor-pointer items-center justify-between p-4 transition-colors">
            <div class="flex items-center gap-3">
                <DragIcon class="h-4 w-4" />
                <span class="bg-surface-subtle text-text-tertiary rounded px-2 py-0.5 text-[10px] font-bold uppercase">
                    {{ field.order }}
                </span>
                <span class="text-text-primary font-semibold">
                    {{ field.name }}
                </span>
                <span
                    class="text-schedule-brand-blue-primary bg-schedule-brand-blue-subtle flex items-center rounded-2xl px-2 py-1 text-xs font-medium"
                    v-if="field.is_default">
                    <CheckIcon class="h-3 w-3" />
                    {{ $lang.system }}
                </span>
            </div>
            <div class="flex items-center space-x-4">
                <TrashIcon
                    class="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                    @click.stop="emit('remove', field)" />
                <EditIcon
                    class="h-4 w-4 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                    @click.stop="handleEditClick" />
                <i
                    class="fa-solid fa-chevron-down text-text-muted transition-transform"
                    :class="{ 'rotate-180': field.isExpanded }"></i>
            </div>
        </div>

        <div
            v-if="field.isExpanded"
            class="space-y-4 p-4">
            <div class="">
                <div class="p-4">
                    <div class="grid-cols-2 space-y-4">
                        <div class="">
                            <FieldWrapper
                                :required="false"
                                :label="$lang.name">
                                <InputText
                                    v-model="field.name"
                                    variant="outlined"
                                    size="large" />
                            </FieldWrapper>
                        </div>
                        <div class="py-2">
                            <FieldWrapper
                                :required="false"
                                :label="$lang.customizeColor">
                                <InputText
                                    type="color"
                                    v-model="field.color"
                                    variant="outlined"
                                    size="large" />
                            </FieldWrapper>
                        </div>
                    </div>

                    <div class="border-border-default flex items-center space-x-2 border-b py-3">
                        <p class="text-text-secondary py-2 text-sm font-semibold">
                            {{ $lang.attachIcon }}
                        </p>
                        <MainButton
                            @click="toggleRulePicker"
                            text
                            :icon="RightChevronIcon" />
                    </div>
                    <div
                        v-if="isPickRule"
                        class="pt-4">
                        <FileUpload
                            v-model="field.icon"
                            :file-preview="false"
                            label="Upload Flag"
                            accept=".svg,.png"
                            :maxSizeMB="5"
                            direction="row"
                            :error="fileError"
                            @error="(msg) => (fileError = msg)" />
                    </div>
                    <div class="items-center gap-4 space-y-6 pt-4 md:flex md:space-y-0">
                        <div class="flex items-center gap-4">
                            <CheckBox
                                v-model="field.is_default"
                                :binary="true"
                                :label="$lang.isDefault" />
                        </div>
                    </div>
                    <div
                        v-if="showActions"
                        class="border-border-default mt-4 flex justify-end gap-3 border-t p-4">
                        <MainButton
                            :label="$lang.cancel"
                            variant="text"
                            severity="secondary"
                            @click="emit('cancel')" />
                        <MainButton
                            :label="$lang.save"
                            @click="emit('save', field)" />
                    </div>
                </div>
            </div>
            <div
                v-if="shouldShowActions && isEditingLocal"
                class="border-border-default mt-4 flex justify-end gap-3 border-t p-4">
                <MainButton
                    :label="$lang.cancel"
                    variant="text"
                    @click="handleCancel" />
                <MainButton
                    :label="$lang.save"
                    @click="handleSave" />
            </div>
        </div>
    </div>
</template>
