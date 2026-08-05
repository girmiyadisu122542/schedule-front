/**
 * INVIGILATION_STATUS / INVIGILATOR_ROLE codes, mirroring
 * `helper/LookupConfig.php`.
 *
 * Unlike the four workflow vocabularies, INVIGILATION_STATUS declares no
 * `lookup_transitions` rows — the legal moves live in
 * `ExamInvigilatorAssignmentService::ALLOWED_MOVES`. The frontend uses these
 * codes only to decide which buttons make sense to show; the backend decides.
 */
export const INVIGILATION_LOOKUP_TYPE = 'INVIGILATION_STATUS';
export const INVIGILATOR_ROLE_LOOKUP_TYPE = 'INVIGILATOR_ROLE';

export const INVIGILATION_STATUS = {
    ASSIGNED: 'assigned',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    REPLACED: 'replaced'
} as const;

export type InvigilationStatusCode = (typeof INVIGILATION_STATUS)[keyof typeof INVIGILATION_STATUS];

export const INVIGILATOR_ROLE = {
    CHIEF: 'chief',
    ASSISTANT: 'assistant'
} as const;
