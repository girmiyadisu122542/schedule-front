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
                // The registrar's list and the department's inbox are the same
                // rows read from different ends — the backend scopes them.
                path: 'requests',
                name: 'InvigilationRequests',
                component: () => import('@/modules/invigilation/views/ManageInvigilationRequests.vue')
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
