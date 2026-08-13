<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { useInvigilationRequest } from '@/modules/invigilation/composables/useInvigilationRequest';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import MainButton from '@/components/common/MainButton.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import InvigilationRequestFormDialog from '@/modules/invigilation/components/InvigilationRequestFormDialog.vue';
import SubmitInvigilatorsDialog from '@/modules/invigilation/components/SubmitInvigilatorsDialog.vue';

import ShieldCheckAltIcon from '@/assets/icons/ShieldCheckAltIcon.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import { STATUS_LIGHT, STATUS_SUCCESS, STATUS_WARNING } from '@/config/appConfig';
import { FULFILMENT_STATUS } from '@/modules/invigilation/constants/invigilationStatus';
import type {
    InvigilationRequest,
    InvigilationRequestDepartment
} from '@/modules/invigilation/types/invigilationRequest';

/**
 * Invigilation requests — one screen, both sides.
 *
 * The registrar's list and a department's inbox are the same rows read from
 * different ends: the backend returns only requests that ask something of a
 * department the caller owns, so what differs is which actions appear, not
 * which screen is open. Expanding a row shows the per-department breakdown,
 * which is where a department answers and a registrar sees who has.
 */
const { customizeLanguageData } = useLanguageStore();
const allowedRoutesStore = useAllowedRoutesStore();
const {
    isLoading,
    requests,
    tableColumns,
    filterFields,
    dialogVisible,
    confirmState,
    submitDialogVisible,
    fetchRequests,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    openSubmitDialog,
    withdraw,
    isOpen,
    isDepartmentView,
    ownShare,
    statusFlow,
    semesterDropdown
} = useInvigilationRequest();

