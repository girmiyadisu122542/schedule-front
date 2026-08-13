<script setup lang="ts">
import { computed } from 'vue';

import { useScheduleSetting } from '@/modules/scheduling/composables/useScheduleSetting';

import MainDialog from '@/components/common/MainDialog.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import InputText from '@/components/common/InputText.vue';
import TimePickerField from '@/components/common/TimePickerField.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';

/**
 * Edit one study mode's generation grid.
 *
 * The periods are not edited directly — they are derived from the day window,
 * the period length, the break and lunch. The preview at the bottom shows what
 * those inputs currently produce, which is the only honest way to edit a
 * derived value: change an input, see the grid move.
 */
const props = defineProps<{ visible: boolean }>();

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

const {
    editForm,
    editErrors,
    isSaving,
    isEditingDialog,
    studyModes,
    unconfiguredModes,
    schedulingConstants,
    toggleDay,
    saveForm
} = useScheduleSetting();

/** Editing keeps its own mode; creating may only pick one with no grid yet. */
const modeOptions = computed(() => (isEditingDialog.value ? studyModes.options.value : unconfiguredModes.value));

/**
 * The grid these inputs produce, previewed live.
 *
 * The same derivation the backend runs — walk from the start in period+break
 * steps, skip anything that collides with lunch, stop when a whole period no
 * longer fits. Mirrored here only to give immediate feedback; the stored value
 * is always the server's.
 */
const toMinutes = (value: string) => {
    const [h, m] = value.split(':');
    return (Number(h) || 0) * 60 + (Number(m) || 0);
};

const clock = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * The sittings a default-length exam gets, previewed live.
 *
 * Unlike a teaching period the length is not a property of the grid — a course
 * with its own exam length gets its own windows at generation time. This shows
 * the default one.
 */
const previewExamWindows = computed(() => {
    const length = Number(editForm.exam_duration_minutes);
    const gap = Number(editForm.exam_gap_minutes) || 0;
    if (!Number.isFinite(length) || length <= 0) return [];

    const end = toMinutes(editForm.exam_day_end);
    const windows: string[] = [];
    let cursor = toMinutes(editForm.exam_day_start);

    while (cursor + length <= end && windows.length < 20) {
        windows.push(`${clock(cursor)}–${clock(cursor + length)}`);
        cursor = cursor + length + gap;
    }

    return windows;
});

const previewPeriods = computed(() => {
    const length = Number(editForm.period_minutes);
    const gap = Number(editForm.break_minutes) || 0;
    if (!Number.isFinite(length) || length <= 0) return [];

    const end = toMinutes(editForm.day_end);
    const lunchStart = editForm.lunch_start ? toMinutes(editForm.lunch_start) : null;
    const lunchEnd = editForm.lunch_end ? toMinutes(editForm.lunch_end) : null;

    const periods: string[] = [];
    let cursor = toMinutes(editForm.day_start);

    // Bounded so a mis-typed window cannot spin the browser.
    while (cursor + length <= end && periods.length < 30) {
        const slotEnd = cursor + length;

        if (lunchStart !== null && lunchEnd !== null && cursor < lunchEnd && slotEnd > lunchStart) {
            cursor = lunchEnd;
            continue;
        }

        periods.push(`${clock(cursor)}–${clock(slotEnd)}`);
        cursor = slotEnd + gap;
    }

    return periods;
});
</script>

