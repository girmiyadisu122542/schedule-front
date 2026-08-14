<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useLookupValues, type LookupValueRef } from '@/composables/useLookupValues';
import { INVIGILATOR_ROLE_LOOKUP_TYPE } from '@/modules/invigilation/constants/invigilationStatus';
import {
    assignInvigilator,
    fetchAssignments,
    removeAssignment
} from '@/modules/invigilation/services/examInvigilatorAssignmentService';
import { readApiErrorMessage } from '@/utils/apiError';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { Assignment } from '@/modules/invigilation/types/assignment';
import type { ExamSchedule } from '@/modules/scheduling/types/examSchedule';
import type { DropdownOption } from '@/types/CommonTypes';

import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import Badge from '@/components/common/Badge.vue';
import TrashIcon from '@/assets/icons/TrashIcon.vue';
import { STATUS_LIGHT, STATUS_WARNING } from '@/config/appConfig';

/**
 * Who is on duty at ONE exam, and changing it.
 *
 * The duty roster screen lists every duty in a semester, which is the right
 * shape for printing and the wrong one for the question "who is watching this
 * hall?". Staffing a specific sitting had no home at all — this is it.
 *
 * The derived count is a starting point, not a verdict: adding a person raises
 * the requirement and removing one lowers it, so the sitting never reads as
 * short of a number nobody chose.
 */
const props = defineProps<{
    visible: boolean;
    sitting: ExamSchedule | null;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    /** The sitting changed — the host refetches so its counts stay true. */
    (e: 'changed'): void;
}>();

const { customizeLanguageData } = useLanguageStore();

const label = (key: string, fallback: string) => customizeLanguageData(key, fallback);
const genericError = (error: unknown) =>
    readApiErrorMessage(error, label('somethingWentWrong', 'Something went wrong'));

const duties = ref<Assignment[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const instructorId = ref<number | null>(null);
const roleId = ref<number | null>(null);
const busyId = ref<number | null>(null);

const roles = useLookupValues(INVIGILATOR_ROLE_LOOKUP_TYPE);

// Only people who may invigilate. Deliberately NOT limited to the submitted
// pool: a registrar filling a hall an hour before an exam has to be able to put
// a name in without a request round-trip.
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', {
    [DROPDOWN_PARAM_KEY]: true,
    can_invigilate: true,
    is_active: true
});

/** Live duties only — a declined or replaced one is nobody's name to show. */
const onDuty = computed(() => duties.value.filter((duty) => duty.state === 1));

const required = computed(() => Number(props.sitting?.required_invigilators ?? 0));

const shortfall = computed(() => Math.max(0, required.value - onDuty.value.length));

/** Whom it is still worth offering — somebody already on the hall is not. */
const availableInstructors = computed(() => {
    const taken = new Set(onDuty.value.map((duty) => duty.instructor_id));

    return instructorDropdown.options.value.filter((option: DropdownOption) => !taken.has(option.id));
});

const load = async () => {
    if (!props.sitting) return;

    isLoading.value = true;
    try {
        const result = await fetchAssignments({ exam_schedule_id: props.sitting.id, limit: 100 });
        duties.value = result.data;
    } catch (error: unknown) {
        toast.error(genericError(error));
        duties.value = [];
    } finally {
        isLoading.value = false;
    }
};

const add = async () => {
    if (!props.sitting || !instructorId.value) return;

    isSaving.value = true;
    try {
        const result = await assignInvigilator({
            exam_schedule_id: props.sitting.id,
            instructor_id: instructorId.value,
            role_lookup_value_id: roleId.value
        });

        toast.success(result.message ?? label('savedSuccessfully', 'Saved successfully'));
        instructorId.value = null;
        await load();
        emit('changed');
    } catch (error: unknown) {
        // The double-booking constraint speaks here: "already on duty at that
        // hour" arrives already translated.
        toast.error(genericError(error));
    } finally {
        isSaving.value = false;
    }
};

const remove = async (duty: Assignment) => {
    busyId.value = duty.id;
    try {
        const result = await removeAssignment(duty.id);
        toast.success(result.message ?? label('savedSuccessfully', 'Saved successfully'));
        await load();
        emit('changed');
    } catch (error: unknown) {
        toast.error(genericError(error));
    } finally {
        busyId.value = null;
    }
};

// Reload whenever a different sitting is opened, not merely on first show.
watch(
    () => [props.visible, props.sitting?.id],
    ([visible]) => {
        if (!visible) return;

        instructorId.value = null;
        load();
        instructorDropdown.fetchOptions();
        roles.refetch();
    },
    { immediate: true }
);
</script>

