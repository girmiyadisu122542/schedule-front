<script setup lang="ts">
import { computed, ref, watch, onUnmounted, type Component } from 'vue';

import Editor from '@/components/common/Editor.vue';
import CheckBox from '@/components/common/CheckBox.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import DisplayContent from '@/components/common/DisplayContent.vue';

import type { UserAllowedAction } from '@/modules/user/constants/allowedActions';
import { resolveStatusIconClass } from '@/utils/statusIcon';
import CloseIcon from '@/assets/icons/XmarkIcon.vue';
import FullDetailIcon from '@/assets/icons/ExpandIcon.vue';

import { LOOKUP_STATUS_PENDING, STATUS_PENDING } from '@/constants/statusOptions';
import {
    BADGE_VARIANT,
    type BadgeVariant,
    type DetailFieldType,
    DATA_TYPE_TEXT_VALUE,
    DATA_TYPE_EDITOR_VALUE,
    DATA_TYPE_SELECT_VALUE,
    DATA_TYPE_TOGGLE_VALUE,
    DATA_TYPE_BOOLEAN_VALUE,
    DATA_TYPE_CHECKBOX_VALUE
} from '@/config/appConfig';
import { STRING } from '@/modules/user/constants/fixedValues';

type StatusValue = string | number | null;

interface StatusOption {
    label: string;
    value: string | number;
    description?: string;
    icon?: Component | any;
    variant?: BadgeVariant | any;
}

interface DetailFieldOption {
    label: string;
    value: string | number | null;
}

interface DetailItem {
    key?: string;
    label: string;
    value: string | number | boolean | null | undefined;
    type?: DetailFieldType;
    colSpan?: 1 | 2;
    options?: DetailFieldOption[];
    optionLabel?: string;
    optionValue?: string;
    editable?: boolean;
}

const props = withDefaults(
    defineProps<{
        permission: UserAllowedAction;
        visible: boolean;
        width?: string;
        header?: string;
        itemTitle?: string;
        itemSubtitle?: string;
        faIcon?: string;
        itemDetails?: DetailItem[];
        currentStatusLabel?: string;
        currentStatusValue?: StatusValue;
        currentStatusCode?: StatusValue;
        currentStatusVariant?: BadgeVariant | string;
        selectedStatus?: StatusValue;
        statusOptions?: StatusOption[];
        loading?: boolean;
        saveLabel?: string;
        cancelLabel?: string;
        detailSectionTitle?: string;
        statusCaption?: string;
        resolutionTitle?: string;
        showExpandButton?: boolean;
        expandLabel?: string;
        expandIcon?: Component | null;
        currentStatusIcon?: Component | null | any;
    }>(),
    {
        width: 'w-full max-w-2xl',
        header: '$lang.changeStatus',
        itemTitle: '',
        itemSubtitle: '',
        currentStatusLabel: '',
        currentStatusValue: null,
        currentStatusVariant: BADGE_VARIANT.WARNING,
        currentStatusIcon: null,
        selectedStatus: null,
        loading: false,
        saveLabel: 'Save',
        faIcon: '',
        currentStatusCode: null,
        cancelLabel: 'Cancel',
        detailSectionTitle: 'Requested Details',
        statusCaption: 'Request Status',
        resolutionTitle: 'Resolution',
        showExpandButton: false,
        expandLabel: 'Open Full Detail',
        expandIcon: FullDetailIcon,
        itemDetails: () => [],
        statusOptions: () => []
    }
);

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'update:selectedStatus', value: StatusValue): void;
    (e: 'submit', value: StatusValue): void;
    (e: 'detail-change', payload: { key: string; value: any }): void;
    (e: 'cancel'): void;
    (e: 'expand'): void;
}>();

const originalOverflow = ref<string | null>(null);
const originalPaddingRight = ref<string | null>(null);
const detailValues = ref<Record<string, any>>({});

const selectedValue = computed({
    get: () => props.selectedStatus,
    set: (value: StatusValue) => emit('update:selectedStatus', value)
});

const normalizeValue = (value: StatusValue) => (value === null || value === undefined ? '' : String(value));

const isHexColor = (value?: string | null) => typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

// Subtle tinted status pill (design's "Pending" look): a low-alpha tint of the
// status colour with the colour itself as the text. Falls back to an amber
// tint when the variant is a semantic name rather than a hex colour.
const statusBadgeStyle = computed(() => {
    const variant = props.currentStatusVariant as unknown as string;
    if (isHexColor(variant)) {
        return { backgroundColor: `${variant}2A`, color: variant };
    }
    return { backgroundColor: '#FEF3C7', color: '#B45309' };
});

const isSubmitDisabled = computed(() => {
    if (selectedValue.value === null || selectedValue.value === undefined || selectedValue.value === '') {
        return true;
    }

    return normalizeValue(selectedValue.value) === normalizeValue(props.currentStatusValue);
});

