/**
 * Scheduling lookup type codes.
 *
 * Mirrors `helper/LookupConfig.php` on the backend — these strings are the
 * `lookup_types.code` values that `useLookupValues(...)` and
 * `useLookupTransitions(...)` fetch by. Referencing the constant instead of a
 * literal means a renamed vocabulary fails type-check rather than silently
 * returning an empty dropdown.
 */
export const LOOKUP_TYPE = {
    ACADEMIC_RANK: 'ACADEMIC_RANK',
    DEGREE_LEVEL: 'DEGREE_LEVEL',
    STUDY_MODE: 'STUDY_MODE',
    SEMESTER_STATUS: 'SEMESTER_STATUS',
    ROOM_TYPE: 'ROOM_TYPE',
    COURSE_TYPE: 'COURSE_TYPE',
    COURSE_OFFERING_STATUS: 'COURSE_OFFERING_STATUS',
    APPROVAL_LEVEL: 'APPROVAL_LEVEL',
    APPROVAL_DECISION: 'APPROVAL_DECISION',
    SESSION_TYPE: 'SESSION_TYPE',
    CLASS_SCHEDULE_STATUS: 'CLASS_SCHEDULE_STATUS',
    EXAM_TYPE: 'EXAM_TYPE',
    EXAM_SCHEDULE_STATUS: 'EXAM_SCHEDULE_STATUS',
    GENERATION_TYPE: 'GENERATION_TYPE',
    GENERATION_STATUS: 'GENERATION_STATUS',
    INVIGILATOR_ROLE: 'INVIGILATOR_ROLE',
    INVIGILATION_STATUS: 'INVIGILATION_STATUS'
} as const;

export type LookupTypeCode = (typeof LOOKUP_TYPE)[keyof typeof LOOKUP_TYPE];
