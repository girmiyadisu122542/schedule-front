import { computed, reactive, ref } from 'vue';
import { toast } from 'vue-sonner';
import { createSharedComposable } from '@vueuse/core';

import { useLanguageStore } from '@/stores/languageStore';
import { useLookupValues, type LookupValueRef } from '@/composables/useLookupValues';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import { scheduleSettingSchema } from '@/modules/scheduling/schemas/scheduleSettingSchema';
import { STUDY_MODE_LOOKUP_TYPE } from '@/modules/scheduling/constants/classScheduleStatus';
import { SETTINGS_PAGE_LIMIT } from '@/modules/scheduling/constants/scheduleView';
import {
    fetchScheduleSettings,
    createScheduleSetting,
    updateScheduleSetting
} from '@/modules/scheduling/services/scheduleSettingService';
import type { ScheduleSetting, ScheduleSettingForm } from '@/modules/scheduling/types/scheduleSetting';
import { extractFieldErrors, readApiErrorMessage, toFormErrors } from '@/utils/apiError';

const emptyForm = (): ScheduleSettingForm => ({
    study_mode_lookup_value_id: null,
    teaching_days: [],
    day_start: '08:00',
    day_end: '17:15',
    period_minutes: '90',
    break_minutes: '15',
    lunch_start: '13:00',
    lunch_end: '14:00',
    exam_days: [],
    exam_day_start: '09:00',
    exam_day_end: '17:00',
    exam_duration_minutes: '180',
    exam_gap_minutes: '120',
    exam_period_days: '14',
    // Defaults that match the column defaults, so an unconfigured grid and a
    // freshly created one behave identically.
    max_exams_per_day: '2',
    min_hours_between_exams: '0',
    students_per_invigilator: '50',
    min_invigilators_per_room: '1',
    weight_spread_sessions: '10',
    weight_avoid_gaps: '6',
    weight_room_fit: '3',
    weight_same_building: '4',
    allow_cross_campus_day: false,
    is_active: true
});

/**
 * The generation grid per study mode — Configuration, not day-to-day work.
 *
 * Deliberately NOT `useCrudResource`: that engine assumes a delete action and a
 * paginated table, and this is a fixed handful of rows (one per study mode)
 * that are edited and deactivated but never removed. A settings screen that
 * offered Delete would be offering something the backend has no route for.
 */
function scheduleSettingManager() {
    const { customizeLanguageData } = useLanguageStore();
    const schedulingConstants = useSchedulingConstants();
    /** The study modes a grid can be configured for. */
    const studyModes = useLookupValues(STUDY_MODE_LOOKUP_TYPE);

    const isLoading = ref(false);
    const settings = ref<ScheduleSetting[]>([]);

    const dialogVisible = ref(false);
    const isEditingDialog = ref(false);
    const editingId = ref<number | null>(null);
    const isSaving = ref(false);
    const editErrors = ref<Record<string, string>>({});
    const editForm = reactive(emptyForm());

    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const load = async () => {
        isLoading.value = true;
        try {
            const result = await fetchScheduleSettings({ limit: SETTINGS_PAGE_LIMIT });
            settings.value = result.data;
        } catch (error: unknown) {
            toast.error(genericError(error));
        } finally {
            isLoading.value = false;
        }
    };

    /** Study modes that have no grid yet — the only ones Add may offer. */
    const unconfiguredModes = computed(() => {
        const taken = new Set(settings.value.map((setting) => setting.study_mode_lookup_value_id));

        return studyModes.options.value.filter((mode: LookupValueRef) => !taken.has(mode.id));
    });

    const openCreateDialog = () => {
        isEditingDialog.value = false;
        editingId.value = null;
        editErrors.value = {};
        Object.assign(editForm, emptyForm(), {
            study_mode_lookup_value_id: unconfiguredModes.value[0]?.id ?? null,
            teaching_days: [...schedulingConstants.teachingDays.value],
            exam_days: [...schedulingConstants.teachingDays.value]
        });
        dialogVisible.value = true;
    };

    const openEditDialog = (setting: ScheduleSetting) => {
        isEditingDialog.value = true;
        editingId.value = setting.id;
        editErrors.value = {};
        Object.assign(editForm, {
            study_mode_lookup_value_id: setting.study_mode_lookup_value_id,
            teaching_days: [...(setting.teaching_days ?? [])],
            day_start: setting.day_start,
            day_end: setting.day_end,
            period_minutes: String(setting.period_minutes),
            break_minutes: String(setting.break_minutes),
            lunch_start: setting.lunch_start ?? '',
            lunch_end: setting.lunch_end ?? '',
            exam_days: [...(setting.exam_days ?? [])],
            exam_day_start: setting.exam_day_start,
            exam_day_end: setting.exam_day_end,
            exam_duration_minutes: String(setting.exam_duration_minutes),
            exam_gap_minutes: String(setting.exam_gap_minutes),
            exam_period_days: String(setting.exam_period_days),
            max_exams_per_day: String(setting.max_exams_per_day ?? 2),
            min_hours_between_exams: String(setting.min_hours_between_exams ?? 0),
            students_per_invigilator: String(setting.students_per_invigilator ?? 50),
            min_invigilators_per_room: String(setting.min_invigilators_per_room ?? 1),
            weight_spread_sessions: String(setting.weight_spread_sessions ?? 10),
            weight_avoid_gaps: String(setting.weight_avoid_gaps ?? 6),
            weight_room_fit: String(setting.weight_room_fit ?? 3),
            weight_same_building: String(setting.weight_same_building ?? 4),
            allow_cross_campus_day: !!setting.allow_cross_campus_day,
            is_active: setting.is_active
        });
        dialogVisible.value = true;
    };

    /**
     * Toggle one day on or off — how Saturday becomes a working day.
     *
     * @param day ISO-8601 weekday number
     * @param field which list to toggle it in; exams and classes keep separate
     *              days, because an institution that teaches Monday–Friday
     *              commonly examines on Saturday too
     */
    const toggleDay = (day: number, field: 'teaching_days' | 'exam_days' = 'teaching_days') => {
        const days = editForm[field];
        const index = days.indexOf(day);

        if (index === -1) days.push(day);
        else days.splice(index, 1);

        days.sort((a, b) => a - b);
    };

    const saveForm = async () => {
        editErrors.value = {};
        const result = scheduleSettingSchema().value.safeParse({ ...editForm });

        if (!result.success) {
            result.error.issues.forEach((issue) => {
                editErrors.value[issue.path[0] as string] = issue.message;
            });
            return;
        }

        isSaving.value = true;
        try {
            const saved =
                isEditingDialog.value && editingId.value
                    ? await updateScheduleSetting(editingId.value, result.data)
                    : await createScheduleSetting(result.data);

            toast.success(saved.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));
            dialogVisible.value = false;
            await load();
        } catch (error: unknown) {
            const fieldErrors = extractFieldErrors(error);
            if (fieldErrors) {
                editErrors.value = { ...editErrors.value, ...toFormErrors(fieldErrors) };
            } else {
                toast.error(genericError(error));
            }
        } finally {
            isSaving.value = false;
        }
    };

    return {
        isLoading,
        settings,
        studyModes,
        schedulingConstants,
        unconfiguredModes,

        dialogVisible,
        isEditingDialog,
        editForm,
        editErrors,
        isSaving,

        load,
        openCreateDialog,
        openEditDialog,
        toggleDay,
        saveForm
    };
}

export const useScheduleSetting = createSharedComposable(scheduleSettingManager);
