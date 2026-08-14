<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useInvigilationRequest } from '@/modules/invigilation/composables/useInvigilationRequest';

import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import InputText from '@/components/common/InputText.vue';
import TextArea from '@/components/common/TextArea.vue';
import MultipleSelect from '@/components/common/MultipleSelect.vue';
import ChevronArrowDown from '@/assets/icons/ChevronArrowDown.vue';
import XmarkIcon from '@/assets/icons/XmarkIcon.vue';

/**
 * A department answers its own share of a request with people.
 *
 * The picker offers only this department's staff who may invigilate, minus
 * anyone already sent against this same share — the server refuses all three
 * of those anyway, and offering them here would only invite a rejection.
 *
 * It is a searchable multi-select rather than a list of rows: a large
 * department runs to dozens of staff, and a list that long buries the counts
 * and the remark under a scroll.
 */
defineProps<{ visible: boolean }>();

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

const {
    submitTarget,
    selectedInstructorIds,
    submitRemark,
    invigilatorOptions,
    sentInvigilators,
    isLoadingInstructors,
    instructorError,
    exceedsRemaining,
    isSavingAction,
    submitSelected,
    withdraw
} = useInvigilationRequest();

/**
 * Past this many names a plain list pushes the picker and the remark off the
 * bottom of the dialog, so the sent block collapses and gains a filter.
 */
const CROWDED = 8;

const sentOpen = ref(true);
const sentQuery = ref('');

const isCrowded = computed(() => sentInvigilators.value.length > CROWDED);

const filteredSent = computed(() => {
    const query = sentQuery.value.trim().toLowerCase();
    if (!query) return sentInvigilators.value;

    // Code or name — a head looking someone up knows one or the other.
    return sentInvigilators.value.filter((submission) =>
        `${submission.instructor?.employee_no ?? ''} ${submission.instructor?.name ?? ''}`.toLowerCase().includes(query)
    );
});

// A crowded list opens collapsed; a short one has nothing to hide.
watch(
    () => submitTarget.value?.id,
    () => {
        sentQuery.value = '';
        sentOpen.value = !isCrowded.value;
    }
);
</script>