// The current status icon can arrive as a real Vue component (currentStatusIcon
// or a matched status option) OR as a Font Awesome icon-name string (faIcon /
// status_lookup_value.icon). Resolve each form separately so every status shows
// its own icon instead of falling through to the clock fallback.
const matchedStatusOptionIcon = computed(
    () =>
        props.statusOptions.find((option) => normalizeValue(option.value) === normalizeValue(props.currentStatusValue))
            ?.icon ?? null
);

const isComponentIcon = (icon: unknown) => Boolean(icon) && typeof icon !== 'string';

const currentStatusComponentIcon = computed(() => {
    if (isComponentIcon(props.currentStatusIcon)) return props.currentStatusIcon;
    if (isComponentIcon(matchedStatusOptionIcon.value)) return matchedStatusOptionIcon.value;
    return null;
});

const currentStatusFaIcon = computed(() => {
    if (props.faIcon) return resolveStatusIconClass(props.faIcon);
    if (typeof matchedStatusOptionIcon.value === STRING) return resolveStatusIconClass(matchedStatusOptionIcon.value);
    return '';
});

const detailFields = computed(() =>
    props.itemDetails.map((detail) => ({
        ...detail,
        type:
            detail.type ||
            (typeof detail.value === DATA_TYPE_BOOLEAN_VALUE ? DATA_TYPE_CHECKBOX_VALUE : DATA_TYPE_TEXT_VALUE),
        colSpan: detail.colSpan || (typeof detail.value === DATA_TYPE_BOOLEAN_VALUE ? 2 : 1),
        editable: detail.editable ?? false
    }))
);

const syncDetailValues = () => {
    const nextValues: Record<string, any> = {};

    props.itemDetails.forEach((detail) => {
        if (detail.key) {
            nextValues[detail.key] = detail.value;
        }
    });

    detailValues.value = nextValues;
};

const getDetailValue = (detail: DetailItem) => {
    if (detail.key && Object.prototype.hasOwnProperty.call(detailValues.value, detail.key)) {
        return detailValues.value[detail.key];
    }

    return detail.value;
};

const updateDetailValue = (detail: DetailItem, value: any) => {
    if (!detail.key) {
        return;
    }

    detailValues.value = {
        ...detailValues.value,
        [detail.key]: value
    };

    emit('detail-change', {
        key: detail.key,
        value
    });
};

const getDetailText = (value: DetailItem['value']) => {
    if (typeof value === DATA_TYPE_BOOLEAN_VALUE) {
        return value ? 'Yes' : 'No';
    }

    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return String(value);
};

const getSelectOptions = (detail: DetailItem) => {
    if (detail.options?.length) {
        return detail.options;
    }

    return [
        {
            label: getDetailText(getDetailValue(detail)),
            value:
                getDetailValue(detail) === null || getDetailValue(detail) === undefined
                    ? ''
                    : String(getDetailValue(detail))
        }
    ];
};

const getSelectModelValue = (value: DetailItem['value']) => {
    if (value === null || value === undefined) {
        return null;
    }

    return String(value);
};

const lockBodyScroll = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    originalOverflow.value = document.body.style.overflow;
    originalPaddingRight.value = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
};

const unlockBodyScroll = () => {
    document.body.style.overflow = originalOverflow.value || '';
    document.body.style.paddingRight = originalPaddingRight.value || '';
};

const closeModal = () => {
    emit('update:visible', false);
    emit('cancel');
};

const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
        closeModal();
    }
};

const handleKeydown = (event: KeyboardEvent) => {
    if (props.visible && event.key === 'Escape') {
        closeModal();
    }
};

const handleExpand = () => {
    emit('update:visible', false);
    emit('expand');
};

const submit = () => {
    if (isSubmitDisabled.value) {
        return;
    }

    emit('submit', selectedValue.value);
};

watch(
    () => props.itemDetails,
    () => {
        syncDetailValues();
    },
    { deep: true, immediate: true }
);

watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            syncDetailValues();
        }

        if (visible) {
            lockBodyScroll();
            return;
        }

        unlockBodyScroll();
    },
    { immediate: true }
);

watch(
    () => props.visible,
    (visible) => {
        if (typeof window === 'undefined') {
            return;
        }

        if (visible) {
            window.addEventListener('keydown', handleKeydown);
            return;
        }

        window.removeEventListener('keydown', handleKeydown);
    },
    { immediate: true }
);

