/**
 * Permission actions contributed by the invigilation module.
 *
 * Each string is the camelCase form of a backend permission key in
 * `helper/Permission/PermissionList.php` — `'assign:invigilator'` →
 * `'assignInvigilator'`.
 */
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

/**
 * The request/response exchange between the registrar and the departments.
 *
 * `send` is separate from `create` so a clerk may prepare an ask that only a
 * registrar issues. `respondToInvigilationRequest` is the department's side;
 * WHICH department a holder speaks for is data — `departments.head_user_id` —
 * not another permission key.
 */
export type InvigilationRequestAllowedAction =
    | 'seeInvigilationRequest'
    | 'createInvigilationRequest'
    | 'updateInvigilationRequest'
    | 'sendInvigilationRequest'
    | 'respondToInvigilationRequest';
