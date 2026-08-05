/**
 * Permission actions contributed by the offerings module.
 *
 * Each string is the camelCase form of a backend permission key in
 * `helper/Permission/PermissionList.php` — `'submit:course:offering'` →
 * `'submitCourseOffering'`.
 */
export type OfferingAllowedAction =
    | 'seeCourseOffering'
    | 'createCourseOffering'
    | 'updateCourseOffering'
    | 'deleteCourseOffering'
    | 'submitCourseOffering'
    | 'approveCourseOffering'
    | 'rejectCourseOffering';
