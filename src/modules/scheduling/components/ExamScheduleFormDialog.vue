<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import InputText from '@/components/common/InputText.vue';
import TextArea from '@/components/common/TextArea.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import DateTimePicker from '@/components/common/DateTimePicker.vue';
import TimePickerField from '@/components/common/TimePickerField.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useLookupValues } from '@/composables/useLookupValues';
import { EXAM_TYPE_LOOKUP_TYPE } from '@/modules/scheduling/constants/classScheduleStatus';
import { OFFERING_STATUS } from '@/modules/offerings/constants/offeringStatus';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { ExamScheduleForm } from '@/modules/scheduling/types/examSchedule';
import type { DropdownOption } from '@/types/CommonTypes';

const props = defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: ExamScheduleForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

// Only a registrar-approved offering can be examined; the backend refuses the
// rest, so do not offer them.
const offeringDropdown = useDropdownOptions<DropdownOption>('/offerings', {
    [DROPDOWN_PARAM_KEY]: true,
    status_code: OFFERING_STATUS.REGISTRAR_APPROVED
});
// Only exam venues — a lecture hall that is not flagged as one is refused.
const roomDropdown = useDropdownOptions<DropdownOption>('/rooms', {
    [DROPDOWN_PARAM_KEY]: true,
    is_exam_venue: true
});

const examTypes = useLookupValues(EXAM_TYPE_LOOKUP_TYPE);

onMounted(() => {
    offeringDropdown.fetchOptions();
    roomDropdown.fetchOptions();
    examTypes.refetch();
});
/**
 * Whether the accommodation fields are showing.
 *
 * Derived from the form on open — a sitting that already carries an
 * arrangement must not hide it — but writable afterwards, so switching it off
 * clears the fields rather than leaving orphaned values to be saved.
 */
const hasAccommodation = ref(false);

watch(
    () => props.visible,
    (visible: boolean) => {
        if (visible) {
            hasAccommodation.value = !!(
                props.form.accommodation_note ||
                props.form.accommodation_extra_minutes ||
                props.form.accommodation_room_id
            );
        }
    },
    { immediate: true }
);

watch(hasAccommodation, (on: boolean) => {
    if (on) return;

    // Turning it off means there is no arrangement, so the fields go with it.
    props.form.accommodation_note = '';
    props.form.accommodation_extra_minutes = '';
    props.form.accommodation_room_id = null;
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editSitting || 'Edit Exam Schedule' : $lang.createSitting || 'Create Exam Schedule'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.whatIsExamined || 'What Is Examined' }}
                </h3>
                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.sittingOfferingHint ||
                        'The semester and section come from the offering. One exam schedule per exam type per offering.'
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
                        v-model="form.exam_type_lookup_value_id"
                        :label-text="$lang.examType || 'Exam type'"
                        :options="examTypes.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectExamType || 'Midterm, final, makeup…'"
                        :invalid="!!errors.exam_type_lookup_value_id"
                        :message="errors.exam_type_lookup_value_id"
                        message-type="error"
                        size="normal"
                        is-required
                        :loading="examTypes.loading.value" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.whenAndWhere || 'When And Where' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <DateTimePicker
                        v-model="form.exam_date"
                        :label-text="$lang.examDate || 'Exam date'"
                        :invalid="!!errors.exam_date"
                        :message="errors.exam_date"
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

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MainSelect
                        v-model="form.room_id"
                        :label-text="$lang.examHall || 'Hall'"
                        :options="roomDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectExamHall || 'Select an exam venue'"
                        :invalid="!!errors.room_id"
                        :message="errors.room_id"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        show-refresh
                        :loading="roomDropdown.loading.value"
                        @refresh="roomDropdown.fetchOptions(true)" />
                    <InputText
                        v-model="form.required_invigilators"
                        :label="$lang.invigilators || 'Invigilators needed'"
                        :placeholder="$lang.enterInvigilatorCount || 'e.g. 2'"
                        :invalid="!!errors.required_invigilators"
                        :message="errors.required_invigilators"
                        message-type="error"
                        size="normal" />
                </div>

                <!--
                    ---- Accommodations (C21) ----

                    Collapsed behind a toggle because most sittings need none,
                    and three permanently visible empty fields make the common
                    case look unfinished.
                -->
                <section class="border-border-subtle rounded-xl border p-4">
                    <ToggleSwitch
                        v-model="hasAccommodation"
                        :label="$lang.hasAccommodation || 'This exam has a special arrangement'" />
                    <p class="text-text-tertiary mt-1 text-xs">
                        {{
                            $lang.accommodationHint ||
                            'Extra time, a separate room, a reader or a scribe. Recorded here and printed with the duty roster.'
                        }}
                    </p>

                    <div
                        v-if="hasAccommodation"
                        class="mt-4 space-y-4">
                        <TextArea
                            v-model="form.accommodation_note"
                            :label="$lang.accommodationNote || 'What is needed'"
                            :rows="2"
                            :placeholder="
                                $lang.accommodationNotePlaceholder ||
                                'e.g. one candidate needs a reader and a separate room'
                            "
                            :invalid="!!errors.accommodation_note"
                            :message="errors.accommodation_note" />

                        <div class="grid gap-4 sm:grid-cols-2">
                            <InputText
                                v-model="form.accommodation_extra_minutes"
                                type="number"
                                :label="$lang.extraTimeMinutes || 'Extra time (minutes)'"
                                :invalid="!!errors.accommodation_extra_minutes"
                                :message="errors.accommodation_extra_minutes"
                                size="normal" />

                            <MainSelect
                                v-model="form.accommodation_room_id"
                                :label-text="$lang.accommodationRoom || 'Separate room'"
                                :options="roomDropdown.options.value"
                                option-label="name"
                                option-value="id"
                                :placeholder="$lang.selectRoom || 'Select a room'"
                                size="normal"
                                search
                                show-clear
                                :helper-message="
                                    $lang.accommodationRoomHint ||
                                    'Reserved alongside the main hall, not instead of it.'
                                "
                                :loading="roomDropdown.loading.value" />
                        </div>
                    </div>
                </section>

                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.sittingPublishHint ||
                        'A hall is judged on its exam capacity, not its teaching capacity — spaced seating takes far more room.'
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
