<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useOfferingDetail } from '@/modules/offerings/composables/useOfferingDetail';
import { useStatusFlow } from '@/composables/useStatusFlow';
import { OFFERING_LOOKUP_TYPE, APPROVAL_DECISION } from '@/modules/offerings/constants/offeringStatus';
import type { LookupValueRef } from '@/composables/useLookupValues';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import TextArea from '@/components/common/TextArea.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import PagePlaceholder from '@/components/common/PagePlaceholder.vue';
import RecentActivityStepper from '@/components/common/RecentActivityStepper.vue';

import FileText from '@/assets/icons/FileText.vue';
import { STATUS_LIGHT, STATUS_SUCCESS, STATUS_DANGER, STATUS_WARNING } from '@/config/appConfig';

const route = useRoute();
const { customizeLanguageData } = useLanguageStore();
const statusFlow = useStatusFlow(OFFERING_LOOKUP_TYPE);

const {
    isLoading,
    isSaving,
    offering,
    approvals,
    form,
    errors,
    levels,
    decisions,
    remarkIsRequired,
    load,
    chooseDecision,
    submitDecision
} = useOfferingDetail();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('courseOfferings', 'Course Offerings'), to: '/offerings' },
    { label: offering.value?.name ?? '' }
]);

/** Label and colour both come from the lookup value — never hardcoded. */
const statusChip = computed(() => statusFlow.resolve(offering.value?.status_code ?? null));

/** A decision's severity, so approvals read green and rejections red. */
const decisionVariant = (code: string | null) => {
    if (code === APPROVAL_DECISION.APPROVED) return STATUS_SUCCESS;
    if (code === APPROVAL_DECISION.REJECTED) return STATUS_DANGER;
    if (code === APPROVAL_DECISION.REVISION_REQUESTED) return STATUS_WARNING;
    return STATUS_LIGHT;
};

/**
 * The stepper takes `StepItem`s; the trail's real shape is rendered through its
 * `#step` slot, so the item only has to carry the index back.
 */
const trailSteps = computed(() =>
    approvals.value.map((approval) => ({ id: approval.id, title: String(approval.sequence) }))
);

const canAct = computed(() => statusFlow.hasOutgoing(offering.value?.status_code ?? null));

