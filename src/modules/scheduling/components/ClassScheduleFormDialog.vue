<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import TimePickerField from '@/components/common/TimePickerField.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useLookupValues } from '@/composables/useLookupValues';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import { SESSION_TYPE_LOOKUP_TYPE } from '@/modules/scheduling/constants/classScheduleStatus';
import { OFFERING_STATUS } from '@/modules/offerings/constants/offeringStatus';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { ClassScheduleForm } from '@/modules/scheduling/types/classSchedule';
import type { DropdownOption } from '@/types/CommonTypes';

const props = defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: ClassScheduleForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

// Only a registrar-approved offering can be scheduled; the backend refuses the
// rest, so do not offer them.
const offeringDropdown = useDropdownOptions<DropdownOption>('/offerings', {
    [DROPDOWN_PARAM_KEY]: true,
    status_code: OFFERING_STATUS.REGISTRAR_APPROVED
});
const roomDropdown = useDropdownOptions<DropdownOption>('/rooms', { [DROPDOWN_PARAM_KEY]: true });
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', {
    [DROPDOWN_PARAM_KEY]: true,
    can_teach: true
});

const sessionTypes = useLookupValues(SESSION_TYPE_LOOKUP_TYPE);
const schedulingConstants = useSchedulingConstants();

onMounted(() => {
    offeringDropdown.fetchOptions();
    roomDropdown.fetchOptions();
    instructorDropdown.fetchOptions();
    sessionTypes.refetch();
    schedulingConstants.load();
});

/**
 * A blank day/time row.
 *
 * Seeded from the last row's END time, because the common case is a second
 * session later the same week and retyping "09:30" every time is friction the
 * form can absorb.
 */
function addSlot() {
    const previous = props.form.slots[props.form.slots.length - 1];

    props.form.slots.push({
        day_of_week: null,
        start_time: previous?.end_time ?? '',
        end_time: ''
    });
}

function removeSlot(index: number) {
    props.form.slots.splice(index, 1);
}
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="
            isEditing
                ? $lang.editClassSession || 'Edit Class Schedule'
                : $lang.createClassSession || 'Create Class Schedule'
        "
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.whatIsTaught || 'What Is Taught' }}
                </h3>
                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.classSessionOfferingHint ||
                        'The semester and section come from the offering — they are never entered here.'
                    }}
                </p>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MainSelect
                        v-model="form.course_offering_id"
                        :label-text="$lang.courseOffering || 'Course offering'"
                        :options="offeringDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectOffering || 'Select an approved offering'"
                        :invalid="!!errors.course_offering_id"
                        :message="errors.course_offering_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="offeringDropdown.loading.value"
                        @refresh="offeringDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.session_type_lookup_value_id"
                        :label-text="$lang.sessionType || 'Session type'"
                        :options="sessionTypes.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectSessionType || 'Lecture, lab, tutorial…'"
                        :invalid="!!errors.session_type_lookup_value_id"
                        :message="errors.session_type_lookup_value_id"
                        message-type="error"
                        size="normal"
                        show-clear
                        :loading="sessionTypes.loading.value" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.whenAndWhere || 'When And Where' }}
                </h3>

                <!--
                    A course meets more than once a week, so CREATE collects
                    every day and time at once. Editing stays single: an edit
                    moves one existing meeting, and offering to add rows there
                    would blur "change this" with "add more".
                -->
                <p
                    v-if="!isEditing"
                    class="text-text-tertiary text-xs">
                    {{
                        $lang.multipleSlotsHint ||
                        'Add every day and time this course meets. They share the room and instructor below unless you set one per session.'
                    }}
                </p>

                <div
                    v-for="(slot, index) in form.slots"
                    :key="index"
                    class="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <MainSelect
                        v-model="slot.day_of_week"
                        :label-text="$lang.dayOfWeek || 'Day'"
                        :options="schedulingConstants.dayOptions.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectDay || 'Select a day'"
                        :invalid="!!errors[`slots.${index}.day_of_week`]"
                        :message="errors[`slots.${index}.day_of_week`]"
                        message-type="error"
                        size="normal"
                        is-required />
                    <TimePickerField
                        v-model="slot.start_time"
                        use24h
                        :minute-step="5"
                        :label="$lang.startTime || 'Start time'"
                        :placeholder="$lang.selectStartTime || '08:00'"
                        :invalid="!!errors[`slots.${index}.start_time`]"
                        :message="errors[`slots.${index}.start_time`]" />
                    <TimePickerField
                        v-model="slot.end_time"
                        use24h
                        :minute-step="5"
                        :label="$lang.endTime || 'End time'"
                        :placeholder="$lang.selectEndTime || '09:30'"
                        :invalid="!!errors[`slots.${index}.end_time`]"
                        :message="errors[`slots.${index}.end_time`]" />
                    <!-- Never removable down to nothing: one slot IS the form. -->
                    <MainButton
                        v-if="!isEditing && form.slots.length > 1"
                        outlined
                        severity="danger"
                        class="mt-6"
                        :label="$lang.remove || 'Remove'"
                        @click="removeSlot(index)" />
                </div>

                <MainButton
                    v-if="!isEditing"
                    outlined
                    :label="$lang.addAnotherSession || 'Add another session'"
                    @click="addSlot" />

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MainSelect
                        v-model="form.room_id"
                        :label-text="$lang.room || 'Room'"
                        :options="roomDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectRoom || 'Select a room'"
                        :invalid="!!errors.room_id"
                        :message="errors.room_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        show-refresh
                        :loading="roomDropdown.loading.value"
                        @refresh="roomDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.instructor_id"
                        :label-text="$lang.instructor || 'Instructor'"
                        :options="instructorDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectInstructor || 'Select an instructor'"
                        :invalid="!!errors.instructor_id"
                        :message="errors.instructor_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        show-refresh
                        :loading="instructorDropdown.loading.value"
                        @refresh="instructorDropdown.fetchOptions(true)" />
                </div>

                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.classSessionPublishHint ||
                        'A schedule needs both a room and an instructor before it can be published.'
                    }}
                </p>
            </section>
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-end gap-3">
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="emit('update:visible', false)" />
                <MainButton
                    :label="isEditing ? $lang.saveChanges || 'Save Changes' : $lang.saveAsDraft || 'Save as draft'"
                    severity="primary"
                    :loading="isSaving"
                    @click="emit('save')" />
            </div>
        </template>
    </MainDialog>
</template>
