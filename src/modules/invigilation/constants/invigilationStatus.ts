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

/**
 * INVIGILATION_REQUEST_STATUS — where a registrar's ask for invigilators has
 * got to. Mirrors `helper/LookupConfig.php`.
 *
 * `draft` is the registrar still deciding; `sent` is the only state in which a
 * department may answer; `closed` ends the exchange and keeps whoever was
 * already sent in the pool. Legal edges are declared once, in
 * `lookup_transitions` — these codes only decide which buttons make sense.
 */
export const INVIGILATION_REQUEST_LOOKUP_TYPE = 'INVIGILATION_REQUEST_STATUS';

export const INVIGILATION_REQUEST_STATUS = {
    DRAFT: 'draft',
    SENT: 'sent',
    CLOSED: 'closed'
} as const;

export type InvigilationRequestStatusCode =
    (typeof INVIGILATION_REQUEST_STATUS)[keyof typeof INVIGILATION_REQUEST_STATUS];

/** How a department's share is doing, derived server-side from the two counts. */
export const FULFILMENT_STATUS = {
    PENDING: 'pending',
    PARTIAL: 'partial',
    COMPLETE: 'complete'
} as const;