onMounted(() => {
    load(String(route.params.uuid));
    statusFlow.refetch();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="FileText" />
        </div>

        <Skeleton v-if="isLoading && !offering" />

        <PagePlaceholder
            v-else-if="!offering"
            :title="$lang.courseOfferingNotFound || 'Course offering not found'" />

        <template v-else>
            <!-- ---- the offering itself ---- -->
            <section class="schedule-card border-border-default rounded-2xl border p-6">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 class="text-text-primary text-xl font-semibold">{{ offering.name }}</h1>
                        <p class="text-text-tertiary mt-1 text-sm">
                            {{ offering.semester?.name }} · {{ offering.department?.name }} ·
                            {{ offering.instructor?.name || $lang.noInstructorYet || 'No instructor yet' }}
                        </p>
                    </div>

                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: statusChip?.color ?? undefined,
                            borderColor: statusChip?.color ?? undefined
                        }"
                        :label="statusChip?.name || offering.status?.name || '—'" />
                </div>

                <dl class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                        <dt class="text-text-tertiary text-xs">{{ $lang.expectedStudents || 'Students' }}</dt>
                        <dd class="text-text-primary text-sm font-medium">{{ offering.expected_students }}</dd>
                    </div>
                    <div>
                        <dt class="text-text-tertiary text-xs">{{ $lang.submittedBy || 'Submitted by' }}</dt>
                        <dd class="text-text-primary text-sm font-medium">
                            {{ offering.submitted_by?.full_name || '—' }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-text-tertiary text-xs">{{ $lang.submittedAt || 'Submitted at' }}</dt>
                        <dd class="text-text-primary text-sm font-medium">{{ offering.submitted_at || '—' }}</dd>
                    </div>
                    <div>
                        <dt class="text-text-tertiary text-xs">{{ $lang.createdBy || 'Drafted by' }}</dt>
                        <dd class="text-text-primary text-sm font-medium">
                            {{ offering.created_by?.full_name || '—' }}
                        </dd>
                    </div>
                </dl>

                <p
                    v-if="offering.remark"
                    class="text-text-secondary border-border-subtle mt-4 border-t pt-4 text-sm">
                    {{ offering.remark }}
                </p>
            </section>

            <!-- ---- record a decision ---- -->
            <section
                v-if="canAct && ($can('approveCourseOffering') || $can('rejectCourseOffering'))"
                class="schedule-card border-border-default space-y-4 rounded-2xl border p-6">
                <h2 class="text-text-primary text-base font-semibold">
                    {{ $lang.recordDecision || 'Record a decision' }}
                </h2>

                <div class="flex flex-wrap gap-2">
                    <MainButton
                        v-if="$can('approveCourseOffering')"
                        severity="primary"
                        :label="$lang.approveOffering || 'Approve'"
                        @click="chooseDecision(APPROVAL_DECISION.APPROVED)" />
                    <MainButton
                        v-if="$can('rejectCourseOffering')"
                        outlined
                        :label="$lang.rejectOffering || 'Reject'"
                        @click="chooseDecision(APPROVAL_DECISION.REJECTED)" />
                    <MainButton
                        v-if="$can('rejectCourseOffering')"
                        outlined
                        :label="$lang.requestOfferingRevision || 'Request revision'"
                        @click="chooseDecision(APPROVAL_DECISION.REVISION_REQUESTED)" />
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MainSelect
                        v-model="form.level_lookup_value_id"
                        :label-text="$lang.approvalLevel || 'Acting as'"
                        :options="levels.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectApprovalLevel || 'Which tier are you?'"
                        :invalid="!!errors.level_lookup_value_id"
                        :message="errors.level_lookup_value_id"
                        message-type="error"
                        size="normal"
                        is-required
                        :loading="levels.loading.value" />
                    <MainSelect
                        v-model="form.decision_lookup_value_id"
                        :label-text="$lang.decision || 'Decision'"
                        :options="decisions.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectDecision || 'Choose a decision'"
                        :invalid="!!errors.decision_lookup_value_id"
                        :message="errors.decision_lookup_value_id"
                        message-type="error"
                        size="normal"
                        is-required
                        :loading="decisions.loading.value" />
                </div>

                <!-- Shown only for the decisions that send the offering back. -->
                <TextArea
                    v-if="remarkIsRequired"
                    v-model="form.remark"
                    :label="$lang.remark || 'Remark'"
                    :rows="3"
                    :is-required="true"
                    :placeholder="$lang.enterRejectionRemark || 'Say why the offering is going back'"
                    :invalid="!!errors.remark"
                    :message="errors.remark"
                    message-type="error" />

                <div class="flex justify-end">
                    <MainButton
                        severity="primary"
                        :label="$lang.recordDecision || 'Record decision'"
                        :loading="isSaving"
                        @click="submitDecision" />
                </div>
            </section>

            <!-- ---- the append-only trail ---- -->
            <RecentActivityStepper
                :title="$lang.approvalTrail || 'Approval trail'"
                :items="trailSteps"
                :clickable="false"
                :show-numbers="false">
                <template #step="{ index }">
                    <div class="flex flex-wrap items-start justify-between gap-3 py-1">
                        <!-- Left: which tier acted. -->
                        <Badge
                            outlined
                            :variant="STATUS_LIGHT"
                            :style="{
                                color: approvals[index]?.level?.color ?? undefined,
                                borderColor: approvals[index]?.level?.color ?? undefined
                            }"
                            :label="approvals[index]?.level?.name || approvals[index]?.level_code || '—'" />

                        <!-- Centre: what they decided, and why if they said. -->
                        <div class="min-w-0 flex-1 px-2">
                            <Badge
                                :variant="decisionVariant(approvals[index]?.decision_code ?? null)"
                                :label="approvals[index]?.decision?.name || approvals[index]?.decision_code || '—'" />
                            <p
                                v-if="approvals[index]?.remark"
                                class="text-text-secondary mt-1 text-sm break-words">
                                {{ approvals[index]?.remark }}
                            </p>
                        </div>

                        <!-- Right: who, and when. -->
                        <div class="text-right">
                            <p class="text-text-primary text-sm font-medium">
                                {{ approvals[index]?.actor?.full_name || '—' }}
                            </p>
                            <p class="text-text-tertiary text-xs">{{ approvals[index]?.acted_at }}</p>
                        </div>
                    </div>
                </template>
            </RecentActivityStepper>

            <p
                v-if="!approvals.length"
                class="text-text-tertiary px-6 text-sm">
                {{ $lang.noDecisionsYet || 'No decisions recorded yet.' }}
            </p>
        </template>
    </div>
</template>
