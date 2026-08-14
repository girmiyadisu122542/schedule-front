/**
 * Permission actions contributed by the offerings module.
 *
 * Each string is the camelCase form of a backend permission key in
 * `helper/Permission/PermissionList.php` — `'submit:course:offering'` →
 * `'submitCourseOffering'`.
 *
 * There is deliberately no `approveCourseOffering`: with one coarse key the
 * acting tier had to come from the request, and a holder could name any tier
 * they liked. Each tier now has its own key, and the DUE tier is computed
 * server-side from the offering's status.
 */
export type OfferingAllowedAction =
    | 'seeCourseOffering'
    | 'createCourseOffering'
    | 'updateCourseOffering'
    | 'deleteCourseOffering'
    | 'submitCourseOffering'
    | 'approveCourseOfferingCommittee'
    | 'approveCourseOfferingDepartment'
    | 'approveCourseOfferingCollege'
    | 'approveCourseOfferingRegistrar'
    | 'rejectCourseOffering'
    | 'reopenCourseOffering'
    | 'exportCourseOffering'
    | 'importCourseOffering';