<template>
    <MainDialog
        :visible="visible"
        :header="$lang.sendInvigilators || 'Send Invigilators'"
        :subtitle="submitTarget?.department?.name"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-4 py-1">
            <!-- The three figures that decide what a department still owes. -->
            <div
                v-if="submitTarget"
                class="border-border-subtle bg-surface-subtle grid grid-cols-3 gap-3 rounded-xl border p-3 text-center">
                <div>
                    <p class="text-text-tertiary text-xs">{{ $lang.requiredTotal || 'Required' }}</p>
                    <p class="text-text-primary text-lg font-semibold tabular-nums">
                        {{ submitTarget.required_count }}
                    </p>
                </div>
                <div>
                    <p class="text-text-tertiary text-xs">{{ $lang.submittedTotal || 'Submitted' }}</p>
                    <p class="text-text-primary text-lg font-semibold tabular-nums">
                        {{ submitTarget.submitted_count }}
                    </p>
                </div>
                <div>
                    <p class="text-text-tertiary text-xs">{{ $lang.remainingTotal || 'Remaining' }}</p>
                    <p class="text-schedule-icon-brand text-lg font-semibold tabular-nums">
                        {{ submitTarget.remaining_count }}
                    </p>
                </div>
            </div>

            <!-- Selecting more than was asked for is refused server-side. -->
            <p
                v-if="exceedsRemaining"
                class="border-schedule-error-500 text-schedule-error-500 rounded-xl border border-dashed px-3 py-2 text-xs">
                {{
                    $lang.tooManySelected ||
                    'That is more people than the registrar asked for — deselect some before sending.'
                }}
            </p>

            <!--
                Who this department has already sent for this request.

                Chips rather than rows: a department that has answered in full
                can easily have twenty names, and twenty full-width rows bury
                everything below them. Chips wrap, the block scrolls at a fixed
                height, and past a threshold it collapses and offers a filter.
            -->
            <div
                v-if="sentInvigilators.length"
                class="border-border-subtle rounded-xl border">
                <div class="flex flex-wrap items-center gap-2 px-3 py-2">
                    <button
                        type="button"
                        class="text-text-secondary flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
                        :aria-expanded="sentOpen"
                        @click="sentOpen = !sentOpen">
                        <ChevronArrowDown
                            size="14"
                            class="transition-transform"
                            :class="sentOpen ? '' : '-rotate-90'" />
                        {{ $lang.alreadySent || 'Already sent' }}
                        <span class="text-text-tertiary tabular-nums">({{ sentInvigilators.length }})</span>
                    </button>

                    <InputText
                        v-if="isCrowded && sentOpen"
                        v-model="sentQuery"
                        class="ml-auto w-48"
                        size="small"
                        :placeholder="$lang.filterByNameOrCode || 'Filter by name or code'" />
                </div>

                <div
                    v-if="sentOpen"
                    class="border-border-subtle max-h-40 overflow-y-auto border-t px-3 py-2.5">
                    <p
                        v-if="!filteredSent.length"
                        class="text-text-tertiary py-2 text-center text-xs">
                        {{ $lang.noMatches || 'Nobody matches that' }}
                    </p>

                    <ul
                        v-else
                        class="flex flex-wrap gap-2">
                        <li
                            v-for="submission in filteredSent"
                            :key="submission.id"
                            class="border-border-subtle bg-surface-subtle flex items-center gap-2 rounded-full border py-1 pr-1 pl-2.5">
                            <span class="text-text-secondary text-xs">
                                <span class="text-text-tertiary tabular-nums">
                                    {{ submission.instructor?.employee_no || '—' }}
                                </span>
                                · {{ submission.instructor?.name || '—' }}
                            </span>
                            <button
                                type="button"
                                class="text-text-tertiary hover:text-schedule-error-500 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
                                :title="$lang.withdraw || 'Withdraw'"
                                :aria-label="`${$lang.withdraw || 'Withdraw'} ${submission.instructor?.name ?? ''}`"
                                :disabled="isSavingAction"
                                @click="withdraw(submission.id)">
                                <XmarkIcon class="h-3.5 w-3.5" />
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div>
                <!-- A failed load and an empty department look identical
                     otherwise, which is not a useful thing to show. -->
                <p
                    v-if="instructorError"
                    class="border-schedule-error-500 text-schedule-error-500 mb-3 rounded-xl border border-dashed px-3 py-3 text-center text-xs">
                    {{ instructorError }}
                </p>

                <MultipleSelect
                    v-model="selectedInstructorIds"
                    :options="invigilatorOptions"
                    option-label="label"
                    option-value="id"
                    :label-text="$lang.availableInvigilators || 'Available invigilators'"
                    :placeholder="$lang.selectInvigilators || 'Search staff by name or code'"
                    :loading="isLoadingInstructors"
                    :invalid="exceedsRemaining"
                    show-clear
                    :max="submitTarget?.remaining_count"
                    :helper-message="
                        instructorError || invigilatorOptions.length
                            ? ''
                            : $lang.noAvailableInvigilators ||
                              'Nobody left to send — everyone who can invigilate in this department has already been sent.'
                    " />
            </div>

            <TextArea
                v-model="submitRemark"
                :label="$lang.remark || 'Remark'"
                :rows="2"
                :placeholder="$lang.submissionRemarkHint || 'Optional note for the registrar'" />
        </div>

        <template #footer>
            <div class="mx-2 flex flex-wrap items-center justify-end gap-3">
                <span class="text-text-tertiary mr-auto text-xs">
                    {{ selectedInstructorIds.length }} {{ $lang.selectedLabel || 'selected' }}
                </span>
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="emit('update:visible', false)" />
                <MainButton
                    severity="primary"
                    :label="$lang.sendInvigilators || 'Send Invigilators'"
                    :loading="isSavingAction"
                    :disabled="!selectedInstructorIds.length || exceedsRemaining"
                    @click="submitSelected" />
            </div>
        </template>
    </MainDialog>
</template>
