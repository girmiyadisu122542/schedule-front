/**
 * CLASS_SCHEDULE_STATUS / SESSION_TYPE / GENERATION_STATUS codes, mirroring
 * `helper/LookupConfig.php`.
 *
 * The frontend only ever compares against these — labels, colours and the legal
 * transition edges all come from the backend lookup catalogue at runtime.
 */
/**
 * How a programme is delivered. It is what decides WHICH generation grid an
 * offering is scheduled into — regular on weekdays, extension at the weekend.
 */
export const STUDY_MODE_LOOKUP_TYPE = 'STUDY_MODE';

export const CLASS_SCHEDULE_LOOKUP_TYPE = 'CLASS_SCHEDULE_STATUS';
export const SESSION_TYPE_LOOKUP_TYPE = 'SESSION_TYPE';

/**
 * Two paths to publication, mirroring the exam lifecycle: `draft → published`
 * when nothing needs signing off, or `draft → pending_confirmation → confirmed
 * → published` when the department that owns the teaching load must agree
 * first. Published sessions are cancelled; drafts are deleted, because nothing
 * has been announced yet.
 */
export const CLASS_SCHEDULE_STATUS = {
    DRAFT: 'draft',
    // The optional department confirmation step (C26). Two paths to
    // publication: straight out of draft, or via the department that owns the
    // teaching load. Which edges are legal is declared in `lookup_transitions`;
    // these codes only decide which buttons make sense to show.
    PENDING_CONFIRMATION: 'pending_confirmation',
    CONFIRMED: 'confirmed',
    PUBLISHED: 'published',
    CANCELLED: 'cancelled'
} as const;

export type ClassScheduleStatusCode = (typeof CLASS_SCHEDULE_STATUS)[keyof typeof CLASS_SCHEDULE_STATUS];

/** GENERATION_STATUS codes — what the progress panel polls for. */
export const GENERATION_STATUS = {
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed'
} as const;

/**
 * Day numbers are ISO-8601 (1 = Monday). Labels are NOT hardcoded here — they
 * come from `GET /constants/scheduling`, which reads the backend's
 * `Helper\Type\DayOfWeek` catalogue in the user's language.
 */
export const MONDAY = 1;
export const SUNDAY = 7;

/** Fallbacks used only until `/constants/scheduling` answers. */
export const FALLBACK_DAY_NAMES = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
] as const;

/**
 * EXAM_SCHEDULE_STATUS / EXAM_TYPE codes, mirroring `helper/LookupConfig.php`.
 *
 * Two paths to publication — straight from `draft`, or via the department
 * (`draft → pending_confirmation → confirmed → published`). Which edges are
 * legal is declared once, in `lookup_transitions`; the frontend only uses these
 * codes to decide which buttons make sense to show.
 */
export const EXAM_SCHEDULE_LOOKUP_TYPE = 'EXAM_SCHEDULE_STATUS';
export const EXAM_TYPE_LOOKUP_TYPE = 'EXAM_TYPE';

export const EXAM_SCHEDULE_STATUS = {
    DRAFT: 'draft',
    PENDING_CONFIRMATION: 'pending_confirmation',
    CONFIRMED: 'confirmed',
    PUBLISHED: 'published',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
} as const;

export type ExamScheduleStatusCode = (typeof EXAM_SCHEDULE_STATUS)[keyof typeof EXAM_SCHEDULE_STATUS];
