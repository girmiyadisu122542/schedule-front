import userRoutes from '@/modules/user/router';
import scheduleRoutes from '@/router/scheduleRoutes';
import { createRouter, createWebHistory } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/modules/user/store/authStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';

import Dashboard from '@/views/Dashboard.vue';
import MainLayout from '@/layout/MainLayout.vue';

import Login from '@/modules/user/views/Auth/Login.vue';
import Welcome from '@/modules/user/views/Main/Welcome.vue';
import ForgotPassword from '@/modules/user/views/Auth/ForgotPassword.vue';
import OTPVerification from '@/modules/user/views/Auth/OTPVerification.vue';
import ResetPassword from '@/modules/user/views/Auth/ResetPassword.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '', redirect: '/login' },
        { path: '/login', name: 'Login', component: Login },
        { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
        { path: '/verify-account', name: 'OTPVerification', component: OTPVerification },
        { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },
        { path: '/welcome', name: 'Welcome', component: Welcome },
        {
            path: '/',
            component: MainLayout,
            children: [{ path: 'dashboard', name: 'Dashboard', component: Dashboard }, ...scheduleRoutes, ...userRoutes]
        }
    ],

    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        else if (to.path !== from.path) return { top: 0 };

        return false;
    }
});

let isInitialLoad = true;
const progress = (globalThis as typeof globalThis & { NProgress?: typeof NProgress }).NProgress;

progress?.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.1 });

router.beforeEach(async (to, from) => {
    progress?.start();
    const languageStore = useLanguageStore();
    const { fetchFrontLanguages } = languageStore;
    const allowedRoutesStore = useAllowedRoutesStore();
    const authStore = useAuthStore();

    if (isInitialLoad) await fetchFrontLanguages();
    isInitialLoad = false;

    if (!allowedRoutesStore.isInitialized) await allowedRoutesStore.fetchAllowedRoutes();
    const isAuthenticated = !!authStore.user;

    if (to.meta.requiresAuth === false) return true;
    if (isAuthenticated && to.path === '/login') {
        return allowedRoutesStore.authRedirect || '/';
    }

    if (typeof to.path !== 'string' || !allowedRoutesStore.isRouteAllowed(to.path)) {
        const preferredRedirectPath = isAuthenticated
            ? allowedRoutesStore.authRedirect || '/'
            : allowedRoutesStore.unauthRedirect || '/login';
        const fallbackRedirectPath = '/';
        const resolvedPreferredRoute = router.resolve(preferredRedirectPath);
        const hasPreferredRoute = resolvedPreferredRoute.matched.length > 0;
        const redirectPath = hasPreferredRoute ? preferredRedirectPath : fallbackRedirectPath;

        if (to.path !== redirectPath) return redirectPath;
    }
});

router.afterEach(() => {
    const languageStore = useLanguageStore();
    progress?.done();
    languageStore.setIsInitialized(false);
});

export default router;
