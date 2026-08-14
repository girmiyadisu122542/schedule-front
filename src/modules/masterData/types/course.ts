import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';

/** Compact department embed (backend `idAndNameFields`). */
export interface CourseDepartmentRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * Catalogue course as `GET /courses` emits it (backend
 * `App\Models\Catalogue\Course::indexFields`).
 *
 * The schema names the column `title`; `name` mirrors it so the shared
 * list/dropdown/confirm components keep working. Ownership is the DEPARTMENT —
 * a course is defined once and offered many times, so it holds no semester,
 * instructor or enrolment.
 */
export interface Course {
    id: number;
    uuid: string;
    code: string;
    title: string;
    name: string;
    description: string | null;
    department_id: number;
    course_type_lookup_value_id: number;
    course_type_code: string | null;
    credit_hours: number;
    contact_hours: number | null;
    lecture_hours_per_week: number | null;
    lab_hours_per_week: number | null;
    tutorial_hours_per_week: number | null;
    sessions_per_week: number | null;
    /**
     * How long this course's exam runs. Null means the study mode's default —
     * a three-hour paper should not have to be typed on every row.
     */
    exam_duration_minutes: number | null;
    is_active: boolean;
    course_type?: LookupValueRef | null;
    department?: CourseDepartmentRef | null;
    created_by?: User | null;
    created_at?: string;
}

/** Form model — numeric inputs stay strings while typing, coerced by the schema. */
export interface CourseForm {
    title: string;
    code: string;
    description: string;
    department_id: number | null;
    course_type_lookup_value_id: number | null;
    credit_hours: string;
    contact_hours: string;
    lecture_hours_per_week: string;
    lab_hours_per_week: string;
    tutorial_hours_per_week: string;
    sessions_per_week: string;
    exam_duration_minutes: string;
    is_active: boolean;
}

export interface PaginatedCourses {
    data: Course[];
    pagination: Pagination | null;
}