<template>
    <MainDialog
        :visible="visible"
        :header="$lang.manageInvigilators || 'Invigilators'"
        :subtitle="sitting?.name"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-4 py-1">
            <!-- What the hall needs against what it has. -->
            <div
                class="border-border-subtle bg-surface-subtle grid grid-cols-3 gap-3 rounded-xl border p-3 text-center">
                <div>
                    <p class="text-text-tertiary text-xs">{{ $lang.requiredTotal || 'Required' }}</p>
                    <p class="text-text-primary text-lg font-semibold tabular-nums">{{ required }}</p>
                </div>
                <div>
                    <p class="text-text-tertiary text-xs">{{ $lang.onDuty || 'On duty' }}</p>
                    <p class="text-text-primary text-lg font-semibold tabular-nums">{{ onDuty.length }}</p>
                </div>
                <div>
                    <p class="text-text-tertiary text-xs">{{ $lang.shortBy || 'Short by' }}</p>
                    <p
                        class="text-lg font-semibold tabular-nums"
                        :class="shortfall > 0 ? 'text-schedule-warning-500' : 'text-text-primary'">
                        {{ shortfall }}
                    </p>
                </div>
            </div>

            <!-- ---- who is on the hall ---- -->
            <div>
                <p class="text-text-secondary mb-2 text-xs font-semibold">
                    {{ $lang.onDuty || 'On duty' }}
                </p>

                <p
                    v-if="isLoading"
                    class="text-text-tertiary py-4 text-center text-sm">
                    {{ $lang.loading || 'Loading…' }}
                </p>

                <p
                    v-else-if="!onDuty.length"
                    class="border-border-subtle text-text-tertiary rounded-xl border border-dashed px-3 py-6 text-center text-xs">
                    {{ $lang.nobodyOnDuty || 'Nobody is on this hall yet.' }}
                </p>

                <ul
                    v-else
                    class="border-border-subtle divide-y rounded-xl border">
                    <li
                        v-for="duty in onDuty"
                        :key="duty.id"
                        class="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <span class="min-w-0">
                            <span class="text-text-primary block text-sm font-medium">
                                {{ duty.instructor?.name || '—' }}
                            </span>
                            <span class="text-text-tertiary block text-xs tabular-nums">
                                {{ duty.instructor?.employee_no }}
                            </span>
                        </span>

                        <span class="flex items-center gap-2">
                            <Badge
                                outlined
                                :variant="STATUS_LIGHT"
                                :label="duty.role?.name || duty.role_code || '—'" />
                            <!--
                                Only an unanswered duty may be taken off: once
                                somebody has accepted or declined, that is a
                                record and Replace is the honest way to change
                                it. The backend refuses it either way.
                            -->
                            <Badge
                                v-if="duty.status_code !== 'assigned'"
                                :variant="STATUS_WARNING"
                                :label="duty.status?.name || duty.status_code || ''" />
                            <MainButton
                                v-else
                                text
                                size="small"
                                :icon="TrashIcon"
                                :tooltip="$lang.removeInvigilator || 'Take off duty'"
                                :loading="busyId === duty.id"
                                @click="remove(duty)" />
                        </span>
                    </li>
                </ul>
            </div>

            <!-- ---- put somebody on ---- -->
            <div class="border-border-subtle space-y-3 border-t pt-4">
                <p class="text-text-secondary text-xs font-semibold">
                    {{ $lang.addInvigilator || 'Put somebody on this hall' }}
                </p>

                <div class="grid gap-3 sm:grid-cols-2">
                    <MainSelect
                        v-model="instructorId"
                        :label-text="$lang.instructor || 'Invigilator'"
                        :options="availableInstructors"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectInstructor || 'Select an instructor'"
                        size="normal"
                        search
                        show-refresh
                        :loading="instructorDropdown.loading.value"
                        @refresh="instructorDropdown.fetchOptions(true)" />

                    <MainSelect
                        v-model="roleId"
                        :label-text="$lang.invigilatorRole || 'Role'"
                        :options="roles.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.chiefOrAssistant || 'Chief or assistant'"
                        size="normal"
                        show-clear
                        :helper-message="
                            $lang.roleDefaultHint || 'Left blank, the first person on a hall becomes chief.'
                        " />
                </div>

                <MainButton
                    severity="primary"
                    :label="$lang.addInvigilator || 'Add to this hall'"
                    :loading="isSaving"
                    :disabled="!instructorId"
                    @click="add" />
            </div>
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-end">
                <MainButton
                    outlined
                    :label="$lang.close || 'Close'"
                    @click="emit('update:visible', false)" />
            </div>
        </template>
    </MainDialog>
</template>
