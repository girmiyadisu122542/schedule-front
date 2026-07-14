import { toast } from 'vue-sonner';
import { useRoute } from 'vue-router';
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue';

import BoxIcon from '@/assets/icons/BoxIcon.vue';
import Setting from '@/assets/icons/Setting.vue';
import GridIcon from '@/assets/icons/GridIcon.vue';
import UserCircle from '@/assets/icons/UserCircle.vue';
import MessageQuestionMarkIcon from '@/assets/icons/MessageQuestionMarkIcon.vue';

import { useSidebar } from '@/composables/useSidebar';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/modules/user/store/authStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import {
    NO_EMAIL,
    HELP_ROUTE,
    MODULES_ROUTE,
    SETTINGS_ROUTE,
    DASHBOARD_ROUTE,
    USER_MENU_KEY_HELP,
    USER_PROFILE_ROUTE,
    USER_MENU_KEY_LOGOUT,
    USER_MENU_LABEL_HELP,
    USER_MENU_KEY_COPIED,
    USER_MENU_KEY_UPGRADE,
    USER_MENU_KEY_MODULES,
    USER_MENU_KEY_SETTINGS,
    USER_MENU_KEY_SIGN_OUT,
    USER_MENU_LABEL_COPIED,
    USER_MENU_LABEL_LOGOUT,
    USER_MENU_LABEL_UPGRADE,
    USER_MENU_KEY_DASHBOARD,
    USER_MENU_LABEL_MODULES,
    USER_MENU_LABEL_SETTINGS,
    USER_MENU_KEY_COPY_EMAIL,
    USER_MENU_LABEL_DASHBOARD,
    USER_MENU_LABEL_COPY_EMAIL,
    USER_MENU_KEY_USER_PROFILE,
    USER_MENU_DROPDOWN_SELECTOR,
    USER_MENU_CONTAINER_SELECTOR,
    USER_MENU_LABEL_USER_PROFILE,
    USER_MENU_KEY_CLIPBOARD_UNAVAILABLE,
    USER_MENU_LABEL_CLIPBOARD_UNAVAILABLE
} from '@/modules/user/constants/fixedValues';

interface UseUserMenuOptions {
    onlyAvatar?: boolean;
    forceExpanded?: boolean;
}

