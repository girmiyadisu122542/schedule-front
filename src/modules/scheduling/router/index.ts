import type { RouteRecordRaw } from 'vue-router';

/**
 * Routes contributed by the scheduling module. Paths mirror the backend
 * `App\Constants\FrontendPaths` constants and `config/sidebar_menu.php`.
 */
const schedulingRoutes: Array<RouteRecordRaw> = [
    {
        path: 'scheduling',
        name: 'scheduling',
        children: [
            {
                path: 'classes',
                name: 'ClassSchedules',
                component: () => import('@/modules/scheduling/views/ManageClassSchedules.vue')
            },
            {
                path: 'classes/:uuid',
                name: 'ClassScheduleDetail',
                component: () => import('@/modules/scheduling/views/ClassScheduleDetail.vue')
            },
            {
                path: 'exams',
                name: 'ExamSchedules',
                component: () => import('@/modules/scheduling/views/ManageExamSchedules.vue')
            },
            {
                path: 'exams/:uuid',
                name: 'ExamScheduleDetail',
                component: () => import('@/modules/scheduling/views/ExamScheduleDetail.vue')
            },
            {
                // The run row is telemetry; this page is what finally reads its
                // `summary` jsonb.
                path: 'generation-runs/:uuid',
                name: 'GenerationRunDetail',
                component: () => import('@/modules/scheduling/views/GenerationRunDetail.vue')
            }
        ]
    },

    // The published, read-only views. They sit at the top level rather than
    // under /scheduling because they are what everyone reads, not where the
    // registrar works.
    {
        path: 'timetable',
        name: 'Timetable',
        component: () => import('@/modules/scheduling/views/Timetable.vue')
    },
    {
        path: 'exam-calendar',
        name: 'ExamCalendar',
        component: () => import('@/modules/scheduling/views/ExamCalendar.vue')
    }
];

export default schedulingRoutes;
