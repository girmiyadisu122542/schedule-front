import type { LookupValueRef } from '@/composables/useLookupValues';
import type { Pagination, User } from '@/types/CommonTypes';

/** Compact department embed (backend `idAndNameFields`). */
export interface InstructorDepartmentRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * Instructor as `GET /instructors` emits it (backend
 * `App\Models\People\Instructor::indexFields`).
 *
 * Instructors and invigilators are ONE population; `can_teach` / `can_invigilate`
 * distinguish the role. `user_id` is the person's optional portal account — the
 * registry precedes the login, and this table has no creator column at all.
 * `name` mirrors the localized `full_name` for the shared components.
 */
export interface Instructor {
    id: number;
    uuid: string;
    employee_no: string;
    full_name: string;
    name: string;
    email: string | null;
    phone: string | null;
    academic_rank_lookup_value_id: number | null;
    /** Stable ACADEMIC_RANK code, for the rank chip. */
    academic_rank_code: string | null;
    academic_rank?: LookupValueRef | null;
    department_id: number;
    user_id: number | null;
    can_teach: boolean;
    can_invigilate: boolean;
    max_weekly_hours: number | null;
    is_active: boolean;
    department?: InstructorDepartmentRef | null;
    person?: User | null;
    created_at?: string;
}

/** Form model — numeric inputs stay strings while typing, coerced by the schema. */
export interface InstructorForm {
    full_name: string;
    employee_no: string;
    email: string;
    phone: string;
    department_id: number | null;
    academic_rank_lookup_value_id: number | null;
    user_id: number | null;
    can_teach: boolean;
    can_invigilate: boolean;
    max_weekly_hours: string;
    is_active: boolean;
}

export interface PaginatedInstructors {
    data: Instructor[];
    pagination: Pagination | null;
}
