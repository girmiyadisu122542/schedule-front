<script setup lang="ts">
import { computed } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import TextArea from '@/components/common/TextArea.vue';
import { useLanguageStore } from '@/stores/languageStore';
import { APPROVAL_DECISION } from '@/modules/offerings/constants/offeringStatus';
import type { Offering } from '@/modules/offerings/types/offering';

/**
 * Record the due tier's decision.
 *
 * There is no tier picker here on purpose. The tier is a function of the
 * offering's status and is computed server-side — when the caller could name
 * their own, a department head could sign as the registrar.
 */
const props = defineProps<{
    visible: boolean;
    offering: Offering | null;
    decision: string;
    remark: string;
    isSaving?: boolean;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'update:remark', value: string): void;
    (event: 'confirm'): void;
}>();

const { customizeLanguageData } = useLanguageStore();

const isReturn = computed(() => props.decision === APPROVAL_DECISION.REVISION_REQUESTED);
const isReject = computed(() => props.decision === APPROVAL_DECISION.REJECTED);

/** A decision that sends the offering back must say why — mirrors the backend rule. */
const remarkRequired = computed(() => isReturn.value || isReject.value);

const heading = computed(() => {
    if (isReturn.value) return customizeLanguageData('returnForRevision', 'Return for revision');
    if (isReject.value) return customizeLanguageData('rejectOffering', 'Reject offering');

    return customizeLanguageData('approveOffering', 'Approve offering');
});

const explainer = computed(() => {
    if (isReturn.value) {
        return customizeLanguageData(
            'returnExplainer',
            'The offering goes back to its author to be reworked and resubmitted.'
        );
    }

    if (isReject.value) {
        return customizeLanguageData('rejectExplainer', 'The offering is declined. A registrar can reopen it later.');
    }

    return customizeLanguageData('approveExplainer', 'The offering advances to the next tier.');
});

const canConfirm = computed(() => !remarkRequired.value || props.remark.trim().length > 0);
</script>

<template>
    <MainDialog
        :visible="props.visible"
        :plain-background="true"
        max-width="max-w-lg"
        :header="heading"
        @update:visible="emit('update:visible', false)">
        <div class="space-y-4 px-1 py-2">
            <p class="text-text-secondary text-sm">
                {{ props.offering?.course?.code }}
                <span class="text-text-tertiary">— {{ props.offering?.section?.name || props.offering?.name }}</span>
            </p>

            <p class="text-text-tertiary text-xs">{{ explainer }}</p>

            <TextArea
                :model-value="props.remark"
                :label="remarkRequired ? $lang.reasonRequired || 'Reason (required)' : $lang.remark || 'Remark'"
                :placeholder="$lang.decisionRemarkPlaceholder || 'What should the author change?'"
                :rows="3"
                @update:model-value="(value: string) => emit('update:remark', value)" />
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <MainButton
                    :label="$lang.cancel || 'Cancel'"
                    text
                    @click="emit('update:visible', false)" />
                <MainButton
                    :label="heading"
                    :disabled="!canConfirm"
                    :loading="props.isSaving"
                    :outlined-danger="isReject"
                    @click="emit('confirm')" />
            </div>
        </template>
    </MainDialog>
</template>
