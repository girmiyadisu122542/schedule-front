import { OFFERING_STATUS } from '@/modules/offerings/constants/offeringStatus';

/**
 * How the course-offering screen is being read right now.
 *
 * The scheduling screens offer calendar / master / table because a timetable IS
 * a shape in time. An offering is not — it is a plan moving through approval,
 * so the useful axes are different ones:
 *
 *  - BOARD  — the pipeline. Columns are the tier holding each offering, so the
 *             question "where is the term's plan stuck?" is answered by looking
 *             at which column is tall. The queue tabs answer that one slice at a
 *             time; the board answers it all at once.
 *  - CARDS  — the review surface. Grouped by department, tier progress and the
 *             decision buttons on every card.
 *  - TABLE  — bulk work: dense, comparable, and the only view that pages
 *             comfortably through a whole faculty's offerings.
 */
export const OFFERING_VIEW = {
    BOARD: 'board',
    CARDS: 'cards',
    TABLE: 'table'
} as const;

export type OfferingViewMode = (typeof OFFERING_VIEW)[keyof typeof OFFERING_VIEW];

/**
 * A board cannot paginate — every column has to be present at once or the
 * shape it exists to show is a lie. Mirrors `CALENDAR_PAGE_LIMIT`.
 */
export const BOARD_PAGE_LIMIT = 500;

/**
 * The board's columns, in pipeline order.
 *
 * Labelled by WHO MUST ACT rather than by the status name, because that is the
 * question a board answers. `committee_approved` means "the committee has
 * signed, the department head has not" — so the column reads "With Dept Head".
 *
 * `submitted` folds into the committee column: submit records the committee
 * decision in the same transaction, so nothing rests there, but a row backfilled
 * from before that change still might.
 */
export const OFFERING_BOARD_COLUMNS: {
    key: string;
    labelKey: string;
    labelFallback: string;
    statuses: string[];
}[] = [
    {
        key: 'draft',
        labelKey: 'boardColumnDraft',
        labelFallback: 'Draft',
        statuses: [OFFERING_STATUS.DRAFT]
    },
    {
        key: 'department',
        labelKey: 'boardColumnWithDepartment',
        labelFallback: 'With Dept Head',
        statuses: [OFFERING_STATUS.SUBMITTED, OFFERING_STATUS.COMMITTEE_APPROVED]
    },
    {
        key: 'college',
        labelKey: 'boardColumnWithCollege',
        labelFallback: 'With College',
        statuses: [OFFERING_STATUS.DEPARTMENT_APPROVED]
    },
    {
        key: 'registrar',
        labelKey: 'boardColumnWithRegistrar',
        labelFallback: 'With Registrar',
        statuses: [OFFERING_STATUS.COLLEGE_APPROVED]
    },
    {
        key: 'approved',
        labelKey: 'boardColumnApproved',
        labelFallback: 'Approved',
        statuses: [OFFERING_STATUS.REGISTRAR_APPROVED]
    },
    {
        // Returned and rejected sit together: both are off the pipeline and
        // waiting on a person, which is what makes them worth seeing side by
        // side rather than buried at the end of a queue.
        key: 'blocked',
        labelKey: 'boardColumnNeedsAttention',
        labelFallback: 'Needs attention',
        statuses: [OFFERING_STATUS.RETURNED, OFFERING_STATUS.REJECTED]
    }
];
