import type { RouteRecordRaw } from 'vue-router';

/**
 * Routes contributed by the offerings module. Paths mirror the backend
 * `App\Constants\FrontendPaths` constants and `config/sidebar_menu.php`.
 */
const offeringRoutes: Array<RouteRecordRaw> = [
    {
        path: 'offerings',
        name: 'CourseOfferings',
        component: () => import('@/modules/offerings/views/ManageOfferings.vue')
    },
    {
        // Frontend routes by uuid — numeric ids never appear in URLs.
        path: 'offerings/:uuid',
        name: 'CourseOfferingDetail',
        component: () => import('@/modules/offerings/views/OfferingDetail.vue')
    }
];

export default offeringRoutes;
