import type { Pagination, User } from '@/types/CommonTypes';

/** Compact program / academic-year embeds (backend `idAndNameFields`). */
export interface SectionProgramRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * Student cohort as `GET /sections` emits it (backend
 * `App\Models\Academic\Section::indexFields`).
 *
 * A section is scoped to the ACADEMIC YEAR, not the semester — the same cohort
 * spans both semesters of a year. It has no name column: `name` is the composed
 * label "BSc in Computer Science Year 2 - A".
 */
export interface Section {
    id: number;
    uuid: string;
    label: string;
    name: string;
    program_id: number;
    academic_year_id: number;
    year_level: number;
    expected_students: number;
    is_active: boolean;
    program?: SectionProgramRef | null;
    academic_year?: SectionProgramRef | null;
    created_by?: User | null;
    created_at?: string;
}

/** Form model — numeric inputs stay strings while typing, coerced by the schema. */
export interface SectionForm {
    program_id: number | null;
    academic_year_id: number | null;
    year_level: string;
    label: string;
    expected_students: string;
    is_active: boolean;
}

export interface PaginatedSections {
    data: Section[];
    pagination: Pagination | null;
}
