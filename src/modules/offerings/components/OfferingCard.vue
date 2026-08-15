<script setup lang="ts">
import { computed } from 'vue';

import Badge from '@/components/common/Badge.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import MainButton from '@/components/common/MainButton.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import { useLanguageStore } from '@/stores/languageStore';
import { APPROVAL_LEVEL_ORDER, APPROVAL_DECISION, OFFERING_STATUS } from '@/modules/offerings/constants/offeringStatus';
import { STATUS_LIGHT, STATUS_INFO } from '@/config/appConfig';
import type { LookupValueRef } from '@/composables/useLookupValues';
import type { ActionOption } from '@/components/common/ActionMenu.vue';
import type { Offering } from '@/modules/offerings/types/offering';

/**
 * One offering, as a card rather than a table row.
 *
 * A row cannot hold six facts, a four-step progress indicator and three
 * decisions without becoming a horizontal scroll — and the decisions are the
 * point. Before this, approving meant opening a detail page per offering, which
 * for a registrar with a term's worth of them is the whole job.
 */
const props = defineProps<{
    offering: Offering;
    /** Zero-based index of the tier due; 4 once registrar-approved. */
    tierIndex: number;
    /** Whether this user holds the key for the tier currently due. */
    canDecide: boolean;
    actions: ActionOption[];
    statusValue?: LookupValueRef | null;
}>();

const emit = defineEmits<{
    (event: 'decide', offering: Offering, decision: string): void;
    (event: 'open', offering: Offering): void;
}>();

const { customizeLanguageData } = useLanguageStore();

const tierLabels = computed<Record<string, string>>(() => ({
    committee: customizeLanguageData('committee', 'Committee'),
    department: customizeLanguageData('department', 'Department'),
    college: customizeLanguageData('college', 'College'),
    registrar: customizeLanguageData('registrar', 'Registrar')
}));

/** The four tiers, each marked done / current / pending. */
const tiers = computed(() =>
    APPROVAL_LEVEL_ORDER.map((level, index) => ({
        level,
        label: tierLabels.value[level] ?? level,
        isDone: index < props.tierIndex,
        isCurrent: index === props.tierIndex && props.offering.status_code !== OFFERING_STATUS.REGISTRAR_APPROVED
    }))
);

const awaitingLabel = computed(() => {
    const level = props.offering.awaiting_level_code;

    return level ? `${customizeLanguageData('awaiting', 'Awaiting')} ${tierLabels.value[level] ?? level}` : null;
});

const crossListedCount = computed(() => props.offering.additional_sections?.length ?? 0);

const isReturned = computed(() => props.offering.status_code === OFFERING_STATUS.RETURNED);
</script>

<template>
    <div class="border-border-default bg-surface-card hover:border-border-strong rounded-xl border p-4 transition">
        <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
                <button
                    type="button"
                    class="text-text-primary hover:text-schedule-brand-blue text-left text-sm font-semibold transition"
                    @click="emit('open', props.offering)">
                    {{ props.offering.course?.code || props.offering.name }}
                    <span class="text-text-secondary font-normal">— {{ props.offering.course?.name }}</span>
                </button>

                <p class="text-text-tertiary mt-1 text-xs">
                    {{ props.offering.section?.name || props.offering.program?.name || '—' }}
                    <span v-if="crossListedCount">
                        · +{{ crossListedCount }} {{ $lang.crossListed || 'cross-listed' }}
                    </span>
                    · {{ props.offering.instructor?.name || $lang.noInstructor || 'No instructor' }} ·
                    {{ props.offering.total_expected_students ?? props.offering.expected_students }}
                    {{ $lang.students || 'students' }}
                </p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
                <StatusBadge
                    :value="props.statusValue"
                    :fallback="props.offering.status_code ?? ''" />
                <ActionMenu :options="props.actions" />
            </div>
        </div>

        <!-- The four-tier chain. A flat status chip says where it is; this says
             how far along it is, which is the question a reviewer has. -->
        <div class="mt-3 flex flex-wrap items-center gap-2">
            <template
                v-for="(tier, index) in tiers"
                :key="tier.level">
                <span
                    class="h-2 w-2 rounded-full"
                    :class="
                        tier.isDone
                            ? 'bg-schedule-success-strong'
                            : tier.isCurrent
                              ? 'bg-schedule-brand-blue'
                              : 'bg-border-strong'
                    " />
                <span
                    class="text-xs"
                    :class="tier.isCurrent ? 'text-text-primary font-medium' : 'text-text-tertiary'">
                    {{ tier.label }}
                </span>
                <span
                    v-if="index < tiers.length - 1"
                    class="bg-border-subtle h-px w-4" />
            </template>
        </div>

        <p
            v-if="awaitingLabel"
            class="text-text-tertiary mt-2 text-xs">
            {{ awaitingLabel }}
        </p>

        <!-- The remark is why the author is looking at this at all. -->
        <p
            v-if="isReturned && props.offering.remark"
            class="text-schedule-warning-strong mt-2 text-xs">
            {{ props.offering.remark }}
        </p>

        <div
            v-if="props.canDecide"
            class="border-border-subtle mt-3 flex flex-wrap gap-2 border-t pt-3">
            <MainButton
                :label="$lang.approve || 'Approve'"
                size="small"
                @click="emit('decide', props.offering, APPROVAL_DECISION.APPROVED)" />
            <MainButton
                :label="$lang.return || 'Return'"
                size="small"
                outlined
                @click="emit('decide', props.offering, APPROVAL_DECISION.REVISION_REQUESTED)" />
            <MainButton
                :label="$lang.reject || 'Reject'"
                size="small"
                outlined-danger
                @click="emit('decide', props.offering, APPROVAL_DECISION.REJECTED)" />
        </div>
    </div>
</template>