const breadcrumbItems = computed(() => [
    { label: customizeLanguageData('invigilationRequests', 'Invigilation Requests') }
]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const statusChip = (request: InvigilationRequest) => statusFlow.resolve(request.status_code);

/** Derived server-side from required vs submitted — never a stored column. */
const fulfilmentVariant = (share: InvigilationRequestDepartment) => {
    if (share.fulfilment_code === FULFILMENT_STATUS.COMPLETE) return STATUS_SUCCESS;

    return share.fulfilment_code === FULFILMENT_STATUS.PARTIAL ? STATUS_WARNING : STATUS_LIGHT;
};

const fulfilmentLabel = (share: InvigilationRequestDepartment) => {
    if (share.fulfilment_code === FULFILMENT_STATUS.COMPLETE) return customizeLanguageData('complete', 'Complete');
    if (share.fulfilment_code === FULFILMENT_STATUS.PARTIAL) return customizeLanguageData('partial', 'Partial');

    return customizeLanguageData('pending', 'Pending');
};

/**
 * A department may answer only its own share, and only while the request is
 * open. The server enforces both; this decides whether to offer the button.
 */
const canRespond = (request: InvigilationRequest, share: InvigilationRequestDepartment) =>
    isOpen(request) &&
    share.remaining_count > 0 &&
    allowedRoutesStore.can('respondToInvigilationRequest') &&
    (allowedRoutesStore.isScopeRestricted
        ? allowedRoutesStore.scopedDepartments.some((department) => department.id === share.department_id)
        : true);

onMounted(() => {
    fetchRequests();
    // useStatusFlow lives inside a shared composable, so its auto-fetch never
    // fires — pull the status catalogue and transition edges explicitly.
    statusFlow.refetch();
    semesterDropdown.fetchOptions();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="ShieldCheckAltIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.invigilationRequests || 'Invigilation Requests' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.invigilationRequestsDesc ||
                        'The registrar asks departments for invigilators, each for its own number. The people departments send become the pool exam staffing draws from.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="requests"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                expandable
                children-key="departments"
                :search-placeholder="$lang.searchRequests || 'Search requests...'"
                :show-add-button="$can('createInvigilationRequest')"
                :show-refresh="true"
                @refresh="fetchRequests"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchRequests({ page })"
                @update:limit="(value: number) => fetchRequests({ perPage: value })">
                <template #cell-name="{ item }">
                    <span class="text-text-primary font-medium">{{ (item as InvigilationRequest).name }}</span>
                </template>

                <!-- ---- a department head's own line, not the whole institution ---- -->
                <template #cell-own_department="{ item }">
                    <span class="text-text-secondary">
                        {{ ownShare(item as InvigilationRequest)?.department?.name || '—' }}
                    </span>
                </template>

                <template #cell-own_required="{ item }">
                    <span class="text-text-secondary tabular-nums">
                        {{ ownShare(item as InvigilationRequest)?.required_count ?? '—' }}
                    </span>
                </template>

                <template #cell-own_submitted="{ item }">
                    <span class="text-text-primary font-medium tabular-nums">
                        {{ ownShare(item as InvigilationRequest)?.submitted_count ?? '—' }}
                    </span>
                </template>

                <template #cell-own_remaining="{ item }">
                    <span
                        class="tabular-nums"
                        :class="
                            (ownShare(item as InvigilationRequest)?.remaining_count ?? 0) > 0
                                ? 'text-schedule-warning-strong font-medium'
                                : 'text-text-tertiary'
                        ">
                        {{ ownShare(item as InvigilationRequest)?.remaining_count ?? '—' }}
                    </span>
                </template>

                <template #cell-own_status="{ item }">
                    <Badge
                        v-if="ownShare(item as InvigilationRequest)"
                        outlined
                        :variant="fulfilmentVariant(ownShare(item as InvigilationRequest)!)"
                        :label="fulfilmentLabel(ownShare(item as InvigilationRequest)!)" />
                    <span v-else>—</span>
                </template>

                <template #cell-department_count="{ item }">
                    <span class="text-text-secondary tabular-nums">
                        {{ (item as InvigilationRequest).department_count }}
                    </span>
                </template>

                <template #cell-required_total="{ item }">
                    <span class="text-text-secondary tabular-nums">
                        {{ (item as InvigilationRequest).required_total }}
                    </span>
                </template>

                <template #cell-submitted_total="{ item }">
                    <span class="text-text-primary font-medium tabular-nums">
                        {{ (item as InvigilationRequest).submitted_total }}
                    </span>
                </template>

                <template #cell-remaining_total="{ item }">
                    <span
                        class="tabular-nums"
                        :class="
                            (item as InvigilationRequest).remaining_total > 0
                                ? 'text-schedule-warning-strong font-medium'
                                : 'text-text-tertiary'
                        ">
                        {{ (item as InvigilationRequest).remaining_total }}
                    </span>
                </template>

                <template #cell-status_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: statusChip(item as InvigilationRequest)?.color ?? undefined,
                            borderColor: statusChip(item as InvigilationRequest)?.color ?? undefined
                        }"
                        :label="
                            statusChip(item as InvigilationRequest)?.name ||
                            (item as InvigilationRequest).status?.name ||
                            '—'
                        " />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as InvigilationRequest)" />
                </template>

                <!-- The per-department breakdown: who was asked, who has answered. -->
                <template #expanded-row="{ item }">
                    <div class="space-y-2 px-4 py-1">
                        <div
                            v-for="share in (item as InvigilationRequest).departments ?? []"
                            :key="share.id"
                            class="schedule-card border-border-subtle rounded-xl border p-3">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <div class="min-w-0">
                                    <p class="text-text-primary text-sm font-medium">
                                        {{ share.department?.name || '—' }}
                                    </p>
                                    <p class="text-text-tertiary text-xs tabular-nums">
                                        {{ $lang.requiredTotal || 'Required' }} {{ share.required_count }} ·
                                        {{ $lang.submittedTotal || 'Submitted' }} {{ share.submitted_count }} ·
                                        {{ $lang.remainingTotal || 'Remaining' }} {{ share.remaining_count }}
                                    </p>
                                </div>

                                <div class="flex flex-wrap items-center gap-2">
                                    <Badge
                                        outlined
                                        :variant="fulfilmentVariant(share)"
                                        :label="fulfilmentLabel(share)" />
                                    <MainButton
                                        v-if="canRespond(item as InvigilationRequest, share)"
                                        severity="primary"
                                        size="small"
                                        :label="$lang.sendInvigilators || 'Send Invigilators'"
                                        @click="openSubmitDialog(share)" />
                                </div>
                            </div>

                            <!-- Who this department has already sent. -->
                            <ul
                                v-if="share.submissions?.length"
                                class="border-border-subtle mt-3 space-y-1 border-t pt-2">
                                <li
                                    v-for="submission in share.submissions"
                                    :key="submission.id"
                                    class="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span class="text-text-secondary">
                                        <span class="text-text-tertiary tabular-nums">
                                            {{ submission.instructor?.employee_no || '—' }}
                                        </span>
                                        · {{ submission.instructor?.name || '—' }}
                                    </span>
                                    <MainButton
                                        v-if="
                                            canRespond(item as InvigilationRequest, share) ||
                                            share.remaining_count === 0
                                        "
                                        text
                                        size="small"
                                        :icon="TrashIcon"
                                        :tooltip="$lang.withdraw || 'Withdraw'"
                                        @click="withdraw(submission.id)" />
                                </li>
                            </ul>
                        </div>
                    </div>
                </template>
            </MainTable>
        </div>

        <InvigilationRequestFormDialog v-model:visible="dialogVisible" />
        <SubmitInvigilatorsDialog v-model:visible="submitDialogVisible" />

        <ConfirmDialog
            v-model:show="confirmState.show"
            :title="confirmState.title"
            :message="confirmState.message"
            :item-label="confirmState.itemLabel"
            :item-name="confirmState.itemName"
            :item-names="confirmState.itemNames"
            :status-transition="confirmState.statusTransition"
            :confirm-label="confirmState.confirmLabel"
            :cancel-label="$lang.cancel"
            :type="confirmState.type"
            :loading="confirmState.loading"
            @confirm="confirmState.onConfirm" />
    </div>
</template>
