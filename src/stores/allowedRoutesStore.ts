import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import axiosInstance from '@/api/axiosInstance';

import type { AllowedAction } from '@/constants/allowedActions';
import { decryptAction, encryptAction } from '@/utils/decryptPermissionAction';

export interface SidebarMenuItem {
    icon?: string;
    name: string;
    path?: string;
    subItems?: SidebarMenuItem[];
    module?: string;
    order?: number;
}
export interface SidebarMenuGroup {
    title: string;
    items: SidebarMenuItem[];
    module?: string;
    modules?: string[];
    order?: number;
}

/** A department the signed-in user owns, as the backend names it. */
export interface ScopedDepartment {
    id: number;
    uuid?: string;
    code?: string;
    name: string;
}

/**
 * Which departments the user may act on.
 *
 * `unrestricted` is NOT the same as an empty list: unrestricted means the whole
 * institution (super admin, or a role holding `see:all:departments`), while an
 * empty list means the user is bound to no department and will see nothing.
 * The server enforces the same bound — this copy only shapes the UI.
 */
export interface DepartmentScope {
    unrestricted: boolean;
    /** What the user may READ — includes a department they only teach in. */
    departments: ScopedDepartment[];
    /**
     * What they may ACT FOR — heading it, or leading its college.
     *
     * Reading and managing are different claims: an instructor sees their
     * department's timetable, but answering a registrar on that department's
     * behalf is the head's job.
     */
    managed_departments: ScopedDepartment[];
}

export interface Entitlements {
    is_active: boolean;
    is_super_admin: boolean;
    trial: any;
    modules: string[];
    features: string[];
    scope: DepartmentScope;
}

const EMPTY_ENTITLEMENTS: Entitlements = {
    is_active: false,
    is_super_admin: false,
    trial: null,
    modules: [],
    features: [],
    // Restricted-with-nothing until the server says otherwise: a store that
    // defaulted to unrestricted would flash the whole institution's filters
    // during the first load.
    scope: { unrestricted: false, departments: [], managed_departments: [] }
};

export const useAllowedRoutesStore = defineStore('allowedRoutes', () => {
    const allowedRoutes = ref<string[]>([]);
    const allowedActions = ref<string[]>([]);
    const sidebarMenu = ref<SidebarMenuGroup[]>([]);
    const authRedirect = ref<string>('');
    const unauthRedirect = ref<string>('');
    const isLoading = ref<boolean>(false);
    const isInitialized = ref<boolean>(false);
    const selectedModule = ref<any>(JSON.parse(localStorage.getItem('selectedModule') || 'null'));
    const entitlements = ref<Entitlements>({ ...EMPTY_ENTITLEMENTS });

    async function fetchAllowedRoutes() {
        isLoading.value = true;
        try {
            const response = await axiosInstance.get('/user/allowed-routes');
            allowedRoutes.value = response.data.routes || [];
            allowedActions.value = (response.data.actions || []).map((enc: string) => decryptAction(enc));
            sidebarMenu.value = response.data.sidebarMenu || [];
            entitlements.value = {
                ...EMPTY_ENTITLEMENTS,
                ...(response.data.entitlements ?? {}),
                scope: {
                    ...EMPTY_ENTITLEMENTS.scope,
                    ...(response.data.entitlements?.scope ?? {})
                }
            };
            authRedirect.value = response.data.authRedirect || '/dashboard';
            unauthRedirect.value = response.data.unauthRedirect || '/login';
        } catch (error) {
            console.error('Error fetching allowed routes:>>>>', error);
        } finally {
            isInitialized.value = true;
            isLoading.value = false;
        }
    }

    function isRouteAllowed(path: string) {
        const normalize = (value: string) => {
            if (!value || value === '/') return '/';
            return value.replace(/\/+$/, '');
        };

        const normalizedPath = normalize(path);
        // Check if the path starts with an allowed route (for nested routes)
        if (allowedRoutes.value.some((route) => normalizedPath.startsWith(normalize(route)))) return true;

        return allowedRoutes.value.some((route) => {
            const normalizedRoute = normalize(route);

            if (normalizedRoute === normalizedPath) return true;

            if (!normalizedRoute.includes(':')) return false;

            const pattern = normalizedRoute
                .split('/')
                .map((segment) => (segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
                .join('/');

            return new RegExp(`^${pattern}$`).test(normalizedPath);
        });
    }

    function can(action: AllowedAction): boolean {
        return allowedActions.value.includes(action);
    }

    function permissionEncripted(encAction: AllowedAction | AllowedAction[]): string | string[] {
        if (Array.isArray(encAction)) return encAction.map((action) => encryptAction(action));
        return encryptAction(encAction);
    }

    function setSelectedModule(module: any) {
        selectedModule.value = module;
        if (module) {
            localStorage.setItem('selectedModule', JSON.stringify(module));
        } else {
            localStorage.removeItem('selectedModule');
        }
    }

    // Strict per-module sidebar scoping: a group shows only when the selected
    // module's code is one of the group's module codes (an untagged group is
    // global). Each module -- Core, System Config, Company Setup/Customization,
    // and every business module -- shows ONLY its own groups.
    // Module codes the tenant is entitled/subscribed to; super-admins bypass the gate.
    const entitledModuleCodes = computed<string[]>(() => entitlements.value.modules ?? []);
    const isSuperAdmin = computed<boolean>(() => !!entitlements.value.is_super_admin);

    /** The departments this user owns; empty when unrestricted. */
    const scopedDepartments = computed<ScopedDepartment[]>(() => entitlements.value.scope?.departments ?? []);
    /** True when the user sees only their own departments. */
    const isScopeRestricted = computed<boolean>(() => !(entitlements.value.scope?.unrestricted ?? false));

    /** The departments this user may act FOR — empty when unrestricted. */
    const managedDepartments = computed<ScopedDepartment[]>(() => entitlements.value.scope?.managed_departments ?? []);

    /** Whether the user may act for a department at all. */
    const managesDepartment = (departmentId: number): boolean =>
        !isScopeRestricted.value || managedDepartments.value.some((department) => department.id === departmentId);

    const filteredSidebarMenu = computed(() => {
        if (!selectedModule.value) return sidebarMenu.value;
        const code = selectedModule.value.code;
        return sidebarMenu.value.filter((group) => {
            const groupModules = group.modules ?? (group.module ? [group.module] : []);
            if (groupModules.length === 0) return true;
            return groupModules.includes(code);
        });
    });

    return {
        allowedRoutes,
        sidebarMenu,
        filteredSidebarMenu,
        entitlements,
        entitledModuleCodes,
        isSuperAdmin,
        scopedDepartments,
        isScopeRestricted,
        managedDepartments,
        managesDepartment,
        authRedirect,
        unauthRedirect,
        isLoading,
        isInitialized,
        selectedModule,
        fetchAllowedRoutes,
        isRouteAllowed,
        can,
        permissionEncripted,
        setSelectedModule
    };
});
