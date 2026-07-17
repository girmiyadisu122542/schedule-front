import type { RouteRecordRaw } from 'vue-router';

/**
 * Scheduling-system routes (master data, scheduling, reports, notifications).
 * Paths mirror App\Constants\FrontendPaths in the backend and the entries in
 * config/sidebar_menu.php. Views are placeholders to be built out.
 */
const scheduleRoutes: Array<RouteRecordRaw> = [
    // Master data
    { path: 'colleges', name: 'Colleges', component: () => import('@/modules/masterData/views/College/ManageColleges.vue') },
    { path: 'departments', name: 'Departments', component: () => import('@/views/MasterData/Departments.vue') },
    { path: 'instructors', name: 'Instructors', component: () => import('@/views/MasterData/Instructors.vue') },
    { path: 'classes', name: 'Classes', component: () => import('@/views/MasterData/Classes.vue') },
    { path: 'courses', name: 'Courses', component: () => import('@/views/MasterData/Courses.vue') },
    { path: 'rooms', name: 'Rooms', component: () => import('@/views/MasterData/Rooms.vue') },

    // Scheduling
    {
        path: 'scheduling',
        name: 'scheduling',
        children: [
            {
                path: 'classes',
                name: 'ClassSchedules',
                component: () => import('@/views/Scheduling/ClassSchedules.vue')
            },
            {
                path: 'exams',
                name: 'ExamSchedules',
                component: () => import('@/views/Scheduling/ExamSchedules.vue')
            }
        ]
    },

    // Reports & notifications
    { path: 'reports', name: 'Reports', component: () => import('@/views/Reports/Reports.vue') },
    { path: 'notifications', name: 'Notifications', component: () => import('@/views/Notifications/Notifications.vue') }
];

export default scheduleRoutes;
