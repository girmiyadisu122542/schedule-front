<script setup lang="ts">
import { computed } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { OFFERING_BOARD_COLUMNS } from '@/modules/offerings/constants/offeringView';
import { OFFERING_STATUS, APPROVAL_DECISION } from '@/modules/offerings/constants/offeringStatus';
import type { Offering } from '@/modules/offerings/types/offering';

import MainButton from '@/components/common/MainButton.vue';

/**
 * The approval pipeline as columns — one per tier holding work.
 *
 * This is the view the queue tabs cannot give: they show one slice at a time,
 * so "the college has forty offerings and the registrar has two" is invisible
 * until you click through every tab. Here a tall column IS the bottleneck.
 *
 * Read-only except for the decision on cards the viewer may act on. Dragging a
 * card between columns is deliberately NOT offered: moving an offering is a
 * recorded decision with a remark, not a gesture.
 */
const props = defineProps<{
    offerings: Offering[];
    canDecide: (offering: Offering) => boolean;
}>();

const emit = defineEmits<{
    (event: 'decide', offering: Offering, decision: string): void;
    (event: 'open', offering: Offering): void;
}>();

const { customizeLanguageData } = useLanguageStore();

const columns = computed(() =>
    OFFERING_BOARD_COLUMNS.map((column) => ({
        key: column.key,
        label: customizeLanguageData(column.labelKey, column.labelFallback),
        offerings: props.offerings.filter((offering) => column.statuses.includes(offering.status_code ?? ''))
    }))
);

/** The tallest column, so the bars below read as a share of the worst pile-up. */
const busiest = computed(() => Math.max(1, ...columns.value.map((column) => column.offerings.length)));

const isBlocked = (offering: Offering) =>
    offering.status_code === OFFERING_STATUS.RETURNED || offering.status_code === OFFERING_STATUS.REJECTED;
</script>

<template>
    <div class="overflow-x-auto pb-2">
        <div class="flex min-w-max gap-3">
            <section
                v-for="column in columns"
                :key="column.key"
                class="border-border-default bg-surface-muted flex w-72 shrink-0 flex-col rounded-xl border">
                <header class="border-border-subtle border-b p-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-text-secondary text-sm font-semibold">{{ column.label }}</h3>
                        <span class="bg-surface-subtle text-text-secondary rounded-full px-2 py-0.5 text-xs">
                            {{ column.offerings.length }}
                        </span>
                    </div>

                    <!-- A column's height relative to the worst pile-up. The
                         count alone does not say "this is where it is stuck". -->
                    <div class="bg-surface-subtle mt-2 h-1 overflow-hidden rounded-full">
                        <div
                            class="bg-schedule-brand-blue h-full rounded-full transition-all"
                            :style="{ width: `${(column.offerings.length / busiest) * 100}%` }" />
                    </div>
                </header>

                <div class="max-h-[32rem] space-y-2 overflow-y-auto p-2">
                    <p
                        v-if="!column.offerings.length"
                        class="text-text-muted px-1 py-4 text-center text-xs">
                        {{ $lang.nothingHere || 'Nothing here' }}
                    </p>

                    <article
                        v-for="offering in column.offerings"
                        :key="offering.id"
                        class="border-border-default bg-surface-card hover:border-border-strong rounded-lg border p-2.5 transition"
                        :class="isBlocked(offering) ? 'border-schedule-warning-strong/40' : ''">
                        <button
                            type="button"
                            class="text-text-primary hover:text-schedule-brand-blue block text-left text-xs font-semibold transition"
                            @click="emit('open', offering)">
                            {{ offering.course?.code || offering.name }}
                        </button>

                        <p class="text-text-tertiary mt-0.5 truncate text-xs">
                            {{ offering.section?.name || offering.program?.name || '—' }}
                        </p>
                        <p class="text-text-muted truncate text-xs">
                            {{ offering.department?.name }}
                        </p>

                        <p
                            v-if="isBlocked(offering) && offering.remark"
                            class="text-schedule-warning-strong mt-1 line-clamp-2 text-xs">
                            {{ offering.remark }}
                        </p>

                        <div
                            v-if="props.canDecide(offering)"
                            class="mt-2 flex flex-wrap gap-1">
                            <MainButton
                                :label="$lang.approve || 'Approve'"
                                size="small"
                                @click="emit('decide', offering, APPROVAL_DECISION.APPROVED)" />
                            <MainButton
                                :label="$lang.return || 'Return'"
                                size="small"
                                outlined
                                @click="emit('decide', offering, APPROVAL_DECISION.REVISION_REQUESTED)" />
                        </div>
                    </article>
                </div>
            </section>
        </div>
    </div>
</template>
