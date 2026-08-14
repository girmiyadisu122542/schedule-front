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
    RETURNED: 'returned',
    REJECTED: 'rejected'
} as const;

/** The statuses whose content the author may still change. */
export const EDITABLE_OFFERING_STATUSES: string[] = [OFFERING_STATUS.DRAFT, OFFERING_STATUS.RETURNED];

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
 * `REVISION_REQUESTED` returns the offering to its author for rework and lands
 * it on `returned`; `REJECTED` declines it outright and lands it on `rejected`.
 * Two different outcomes, two different statuses.
 */
export const APPROVAL_DECISION = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REVISION_REQUESTED: 'revision_requested'
} as const;

/**
 * The review queues the list screen offers as tabs, mirroring
 * `CourseOfferingController::QUEUES`.
 *
 * `awaiting_me` is resolved server-side — it means "the tier due on this
 * offering is one I hold the key for, on a department my scope permits", and
 * the client can evaluate neither half.
 */
export const OFFERING_QUEUE = {
    AWAITING_ME: 'awaiting_me',
    MY_DRAFTS: 'my_drafts',
    IN_PROGRESS: 'in_progress',
    RETURNED: 'returned',
    APPROVED: 'approved',
    REJECTED: 'rejected'
} as const;

export type OfferingQueue = (typeof OFFERING_QUEUE)[keyof typeof OFFERING_QUEUE];

/** The four tiers in chain order, for the progress stepper. */
export const APPROVAL_LEVEL_ORDER: string[] = [
    APPROVAL_LEVEL.COMMITTEE,
    APPROVAL_LEVEL.DEPARTMENT,
    APPROVAL_LEVEL.COLLEGE,
    APPROVAL_LEVEL.REGISTRAR
];