export function useUserMenu(options: UseUserMenuOptions = {}) {
    const route = useRoute();
    const authStore = useAuthStore();
    const languageStore = useLanguageStore();
    const allowedRoutesStore = useAllowedRoutesStore();
    const { customizeLanguageData } = languageStore;
    const { isExpanded, isMobileOpen } = useSidebar();

    const dropdownOpen = ref(false);
    const dropdownRef = ref<HTMLElement | null>(null);

    const upgradeRoute = MODULES_ROUTE;

    const user = computed(() => ({
        firstName: authStore.user?.first_name || customizeLanguageData('guest', 'Guest'),
        middleName: authStore.user?.middle_name || '',
        lastName: authStore.user?.last_name || '',
        email: authStore.user?.email || NO_EMAIL,
        photo: authStore.user?.photo || '',
        fullName: [authStore.user?.first_name, authStore.user?.middle_name, authStore.user?.last_name]
            .filter(Boolean)
            .join(' ')
    }));

    const toggleDropdown = () => {
        dropdownOpen.value = !dropdownOpen.value;
    };

    const closeDropdown = () => {
        dropdownOpen.value = false;
    };

    const signOut = async () => {
        authStore.logout();
        closeDropdown();
    };

    const dashboardPath = computed(() => allowedRoutesStore.authRedirect || DASHBOARD_ROUTE);
    const isOnDashboard = computed(() => route.path === dashboardPath.value);

    const handleMenuClick = (callback: () => void) => {
        callback();
        closeDropdown();
    };

    const copyEmail = async () => {
        if (!user.value.email || user.value.email === NO_EMAIL) return;
        try {
            await navigator.clipboard.writeText(user.value.email);
            toast.success(customizeLanguageData(USER_MENU_KEY_COPIED, USER_MENU_LABEL_COPIED));
        } catch {
            toast.error(
                customizeLanguageData(USER_MENU_KEY_CLIPBOARD_UNAVAILABLE, USER_MENU_LABEL_CLIPBOARD_UNAVAILABLE)
            );
        }
    };

    const showCollapsed = computed(
        () => ((!isExpanded.value && !isMobileOpen.value) || !!options.onlyAvatar) && !options.forceExpanded
    );

    const isFloating = computed(() => showCollapsed.value && !options.onlyAvatar);

    const navLinks = computed(() => {
        const contextual = isOnDashboard.value
            ? {
                  key: USER_MENU_KEY_MODULES,
                  label: customizeLanguageData(USER_MENU_KEY_MODULES, USER_MENU_LABEL_MODULES),
                  icon: markRaw(BoxIcon),
                  to: MODULES_ROUTE
              }
            : {
                  key: USER_MENU_KEY_DASHBOARD,
                  label: customizeLanguageData(USER_MENU_KEY_DASHBOARD, USER_MENU_LABEL_DASHBOARD),
                  icon: markRaw(GridIcon),
                  to: dashboardPath.value
              };

        return [
            contextual,
            {
                key: USER_MENU_KEY_USER_PROFILE,
                label: customizeLanguageData(USER_MENU_KEY_USER_PROFILE, USER_MENU_LABEL_USER_PROFILE),
                icon: markRaw(UserCircle),
                to: USER_PROFILE_ROUTE
            },
            {
                key: USER_MENU_KEY_SETTINGS,
                label: customizeLanguageData(USER_MENU_KEY_SETTINGS, USER_MENU_LABEL_SETTINGS),
                icon: markRaw(Setting),
                to: SETTINGS_ROUTE
            },
            {
                key: USER_MENU_KEY_HELP,
                label: customizeLanguageData(USER_MENU_KEY_HELP, USER_MENU_LABEL_HELP),
                icon: markRaw(MessageQuestionMarkIcon),
                to: HELP_ROUTE
            }
        ];
    });

    const labels = computed(() => ({
        upgradeSubscription: customizeLanguageData(USER_MENU_KEY_UPGRADE, USER_MENU_LABEL_UPGRADE),
        logout: customizeLanguageData(
            USER_MENU_KEY_LOGOUT,
            customizeLanguageData(USER_MENU_KEY_SIGN_OUT, USER_MENU_LABEL_LOGOUT)
        ),
        copyEmail: customizeLanguageData(USER_MENU_KEY_COPY_EMAIL, USER_MENU_LABEL_COPY_EMAIL)
    }));

    const panelClass = computed(() => {
        if (isFloating.value) return 'user-menu-dropdown fixed z-9999 w-64';
        if (options.onlyAvatar) return 'user-menu-dropdown absolute top-full right-0 mt-2 w-64';
        return 'user-menu-dropdown absolute top-full left-0 mt-2 w-full';
    });

    const getUserMenuPosition = () => {
        const element = document.querySelector(USER_MENU_CONTAINER_SELECTOR);
        if (element) {
            const rect = element.getBoundingClientRect();
            const menuHeight = 360;

            const x = rect.right - 50;

            let top = rect.bottom + 8;
            if (top + menuHeight > window.innerHeight - 20) {
                top = window.innerHeight - menuHeight - 20;
            }
            if (top < 20) {
                top = 20;
            }

            return { x, y: top };
        }
        return { x: 0, y: 0 };
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!dropdownRef.value) return;
        if (dropdownRef.value.contains(target)) return;
        if (target.closest?.(USER_MENU_DROPDOWN_SELECTOR)) return;
        closeDropdown();
    };

    const getNameShorten = (name: string) => {
        if (!name) return '';
        const initials = name
            .split(' ')
            .filter((part) => part)
            .map((part: string) => part.charAt(0).toUpperCase());
        return initials.slice(0, 3).join('');
    };

    onMounted(() => {
        document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
    });

    return {
        dashboardPath,
        isOnDashboard,
        showCollapsed,
        dropdownOpen,
        upgradeRoute,
        dropdownRef,
        isFloating,
        panelClass,
        navLinks,
        labels,
        user,
        signOut,
        copyEmail,
        closeDropdown,
        toggleDropdown,
        getNameShorten,
        handleMenuClick,
        getUserMenuPosition
    };
}
