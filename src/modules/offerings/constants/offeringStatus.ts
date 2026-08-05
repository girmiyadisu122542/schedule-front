/**
 * COURSE_OFFERING_STATUS codes, mirroring `helper/LookupConfig.php`.
 *
 * The frontend only ever compares against these — labels, colours and the legal
 * transition edges all come from the backend lookup catalogue at runtime.
 */
export const OFFERING_LOOKUP_TYPE = 'COURSE_OFFERING_STATUS';

export const OFFERING_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    COMMITTEE_APPROVED: 'committee_approved',
    DEPARTMENT_APPROVED: 'department_approved',
    COLLEGE_APPROVED: 'college_approved',
    REGISTRAR_APPROVED: 'registrar_approved',
    REJECTED: 'rejected'
} as const;

export type OfferingStatusCode = (typeof OFFERING_STATUS)[keyof typeof OFFERING_STATUS];

/** The two vocabularies the approval trail is built from. */
export const APPROVAL_LOOKUP_TYPE = {
    LEVEL: 'APPROVAL_LEVEL',
    DECISION: 'APPROVAL_DECISION'
} as const;

/** APPROVAL_LEVEL codes — the four tiers, in order. */
export const APPROVAL_LEVEL = {
    COMMITTEE: 'committee',
    DEPARTMENT: 'department',
    COLLEGE: 'college',
    REGISTRAR: 'registrar'
} as const;

/**
 * APPROVAL_DECISION codes.
 *
 * `REJECTED` and `REVISION_REQUESTED` both land the offering on the `rejected`
 * status — COURSE_OFFERING_STATUS has no separate value for a revision request.
 * The status is the four-tier summary; the trail carries why it came back.
 */
export const APPROVAL_DECISION = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REVISION_REQUESTED: 'revision_requested'
} as const;
