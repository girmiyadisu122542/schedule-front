<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import TextArea from '@/components/common/TextArea.vue';
import DateTimePicker from '@/components/common/DateTimePicker.vue';
import TimePickerField from '@/components/common/TimePickerField.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { AvailabilityForm } from '@/modules/invigilation/types/availability';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isSaving: boolean;
    form: AvailabilityForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

// Only someone marked as able to invigilate can be offered; the backend rejects
// the rest, so do not offer them.
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', {
    [DROPDOWN_PARAM_KEY]: true,
    can_invigilate: true
});
const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });

onMounted(() => {
    instructorDropdown.fetchOptions();
    semesterDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="$lang.submitAvailability || 'Offer an Availability Window'"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-6 py-1">
            <p class="text-text-tertiary text-xs">
                {{
                    $lang.availabilityHint ||
                    'A window means the instructor IS available. There is nothing to record for the hours they are not — leaving a window out is the way to say no.'
                }}
            </p>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    is-required
                    search
                    show-refresh
                    :loading="instructorDropdown.loading.value"
                    @refresh="instructorDropdown.fetchOptions(true)" />
                <MainSelect
                    v-model="form.semester_id"
                    :label-text="$lang.semester || 'Semester'"
                    :options="semesterDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.selectSemester || 'Select a semester'"
                    :invalid="!!errors.semester_id"
                    :message="errors.semester_id"
                    message-type="error"
                    size="normal"
                    is-required
                    search
                    show-refresh
                    :loading="semesterDropdown.loading.value"
                    @refresh="semesterDropdown.fetchOptions(true)" />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <DateTimePicker
                    v-model="form.available_date"
                    :label-text="$lang.availableDate || 'Available on'"
                    :invalid="!!errors.available_date"
                    :message="errors.available_date"
                    message-type="error"
                    is-required />
                <TimePickerField
                    v-model="form.start_time"
                    use24h
                    :minute-step="5"
                    :label="$lang.startTime || 'Start time'"
                    :placeholder="$lang.selectStartTime || '09:00'"
                    :invalid="!!errors.start_time"
                    :message="errors.start_time" />
                <TimePickerField
                    v-model="form.end_time"
                    use24h
                    :minute-step="5"
                    :label="$lang.endTime || 'End time'"
                    :placeholder="$lang.selectEndTime || '12:00'"
                    :invalid="!!errors.end_time"
                    :message="errors.end_time" />
            </div>

            <TextArea
                v-model="form.remark"
                :label="$lang.remark || 'Remark'"
                :rows="3"
                :placeholder="$lang.enterAvailabilityRemark || 'Optional note for the registrar'"
                :invalid="!!errors.remark"
                :message="errors.remark"
                message-type="error" />
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-end gap-3">
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="emit('update:visible', false)" />
                <MainButton
                    severity="primary"
                    :label="$lang.submitAvailabilityAction || 'Submit window'"
                    :loading="isSaving"
                    @click="emit('save')" />
            </div>
        </template>
    </MainDialog>
</template>
