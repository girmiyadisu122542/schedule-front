import type { Pagination, User } from '@/types/CommonTypes';
import type { LookupValueRef } from '@/composables/useLookupValues';

/** The compact department embed a program carries (backend `idAndNameFields`). */
export interface ProgramDepartmentRef {
    id: number;
    uuid: string;
    code: string;
    name: string;
}

/**
 * Degree program as `GET /programs` emits it (backend
 * `App\Models\Academic\Program::indexFields`). `degree_level_code` is the stable
 * DEGREE_LEVEL code the badge resolves against — never a hardcoded label.
 */
export interface Program {
    id: number;
    uuid: string;
    code: string;
    name: string;
    department_id: number;
    degree_level_lookup_value_id: number;
    degree_level_code: string | null;
    duration_years: number;
    is_active: boolean;
    degree_level?: LookupValueRef | null;
    department?: ProgramDepartmentRef | null;
    created_by?: User | null;
    created_at?: string;
}

/** Form model — numeric inputs stay strings while typing, coerced by the schema. */
export interface ProgramForm {
    name: string;
    code: string;
    department_id: number | null;
    degree_level_lookup_value_id: number | null;
    duration_years: string;
    is_active: boolean;
}

export interface PaginatedPrograms {
    data: Program[];
    pagination: Pagination | null;
}
