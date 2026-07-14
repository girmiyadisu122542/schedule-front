<script setup lang="ts">
import { storeToRefs } from 'pinia';

import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

import { useLanguageStore } from '@/stores/languageStore';

const props = withDefaults(
    defineProps<{
        show: boolean;
        title?: string;
        message?: string;
        confirmLabel?: string;
        cancelLabel?: string;
    }>(),
    {
        title: '',
        message: '',
        confirmLabel: '',
        cancelLabel: ''
    }
);

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void;
    (e: 'confirm'): void;
    (e: 'cancel'): void;
}>();

const languageStore = useLanguageStore();
const { translations } = storeToRefs(languageStore);
</script>

<template>
    <ConfirmDialog
        :show="props.show"
        type="warning"
        :title="props.title || translations.unsavedChanges || 'Unsaved changes'"
        :message="
            props.message ||
            translations.unsavedChangesMessage ||
            'You have unsaved changes that will be discarded. Are you sure you want to leave this page?'
        "
        :confirm-label="props.confirmLabel || translations.leave || 'Leave'"
        :cancel-label="props.cancelLabel || translations.stay || 'Stay'"
        @confirm="emit('confirm')"
        @cancel="emit('cancel')"
        @update:show="(value: boolean) => !value && emit('cancel')" />
</template>
