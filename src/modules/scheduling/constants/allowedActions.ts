/**
 * Permission actions contributed by the scheduling module.
 *
 * Each string is the camelCase form of a backend permission key in
 * `helper/Permission/PermissionList.php` — `'publish:class:schedule'` →
 * `'publishClassSchedule'`.
 *
 * There is no `changeClassScheduleState`: `state` is the conflict-liveness flag
 * and only ever moves together with the status, through publish or cancel.
 */
export type SchedulingAllowedAction =
    | 'seeClassSchedule'
    | 'createClassSchedule'
    | 'updateClassSchedule'
    | 'deleteClassSchedule'
    | 'publishClassSchedule'
    | 'cancelClassSchedule'
    | 'runClassScheduleGeneration'
    | 'seeScheduleGenerationRun'
    | 'seeExamSchedule'
    | 'createExamSchedule'
    | 'updateExamSchedule'
    | 'deleteExamSchedule'
    | 'confirmExamSchedule'
    | 'publishExamSchedule'
    | 'cancelExamSchedule'
    | 'runExamScheduleGeneration'
    // The generation grid under Configuration. No delete key: a grid belongs
    // to a seeded study mode and is deactivated, never removed.
    | 'seeScheduleSetting'
    | 'createScheduleSetting'
    | 'updateScheduleSetting';
