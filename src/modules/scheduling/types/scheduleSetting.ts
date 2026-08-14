import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';
import type { ScheduleRef, TimeSlot } from '@/modules/scheduling/types/classSchedule';

/**
 * The generation grid for one study mode, as `GET /schedule/settings` emits it
 * (backend `App\Models\Schedule\ScheduleSetting::indexFields`).
 *
 * `periods` is DERIVED server-side from the window, the period length, the
 * break and the lunch window — it is what the generator will actually place
 * into, and it is read-only. Editing means changing the inputs, not the list.
 */
export interface ScheduleSetting {
    id: number;
    uuid: string;
    study_mode_lookup_value_id: number;
    /** ISO-8601 weekday numbers, 1 = Monday … 7 = Sunday. */
    teaching_days: number[];
    day_start: string;
    day_end: string;
    period_minutes: number;
    break_minutes: number;
    lunch_start: string | null;
    lunch_end: string | null;
    /** Exams get their own days and window — a sitting runs hours, not a period. */
    exam_days: number[];
    exam_day_start: string;
    exam_day_end: string;
    /** Used when a course declares no exam length of its own. */
    exam_duration_minutes: number;
    exam_gap_minutes: number;
    exam_period_days: number;
    /** Per exam type, keyed by lookup code: {"midterm": 90, "final": 180}. */
    exam_type_durations: Record<string, number> | null;
    max_exams_per_day: number;
    min_hours_between_exams: number;
    students_per_invigilator: number;
    min_invigilators_per_room: number;
    /** Placement preferences. Zero switches one off entirely. */
    weight_spread_sessions: number;
    weight_avoid_gaps: number;
    weight_room_fit: number;
    weight_same_building: number;
    allow_cross_campus_day: boolean;
    is_active: boolean;
    /** The grid these inputs produce. Read-only. */
    periods: TimeSlot[];
    /** The sittings a DEFAULT-length exam gets. Read-only. */
    exam_windows: TimeSlot[];
    study_mode_code: string | null;
    study_mode?: LookupValueRef | null;
    created_by?: User | null;
    created_at?: string;
}

/**
 * Form model. `periods` is absent on purpose: it is derived, so sending it
 * would invite the stored grid and the shown grid to disagree.
 */
export interface ScheduleSettingForm {
    study_mode_lookup_value_id: number | null;
    teaching_days: number[];
    day_start: string;
    day_end: string;
    period_minutes: string;
    break_minutes: string;
    lunch_start: string;
    lunch_end: string;
    exam_days: number[];
    exam_day_start: string;
    exam_day_end: string;
    exam_duration_minutes: string;
    exam_gap_minutes: string;
    exam_period_days: string;
    max_exams_per_day: string;
    min_hours_between_exams: string;
    students_per_invigilator: string;
    min_invigilators_per_room: string;
    weight_spread_sessions: string;
    weight_avoid_gaps: string;
    weight_room_fit: string;
    weight_same_building: string;
    allow_cross_campus_day: boolean;
    is_active: boolean;
}

export interface PaginatedScheduleSettings {
    data: ScheduleSetting[];
    pagination: Pagination | null;
}

export type { ScheduleRef };
