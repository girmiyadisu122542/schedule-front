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
    is_active: boolean;
}

export interface PaginatedScheduleSettings {
    data: ScheduleSetting[];
    pagination: Pagination | null;
}

export type { ScheduleRef };
