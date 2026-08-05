import type { RouteRecordRaw } from 'vue-router';

import masterDataRoutes from '@/modules/masterData/router';
import offeringRoutes from '@/modules/offerings/router';
import schedulingRoutes from '@/modules/scheduling/router';
import invigilationRoutes from '@/modules/invigilation/router';

/**
 * Scheduling-system routes (master data, scheduling, reports, notifications).
 * Paths mirror App\Constants\FrontendPaths in the backend and the entries in
 * config/sidebar_menu.php. Views are placeholders to be built out.
 */
const scheduleRoutes: Array<RouteRecordRaw> = [
    // Master data — real slices are contributed by the masterData module
    ...masterDataRoutes,

    // Offering & approval
    ...offeringRoutes,

    // Scheduling
    ...schedulingRoutes,

    // Invigilation
    ...invigilationRoutes,

    // Reports & notifications
    { path: 'reports', name: 'Reports', component: () => import('@/views/Reports/Reports.vue') },
    { path: 'notifications', name: 'Notifications', component: () => import('@/views/Notifications/Notifications.vue') }
];

export default scheduleRoutes;
