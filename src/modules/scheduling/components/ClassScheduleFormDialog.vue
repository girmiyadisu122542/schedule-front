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

defineProps<{
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

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <MainSelect
                        v-model="form.day_of_week"
                        :label-text="$lang.dayOfWeek || 'Day'"
                        :options="schedulingConstants.dayOptions.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectDay || 'Select a day'"
                        :invalid="!!errors.day_of_week"
                        :message="errors.day_of_week"
                        message-type="error"
                        size="normal"
                        is-required />
                    <TimePickerField
                        v-model="form.start_time"
                        use24h
                        :minute-step="5"
                        :label="$lang.startTime || 'Start time'"
                        :placeholder="$lang.selectStartTime || '08:00'"
                        :invalid="!!errors.start_time"
                        :message="errors.start_time" />
                    <TimePickerField
                        v-model="form.end_time"
                        use24h
                        :minute-step="5"
                        :label="$lang.endTime || 'End time'"
                        :placeholder="$lang.selectEndTime || '09:30'"
                        :invalid="!!errors.end_time"
                        :message="errors.end_time" />
                </div>

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
