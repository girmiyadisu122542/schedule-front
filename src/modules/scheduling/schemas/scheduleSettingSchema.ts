import { z } from 'zod';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import { MONDAY, SUNDAY } from '@/modules/scheduling/constants/classScheduleStatus';
import {
    MAX_BREAK_MINUTES,
    MAX_EXAM_GAP_MINUTES,
    MAX_EXAM_PERIOD_DAYS,
    MAX_PERIOD_MINUTES,
    MIN_BREAK_MINUTES,
    MIN_EXAM_GAP_MINUTES,
    MIN_EXAM_PERIOD_DAYS,
    MIN_PERIOD_MINUTES
} from '@/modules/scheduling/constants/scheduleView';

/** "HH:MM", the only time shape the backend's `date_format:H:i` rule accepts. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Reactive Zod factory for the generation-grid form.
 *
 * The periods themselves are NOT here: the backend derives them from these
 * inputs, so there is nothing to validate about them. What this does enforce is
 * the shape the database CHECK constraints also enforce — a day that ends after
 * it starts, a real period length, and a lunch window that is both-or-neither.
 * Mirroring those here turns a constraint violation into a field error.
 */
export const scheduleSettingSchema = () => {
    const { translations } = storeToRefs(useLanguageStore());

    const time = (message: string) => z.string().trim().regex(TIME_PATTERN, message);
    const invalidTime = () => translations.value.invalidTime || 'Enter the time as HH:MM';

    /** A text input hands back a string; the payload needs a number. */
    const minutes = (min: number, max: number, message: string) =>
        z
            .string()
            .trim()
            .refine((value) => value !== '' && Number.isInteger(Number(value)), message)
            .transform((value) => Number(value))
            .refine((value) => value >= min && value <= max, message);

    return computed(() =>
        z
            .object({
                study_mode_lookup_value_id: z
                    .number({ message: translations.value.studyModeIsRequired || 'Please choose a study mode' })
                    .int()
                    .positive(translations.value.studyModeIsRequired || 'Please choose a study mode'),
                teaching_days: z
                    .array(z.number().int().min(MONDAY).max(SUNDAY))
                    .min(1, translations.value.teachingDaysRequired || 'Choose at least one teaching day'),
                day_start: time(invalidTime()),
                day_end: time(invalidTime()),
                period_minutes: minutes(
                    MIN_PERIOD_MINUTES,
                    MAX_PERIOD_MINUTES,
                    translations.value.invalidPeriodMinutes ||
                        `A period must be between ${MIN_PERIOD_MINUTES} and ${MAX_PERIOD_MINUTES} minutes`
                ),
                break_minutes: minutes(
                    MIN_BREAK_MINUTES,
                    MAX_BREAK_MINUTES,
                    translations.value.invalidBreakMinutes ||
                        `A break must be between ${MIN_BREAK_MINUTES} and ${MAX_BREAK_MINUTES} minutes`
                ),
                // Empty means "no lunch break", which is legitimate for an
                // evening or weekend grid.
                lunch_start: z.union([time(invalidTime()), z.literal('')]),
                lunch_end: z.union([time(invalidTime()), z.literal('')]),
                // ---- the exam half ----
                exam_days: z
                    .array(z.number().int().min(MONDAY).max(SUNDAY))
                    .min(1, translations.value.examDaysRequired || 'Choose at least one exam day'),
                exam_day_start: time(invalidTime()),
                exam_day_end: time(invalidTime()),
                exam_duration_minutes: minutes(
                    MIN_PERIOD_MINUTES,
                    MAX_PERIOD_MINUTES,
                    translations.value.invalidExamDuration ||
                        `An exam must run between ${MIN_PERIOD_MINUTES} and ${MAX_PERIOD_MINUTES} minutes`
                ),
                exam_gap_minutes: minutes(
                    MIN_EXAM_GAP_MINUTES,
                    MAX_EXAM_GAP_MINUTES,
                    translations.value.invalidExamGap ||
                        `A turnaround must be between ${MIN_EXAM_GAP_MINUTES} and ${MAX_EXAM_GAP_MINUTES} minutes`
                ),
                exam_period_days: minutes(
                    MIN_EXAM_PERIOD_DAYS,
                    MAX_EXAM_PERIOD_DAYS,
                    translations.value.invalidExamPeriodDays ||
                        `The exam period must be between ${MIN_EXAM_PERIOD_DAYS} and ${MAX_EXAM_PERIOD_DAYS} days`
                ),
                // ---- what a cohort may be put through ----
                max_exams_per_day: minutes(
                    1,
                    8,
                    translations.value.invalidMaxExamsPerDay || 'A cohort may sit between 1 and 8 exams in a day'
                ),
                min_hours_between_exams: minutes(
                    0,
                    72,
                    translations.value.invalidMinHoursBetweenExams || 'The rest between exams must be 0 to 72 hours'
                ),
                // ---- invigilator staffing ----
                students_per_invigilator: minutes(
                    5,
                    200,
                    translations.value.invalidStudentsPerInvigilator ||
                        'One invigilator covers between 5 and 200 students'
                ),
                min_invigilators_per_room: minutes(
                    1,
                    20,
                    translations.value.invalidMinInvigilators || 'A hall needs between 1 and 20 invigilators'
                ),
                // ---- preferences; 0 switches one off ----
                weight_spread_sessions: minutes(0, 100, translations.value.invalidWeight || 'A weight is 0 to 100'),
                weight_avoid_gaps: minutes(0, 100, translations.value.invalidWeight || 'A weight is 0 to 100'),
                weight_room_fit: minutes(0, 100, translations.value.invalidWeight || 'A weight is 0 to 100'),
                weight_same_building: minutes(0, 100, translations.value.invalidWeight || 'A weight is 0 to 100'),
                allow_cross_campus_day: z.boolean(),
                is_active: z.boolean()
            })
            .refine((value) => value.day_end > value.day_start, {
                path: ['day_end'],
                message: translations.value.dayEndAfterStart || 'The day must end after it starts'
            })
            .refine((value) => value.exam_day_end > value.exam_day_start, {
                path: ['exam_day_end'],
                message: translations.value.examDayEndAfterStart || 'The exam day must end after it starts'
            })
            // Both or neither: half a lunch window is not a break, and the
            // database refuses it outright.
            .refine((value) => !!value.lunch_start === !!value.lunch_end, {
                path: ['lunch_end'],
                message: translations.value.lunchNeedsBothEnds || 'Give both a lunch start and a lunch end, or neither'
            })
            .refine((value) => !value.lunch_start || !value.lunch_end || value.lunch_end > value.lunch_start, {
                path: ['lunch_end'],
                message: translations.value.lunchEndAfterStart || 'Lunch must end after it starts'
            })
            .transform((value) => ({
                study_mode_lookup_value_id: value.study_mode_lookup_value_id,
                teaching_days: value.teaching_days,
                day_start: value.day_start,
                day_end: value.day_end,
                period_minutes: value.period_minutes,
                break_minutes: value.break_minutes,
                lunch_start: value.lunch_start || null,
                lunch_end: value.lunch_end || null,
                exam_days: value.exam_days,
                exam_day_start: value.exam_day_start,
                exam_day_end: value.exam_day_end,
                exam_duration_minutes: value.exam_duration_minutes,
                exam_gap_minutes: value.exam_gap_minutes,
                exam_period_days: value.exam_period_days,
                max_exams_per_day: value.max_exams_per_day,
                min_hours_between_exams: value.min_hours_between_exams,
                students_per_invigilator: value.students_per_invigilator,
                min_invigilators_per_room: value.min_invigilators_per_room,
                weight_spread_sessions: value.weight_spread_sessions,
                weight_avoid_gaps: value.weight_avoid_gaps,
                weight_room_fit: value.weight_room_fit,
                weight_same_building: value.weight_same_building,
                allow_cross_campus_day: value.allow_cross_campus_day,
                is_active: value.is_active
            }))
    );
};