onUnmounted(() => {
    unlockBodyScroll();
    window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
    <div
        v-if="visible"
        class="fixed inset-0 z-99990 flex items-center justify-center bg-black/50 p-4"
        @click="handleBackdropClick">
        <div
            :class="[width]"
            class="bg-surface-card border-border-default overflow-hidden rounded-3xl border shadow-2xl">
            <div class="border-border-subtle flex items-center justify-between border-b px-8 py-5">
                <h2 class="text-text-primary text-xl font-semibold">
                    {{ header }}
                </h2>
                <button
                    type="button"
                    class="text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                    @click="closeModal">
                    <CloseIcon class="h-6 w-6" />
                </button>
            </div>

            <div class="max-h-[75vh] space-y-6 overflow-y-auto px-8 py-4">
                <div
                    class="bg-surface-muted border-border-default flex items-center justify-between gap-4 rounded-2xl border p-4">
                    <div class="min-w-0 space-y-1">
                        <h3 class="text-text-primary truncate text-xl font-semibold">
                            {{ itemTitle || 'Created By:' }}
                        </h3>
                        <p
                            v-if="itemSubtitle"
                            class="text-text-tertiary truncate text-sm font-normal">
                            {{ itemSubtitle }}
                        </p>
                    </div>

                    <div class="shrink-0 space-y-1 text-right">
                        <span
                            v-if="currentStatusLabel"
                            :style="statusBadgeStyle"
                            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap">
                            <component
                                :is="currentStatusComponentIcon"
                                v-if="currentStatusComponentIcon"
                                class="h-3.5 w-3.5" />
                            <i
                                v-else-if="currentStatusFaIcon"
                                :class="currentStatusFaIcon"></i>
                            <i
                                v-else
                                class="fa-solid fa-clock-rotate-left text-xs"></i>
                            {{ currentStatusLabel }}
                        </span>
                        <p class="text-md text-text-tertiary font-normal">
                            {{ statusCaption }}
                        </p>
                    </div>
                </div>

                <div
                    v-if="detailFields.length && props.currentStatusValue == LOOKUP_STATUS_PENDING"
                    class="bg-surface-muted border-border-default space-y-4 rounded-2xl border p-5">
                    <p class="text-text-secondary text-sm font-medium">
                        {{ detailSectionTitle }}
                    </p>

                    <div
                        class="grid grid-cols-1 gap-3"
                        :class="detailFields.length > 1 ? 'md:grid-cols-2' : ''">
                        <div
                            v-for="detail in detailFields"
                            :key="detail.label"
                            :class="detail.colSpan === 2 ? 'md:col-span-2' : ''">
                            <InputText
                                v-if="detail.type === DATA_TYPE_TEXT_VALUE"
                                :label="detail.label"
                                :model-value="getDetailText(getDetailValue(detail))"
                                :disabled="!detail.editable"
                                @update:model-value="(value) => updateDetailValue(detail, value)" />

                            <div v-else-if="detail.type === DATA_TYPE_SELECT_VALUE">
                                <label class="text-text-secondary mb-2 block text-sm font-medium">
                                    {{ detail.label }}
                                </label>
                                <MainSelect
                                    :model-value="getSelectModelValue(getDetailValue(detail))"
                                    :options="getSelectOptions(detail)"
                                    :option-label="detail.optionLabel || 'label'"
                                    :option-value="detail.optionValue || 'value'"
                                    :disabled="!detail.editable"
                                    @update:modelValue="(value) => updateDetailValue(detail, value)"
                                    size="large" />
                            </div>

                            <Editor
                                v-else-if="detail.type === DATA_TYPE_EDITOR_VALUE && detail.editable"
                                :model-value="getDetailText(getDetailValue(detail))"
                                @update:modelValue="(value) => updateDetailValue(detail, value)" />

                            <div
                                v-else-if="detail.type === DATA_TYPE_EDITOR_VALUE"
                                class="space-y-2">
                                <label class="text-text-secondary block text-sm font-medium">
                                    {{ detail.label }}
                                </label>
                                <div class="border-border-default bg-surface-card rounded-2xl border p-4">
                                    <DisplayContent :content="getDetailText(getDetailValue(detail))" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <MainButton
                        v-if="showExpandButton"
                        :label="expandLabel"
                        :icon="expandIcon || FullDetailIcon"
                        icon-pos="right"
                        outlined
                        @click="handleExpand" />
                </div>

                <div class="bg-surface-muted border-border-default space-y-2 rounded-2xl border p-5">
                    <label class="text-text-secondary block text-sm font-medium">
                        {{ $lang.status || 'Status' }}
                    </label>
                    <MainSelect
                        v-model="selectedValue"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        :disabled="!$can(permission)"
                        :placeholder="$lang.select || 'Select'"
                        size="large" />
                </div>
            </div>

            <div class="border-border-subtle bg-surface-muted flex justify-end border-t px-8 py-5">
                <MainButton
                    :label="saveLabel"
                    :loading="loading"
                    :disabled="isSubmitDisabled"
                    @click="submit" />
            </div>
        </div>
    </div>
</template>