<template>
    <MainDialog
        :visible="props.visible"
        :header="
            isEditingDialog
                ? $lang.editScheduleSetting || 'Edit Schedule Setting'
                : $lang.createScheduleSetting || 'Create Schedule Setting'
        "
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-5 py-1">
            <MainSelect
                v-model="editForm.study_mode_lookup_value_id"
                :label-text="$lang.studyMode || 'Study Mode'"
                :options="modeOptions"
                option-label="name"
                option-value="id"
                :placeholder="$lang.selectStudyMode || 'Choose a study mode'"
                size="normal"
                is-required
                :invalid="!!editErrors.study_mode_lookup_value_id"
                :message="editErrors.study_mode_lookup_value_id" />

            <h3
                class="text-text-secondary border-border-subtle border-b pb-1 text-xs font-semibold tracking-wide uppercase">
                {{ $lang.classTimetableSection || 'Class timetable' }}
            </h3>

            <!-- ---- teaching days: this is where Saturday becomes a working day ---- -->
            <FieldWrapper
                :label="$lang.teachingDays || 'Teaching Days'"
                :required="true"
                :error="editErrors.teaching_days">
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="day in schedulingConstants.dayOptions.value"
                        :key="day.id"
                        type="button"
                        class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                        :class="
                            editForm.teaching_days.includes(day.id)
                                ? 'bg-schedule-brand-blue border-schedule-brand-blue text-white'
                                : 'border-border-default text-text-tertiary hover:text-text-secondary'
                        "
                        @click="toggleDay(day.id)">
                        {{ day.name }}
                    </button>
                </div>
            </FieldWrapper>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TimePickerField
                    v-model="editForm.day_start"
                    use24h
                    :minute-step="5"
                    :label="$lang.dayStart || 'Day starts'"
                    :invalid="!!editErrors.day_start"
                    :message="editErrors.day_start" />

                <TimePickerField
                    v-model="editForm.day_end"
                    use24h
                    :minute-step="5"
                    :label="$lang.dayEnd || 'Day ends'"
                    :invalid="!!editErrors.day_end"
                    :message="editErrors.day_end" />

                <InputText
                    v-model="editForm.period_minutes"
                    type="number"
                    :label="$lang.periodMinutes || 'Period length (minutes)'"
                    :is-required="true"
                    :invalid="!!editErrors.period_minutes"
                    :message="editErrors.period_minutes" />

                <InputText
                    v-model="editForm.break_minutes"
                    type="number"
                    :label="$lang.breakMinutes || 'Break between periods (minutes)'"
                    :invalid="!!editErrors.break_minutes"
                    :message="editErrors.break_minutes" />

                <!-- Leave both empty for a grid that does not break for lunch. -->
                <TimePickerField
                    v-model="editForm.lunch_start"
                    use24h
                    :minute-step="5"
                    :label="$lang.lunchStart || 'Lunch starts'"
                    :invalid="!!editErrors.lunch_start"
                    :message="editErrors.lunch_start" />

                <TimePickerField
                    v-model="editForm.lunch_end"
                    use24h
                    :minute-step="5"
                    :label="$lang.lunchEnd || 'Lunch ends'"
                    :invalid="!!editErrors.lunch_end"
                    :message="editErrors.lunch_end" />
            </div>

            <!-- ---- the exam half ---- -->
            <h3
                class="text-text-secondary border-border-subtle border-b pt-2 pb-1 text-xs font-semibold tracking-wide uppercase">
                {{ $lang.examTimetableSection || 'Exam timetable' }}
            </h3>

            <FieldWrapper
                :label="$lang.examDays || 'Exam Days'"
                :required="true"
                :hint="
                    $lang.examDaysHint || 'Often wider than the teaching days — many institutions examine on Saturday.'
                "
                :error="editErrors.exam_days">
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="day in schedulingConstants.dayOptions.value"
                        :key="`exam-${day.id}`"
                        type="button"
                        class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                        :class="
                            editForm.exam_days.includes(day.id)
                                ? 'bg-schedule-brand-blue border-schedule-brand-blue text-white'
                                : 'border-border-default text-text-tertiary hover:text-text-secondary'
                        "
                        @click="toggleDay(day.id, 'exam_days')">
                        {{ day.name }}
                    </button>
                </div>
            </FieldWrapper>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TimePickerField
                    v-model="editForm.exam_day_start"
                    use24h
                    :minute-step="5"
                    :label="$lang.examDayStart || 'Exam day starts'"
                    :invalid="!!editErrors.exam_day_start"
                    :message="editErrors.exam_day_start" />

                <TimePickerField
                    v-model="editForm.exam_day_end"
                    use24h
                    :minute-step="5"
                    :label="$lang.examDayEnd || 'Exam day ends'"
                    :invalid="!!editErrors.exam_day_end"
                    :message="editErrors.exam_day_end" />

                <InputText
                    v-model="editForm.exam_duration_minutes"
                    type="number"
                    :label="$lang.examDurationMinutes || 'Default exam length (minutes)'"
                    :is-required="true"
                    :helper-message="$lang.examDurationHint || 'Used when a course does not set its own exam length.'"
                    :invalid="!!editErrors.exam_duration_minutes"
                    :message="editErrors.exam_duration_minutes" />

                <InputText
                    v-model="editForm.exam_gap_minutes"
                    type="number"
                    :label="$lang.examGapMinutes || 'Turnaround between sittings (minutes)'"
                    :invalid="!!editErrors.exam_gap_minutes"
                    :message="editErrors.exam_gap_minutes" />

                <InputText
                    v-model="editForm.exam_period_days"
                    type="number"
                    :label="$lang.examPeriodDays || 'Exam period length (days)'"
                    :is-required="true"
                    :helper-message="$lang.examPeriodHint || 'Counted back from the end of the semester.'"
                    :invalid="!!editErrors.exam_period_days"
                    :message="editErrors.exam_period_days" />
            </div>

            <ToggleSwitch
                v-model="editForm.is_active"
                :label="$lang.active || 'Active'" />

            <!-- ---- what the generator will actually place into ---- -->
            <section class="border-border-subtle bg-surface-subtle rounded-xl border p-3">
                <p class="text-text-secondary mb-2 text-xs font-semibold">
                    {{ $lang.periodsPreview || 'Periods this produces' }}
                </p>

                <div
                    v-if="previewPeriods.length"
                    class="flex flex-wrap gap-1.5">
                    <span
                        v-for="period in previewPeriods"
                        :key="period"
                        class="bg-surface-card text-text-secondary border-border-subtle rounded-md border px-2 py-1 text-xs tabular-nums">
                        {{ period }}
                    </span>
                </div>

                <p
                    v-else
                    class="text-text-tertiary text-xs">
                    {{ $lang.noPeriodsProduced || 'These settings produce no periods — check the window and length.' }}
                </p>

                <!-- A course with its own exam length gets its own windows. -->
                <p class="text-text-secondary mt-3 mb-2 text-xs font-semibold">
                    {{ $lang.examWindowsPreview || 'Exam sittings at the default length' }}
                </p>

                <div class="flex flex-wrap gap-1.5">
                    <span
                        v-for="window in previewExamWindows"
                        :key="window"
                        class="bg-surface-card text-text-secondary border-border-subtle rounded-md border px-2 py-1 text-xs tabular-nums">
                        {{ window }}
                    </span>
                    <span
                        v-if="!previewExamWindows.length"
                        class="text-text-tertiary text-xs">
                        {{ $lang.noExamWindows || 'No sittings fit — widen the exam day or shorten the exam.' }}
                    </span>
                </div>
            </section>
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-end gap-3">
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="emit('update:visible', false)" />
                <MainButton
                    severity="primary"
                    :label="$lang.save || 'Save'"
                    :loading="isSaving"
                    @click="saveForm" />
            </div>
        </template>
    </MainDialog>
</template>
