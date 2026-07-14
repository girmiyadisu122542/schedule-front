<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import Editor from '@/components/common/Editor.vue';
import CheckBox from '@/components/common/CheckBox.vue';
import InputText from '@/components/common/InputText.vue';
import MapPicker from '@/components/common/MapPicker.vue';
import FileUpload from '@/components/common/FileUpload.vue';
import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import IconSelector from '@/components/common/IconSelector.vue';
import DateTimePicker from '@/components/common/DateTimePicker.vue';
import MultipleSelect from '@/components/common/MultipleSelect.vue';

import Info from '@/assets/icons/Info.vue';
import ExpandIcon from '@/assets/icons/ExpandIcon.vue';

export interface FormField {
    key: string;
    label?: string;
    type:
        | 'text'
        | 'select'
        | 'date'
        | 'toggle'
        | 'textarea'
        | 'group'
        | 'file'
        | 'multi-select'
        | 'number'
        | 'map'
        | 'check'
        | 'icon'
        | 'iconPicker'
        | 'tab'
        | 'color';
    placeholder?: string;
    options?: any[];
    optionLabel?: string;
    info?: string;
    labelClass?: string;
    descriptionClass?: string;
    optionValue?: string;
    search?: boolean;
    loading?: boolean;
    searchQueryParam?: string;
    description?: string;
    fields?: FormField[];
    colSpan?: string;
    variant?: 'default' | 'bar';
    disabled?: boolean;
    latitudeKey?: string;
    longitudeKey?: string;
    createNew?: boolean;
    createNewText?: string;
    createNewRoute?: string;
    viewAddLink?: number;
    valueKey?: 'code' | 'id' | 'uuid';
    iconObjectKey?: string;
    tab?: {
        parentKey: string;
        value: any;
    };
}

export interface Tab {
    key: string;
    label: string;
    icon?: any;
}

const props = defineProps<{
    visible: boolean;
    header?: string;
    fields: FormField[];
    tabs?: Tab[];
    initialData?: Record<string, any>;
    submitLabel?: string;
    isEdit?: boolean;
    loading?: boolean;
    isExpandable?: boolean | false;
    errors?: Record<string, string>;
    filePreview?: boolean;
    inputDataPreview?: boolean;
}>();

const emit = defineEmits([
    'update:visible',
    'submit',
    'cancel',
    'clear-field-error',
    'expand',
    'field-change',
    'field-search'
]);

const formData = ref<Record<string, any>>({});

const visibleFields = computed(() => {
    return props.fields.filter((field) => {
        if (!field.tab) return true;

        return formData.value[field.tab.parentKey] === field.tab.value;
    });
});

const isEditMode = computed(() => {
    if (props.isEdit !== undefined) return props.isEdit;
    const data = props.initialData ?? {};
    return Boolean(data.id ?? data.uuid);
});

const handleFieldInput = (key: string) => {
    emit('clear-field-error', key);
};

const notifyFieldChange = (key: string, value: any) => {
    emit('field-change', { key, value });
};

const notifyFieldSearch = (key: string, query: string) => {
    emit('field-search', { key, query });
};

watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            formData.value = { ...props.initialData };

            const tabField = props.fields.find((f) => f.type === 'tab');

            if (tabField?.options?.length) {
                const fieldKey = tabField.key;
                if (!formData.value[fieldKey]) {
                    formData.value[fieldKey] = tabField.options[0].value;
                }
            }
        }
    }
);

const handleClose = () => emit('update:visible', false);

