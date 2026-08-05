import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';

/** Compact embeds an offering carries (backend `idAndNameFields`). */
export interface OfferingRef {
    id: number;
    uuid: string;
    code?: string;
    name: string;
}

/**
 * Course offering as `GET /offerings` emits it (backend
 * `App\Models\Offering\CourseOffering::indexFields`).
 *
 * The pivot of the system: a course planned for one semester, one section, one
 * instructor. A workflow table — no `is_active` and no `state`; `status_code`
 * is its position in the four-tier approval chain, and it moves only along the
 * edges `lookup_transitions` declares.
 */
export interface Offering {
    id: number;
    uuid: string;
    name: string;
    semester_id: number;
    course_id: number;
    department_id: number;
    program_id: number | null;
    section_id: number | null;
    instructor_id: number | null;
    expected_students: number;
    status_lookup_value_id: number;
    status_code: string | null;
    remark: string | null;
    status?: LookupValueRef | null;
    semester?: OfferingRef | null;
    course?: OfferingRef | null;
    department?: OfferingRef | null;
    program?: OfferingRef | null;
    section?: OfferingRef | null;
    instructor?: OfferingRef | null;
    created_by?: User | null;
    submitted_by?: User | null;
    submitted_at?: string | null;
    status_changed_at?: string | null;
    created_at?: string;
}

/** Form model. The status is absent on purpose — it is never caller-supplied. */
export interface OfferingForm {
    semester_id: number | null;
    course_id: number | null;
    department_id: number | null;
    program_id: number | null;
    section_id: number | null;
    instructor_id: number | null;
    expected_students: string;
    remark: string;
}

export interface PaginatedOfferings {
    data: Offering[];
    pagination: Pagination | null;
}

/**
 * One decision in an offering's append-only approval trail (backend
 * `App\Models\Offering\CourseOfferingApproval::indexFields`).
 *
 * `level_code` / `decision_code` are the stable APPROVAL_LEVEL and
 * APPROVAL_DECISION codes the badges resolve against — never hardcoded labels.
 */
export interface OfferingApproval {
    id: number;
    sequence: number;
    course_offering_id: number;
    level_code: string | null;
    decision_code: string | null;
    remark: string | null;
    level?: LookupValueRef | null;
    decision?: LookupValueRef | null;
    actor?: User | null;
    acted_at: string;
}

/** What `GET /offerings/{key}` returns: the offering plus its trail. */
export interface OfferingDetail {
    offering: Offering;
    approvals: OfferingApproval[];
}
