import type { RouteRecordRaw } from 'vue-router';

/**
 * Routes contributed by the invigilation module. Paths mirror the backend
 * `App\Constants\FrontendPaths` constants and `config/sidebar_menu.php`.
 */
const invigilationRoutes: Array<RouteRecordRaw> = [
    {
        path: 'invigilation',
        name: 'invigilation',
        children: [
            {
                path: 'availabilities',
                name: 'InvigilatorAvailabilities',
                component: () => import('@/modules/invigilation/views/ManageAvailabilities.vue')
            },
            {
                path: 'assignments',
                name: 'InvigilatorAssignments',
                component: () => import('@/modules/invigilation/views/ManageAssignments.vue')
            }
        ]
    }
];

export default invigilationRoutes;