const handleSubmit = () => {
    emit('submit', { ...formData.value });
};
const updateCoords = (field: FormField, coords: { lat: string; lng: string }) => {
    const latKey = field.latitudeKey || 'latitude';
    const lngKey = field.longitudeKey || 'longitude';

    formData.value[latKey] = coords.lat;
    formData.value[lngKey] = coords.lng;

    handleFieldInput(latKey);
    handleFieldInput(lngKey);
};
</script>
<template>
    <MainDialog
        :noXPadding="true"
        :visible="visible"
        :header="header"
        @update:visible="handleClose"
        :contentStyle="{ overflow: 'visible', zIndex: '100' }"
        :style="{ overflow: 'visible' }"
        class="w-full max-w-2xl">
        <div class="grid grid-cols-1 gap-x-6 gap-y-4 pt-4 md:grid-cols-2">
            <div
                v-for="field in visibleFields"
                :key="field.key"
                :class="field.type === 'check' ? 'md:col-span-2' : field.colSpan || 'md:col-span-1'"
                class="relative flex flex-col gap-1.5">
                <div
                    v-if="field.type === 'tab'"
                    class="border-schedule-border-subtle bg-schedule-primary col-span-full rounded-2xl border p-6">
                    <label class="mb-4 block text-sm font-semibold text-gray-700">{{ field.label }}</label>
                    <div class="flex w-full flex-wrap gap-3">
                        <button
                            v-for="opt in field.options"
                            :key="opt.value"
                            @click="formData[field.key] = opt.value"
                            :class="[
                                'text-md flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all',
                                formData[field.key] === opt.value
                                    ? 'border-schedule-border-subtle bg-white shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            ]">
                            <div
                                :class="[
                                    'flex h-4 w-4 items-center justify-center rounded-full border-2',
                                    formData[field.key] === opt.value
                                        ? 'border-schedule-border-subtle border'
                                        : 'border-gray-300'
                                ]">
                                <div
                                    v-if="formData[field.key] === opt.value"
                                    class="bg-schedule-icon-secondary h-2 w-2 rounded-full"></div>
                            </div>
                            {{ opt.label }}
                        </button>
                    </div>
                </div>
                <slot
                    v-else
                    :name="`field-${field.key}`"
                    :field="field"
                    :data="formData">
                    <label
                        v-if="
                            field.type !== 'toggle' &&
                            field.type !== 'group' &&
                            field.type !== 'map' &&
                            field.type !== 'check' &&
                            field.type !== 'file'
                        "
                        class="dark:text-schedule-tertiary flex items-center gap-2 text-sm font-semibold text-gray-700">
                        {{ field.label }}

                        <span
                            v-if="field.info"
                            class="group relative inline-flex items-center">
                            <Info class="h-4 w-4 text-gray-400 hover:cursor-pointer" />
                            <div
                                class="invisible absolute left-1/2 z-50 mt-2 w-56 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                                {{ field.info }}
                            </div>
                        </span>
                    </label>

                    <MainSelect
                        v-if="field.type === 'select'"
                        v-model="formData[field.key]"
                        :options="field.options"
                        :createNew="field.createNew"
                        :createNewText="field.createNewText"
                        :createNewRoute="field.createNewRoute"
                        :viewAddLink="field.viewAddLink"
                        :optionLabel="field.optionLabel || 'label'"
                        :optionValue="field.optionValue || 'value'"
                        :placeholder="field.placeholder"
                        :invalid="!!errors?.[field.key]"
                        :message="errors?.[field.key] || ''"
                        :search="field.search"
                        :loading="field.loading"
                        :searchQueryParam="field.searchQueryParam || ''"
                        size="large"
                        messageType="error"
                        :disabled="field.disabled"
                        @search-input="(query: string) => notifyFieldSearch(field.key, query)"
                        @update:modelValue="
                            (value) => {
                                handleFieldInput(field.key);
                                notifyFieldChange(field.key, value);
                            }
                        "
                        class="w-full" />

                    <IconSelector
                        v-else-if="field.type === 'icon'"
                        v-model="formData[field.key]"
                        :placeholder="field.placeholder"
                        :invalid="!!errors?.[field.key]"
                        :message="errors?.[field.key] || ''"
                        @update:modelValue="
                            (value) => {
                                handleFieldInput(field.key);
                                notifyFieldChange(field.key, value);
                            }
                        " />

                    <FileUpload
                        v-else-if="field.type === 'file'"
                        :filePreview="props.filePreview"
                        v-model="formData[field.key]"
                        :label="field.label"
                        accept=".svg,.png"
                        :maxSizeMB="5"
                        :error="errors?.[field.key] || ''" />

                    <DateTimePicker
                        v-else-if="field.type === 'date'"
                        v-model="formData[field.key]"
                        :placeholder="field.placeholder"
                        :invalid="!!errors?.[field.key]"
                        :message="errors?.[field.key] || ''"
                        messageType="error"
                        @update:modelValue="handleFieldInput(field.key)"
                        class="w-full" />

                    <div
                        v-else-if="field.type === 'toggle'"
                        class="">
                        <div class="relative">
                            <ToggleSwitch
                                :label="field.label"
                                :variant="field.variant || 'bar'"
                                :modelValue="!!formData[field.key]"
                                @update:modelValue="
                                    (val) => {
                                        formData[field.key] = val ? 1 : 0;
                                        handleFieldInput(field.key);
                                    }
                                " />
                        </div>
                        <p
                            v-if="field.description"
                            class="absolute top-7 mt-1 p-4 text-sm text-gray-500">
                            {{ field.description }}
                        </p>
                    </div>
                    <div
                        v-else-if="field.type === 'textarea'"
                        class="space-y-4">
                        <h3 class="font-medium">{{ field.placeholder }}</h3>
                        <Editor v-model="formData[field.key]" />
                        <p
                            v-if="errors?.[field.key]"
                            class="mt-1 text-xs text-red-500">
                            {{ errors?.[field.key] }}
                        </p>
                    </div>

                    <div
                        v-else-if="field.type === 'check'"
                        class="py-2">
                        <CheckBox
                            v-model="formData[field.key]"
                            binary
                            size="normal"
                            class="w-full"
                            :label="field.label"
                            :description="field.description"
                            :label-class="field.labelClass"
                            :description-class="field.descriptionClass"
                            @change="
                                () => {
                                    handleFieldInput(field.key);
                                    notifyFieldChange(field.key, formData[field.key]);
                                }
                            " />
                    </div>
                    <div
                        v-else-if="field.type === 'group'"
                        class="mt-4 rounded-2xl border border-gray-100 bg-gray-100 p-5 md:col-span-2">
                        <div class="mb-4">
                            <h3 class="text-base font-bold text-gray-800">{{ field.label }}</h3>
                            <p
                                v-if="field.description"
                                class="mt-1 text-sm text-gray-500">
                                {{ field.description }}
                            </p>
                        </div>

                        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div
                                v-for="subField in field.fields"
                                :key="subField.key"
                                :class="subField.colSpan || 'md:col-span-1'"
                                class="flex flex-col gap-1.5">
                                <label class="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                                    {{ subField.label }}
                                </label>

                                <InputText
                                    v-model="formData[subField.key]"
                                    :placeholder="subField.placeholder"
                                    class="w-full bg-white"
                                    size="large"
                                    :invalid="!!errors?.[subField.key]"
                                    @update:modelValue="handleFieldInput(subField.key)" />
                            </div>
                        </div>
                    </div>
                    <div
                        v-else-if="field.type === 'map'"
                        class="bg-schedule-primary mt-4 rounded-2xl border border-gray-100 p-5 md:col-span-2">
                        <div class="mb-4">
                            <h3 class="text-base font-bold text-gray-800">{{ field.label }}</h3>
                            <p class="mt-1 text-sm text-gray-500">{{ $lang.clickToSelectCoordinates }}</p>
                        </div>

                        <div class="mt-4 mb-4 grid grid-cols-2 gap-4">
                            <div
                                v-for="subField in field.fields"
                                :key="subField.key"
                                :class="subField.colSpan || 'md:col-span-1'"
                                class="flex flex-col gap-1.5">
                                <label class="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                                    {{ subField.label }}
                                </label>

                                <InputText
                                    v-model="formData[subField.key]"
                                    :placeholder="subField.placeholder"
                                    class="w-full bg-white"
                                    size="large"
                                    :invalid="!!errors?.[subField.key]"
                                    @update:modelValue="handleFieldInput(subField.key)" />
                            </div>
                        </div>

                        <MapPicker
                            v-if="visible"
                            :lat="formData[field.latitudeKey || 'latitude']"
                            :lng="formData[field.longitudeKey || 'longitude']"
                            @update:location="(coords) => updateCoords(field, coords)" />
                    </div>

                    <MultipleSelect
                        v-else-if="field.type === 'multi-select'"
                        v-model="formData[field.key]"
                        :options="field.options"
                        :optionLabel="field.optionLabel || 'label'"
                        :optionValue="field.optionValue || 'value'"
                        :placeholder="field.placeholder"
                        :createNew = "field.createNew"
                        :createNewText = "field.createNewText"
                        :createNewRoute = "field.createNewRoute"
                        showClear
                        search
                        size="large"
                        @update:modelValue="handleFieldInput(field.key)" />
                    <InputText
                        v-else-if="field.type === 'number'"
                        v-model="formData[field.key]"
                        :placeholder="field.placeholder"
                        class="w-full rounded-4xl"
                        size="large"
                        type="number"
                        :invalid="!!errors?.[field.key]"
                        :message="errors?.[field.key] || ''"
                        messageType="error"
                        @update:modelValue="
                            (value) => {
                                handleFieldInput(field.key);
                                notifyFieldChange(field.key, value);
                            }
                        " />

                    <InputText
                        v-else-if="field.type === 'color'"
                        v-model="formData[field.key]"
                        :placeholder="field.placeholder"
                        class="w-full rounded-4xl"
                        size="large"
                        type="color"
                        :invalid="!!errors?.[field.key]"
                        :message="errors?.[field.key] || ''"
                        messageType="error"
                        @update:modelValue="handleFieldInput(field.key)" />
                    <InputText
                        v-else
                        v-model="formData[field.key]"
                        type="text"
                        :placeholder="field.placeholder"
                        class="w-full rounded-4xl"
                        size="large"
                        :invalid="!!errors?.[field.key]"
                        :message="errors?.[field.key] || ''"
                        messageType="error"
                        @update:modelValue="handleFieldInput(field.key)" />
                </slot>
            </div>
        </div>

        <template #footer>
            <div class="relative z-0 flex items-center justify-between">
                <div
                    v-if="isExpandable"
                    class="flex items-center space-x-2">
                    <MainButton
                        variant="text"
                        outlined
                        :icon="ExpandIcon"
                        icon-pos="right"
                        :label="$lang.expandFullForm"
                        @click="emit('expand', { ...formData })" />
                </div>
                <div></div>

                <div class="flex justify-end gap-3">
                    <MainButton
                        :label="isEditMode ? $lang.saveChanges || 'Save changes' : $lang.save || 'Save'"
                        :loading="loading"
                        class="px-8"
                        @click="handleSubmit" />
                </div>
            </div>
        </template>
    </MainDialog>
</template>
