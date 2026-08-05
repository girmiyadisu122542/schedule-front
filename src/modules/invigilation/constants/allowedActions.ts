/**
 * Permission actions contributed by the invigilation module.
 *
 * Each string is the camelCase form of a backend permission key in
 * `helper/Permission/PermissionList.php` — `'submit:invigilator:availability'`
 * → `'submitInvigilatorAvailability'`.
 *
 * `submit` rather than `create`/`update`: an availability window is a positive
 * statement, not a record to revise. A wrong one is withdrawn and re-submitted.
 */
export type InvigilationAllowedAction =
    | 'seeInvigilatorAvailability'
    | 'submitInvigilatorAvailability'
    | 'deleteInvigilatorAvailability';

/**
 * Duty-roster actions. `respondToInvigilatorAssignment` is the instructor
 * answering for themselves, which is why a teacher holds it and the registrar
 * holds `replaceInvigilator`.
 */
export type InvigilationAssignmentAllowedAction =
    | 'seeInvigilatorAssignment'
    | 'assignInvigilator'
    | 'respondToInvigilatorAssignment'
    | 'replaceInvigilator';
