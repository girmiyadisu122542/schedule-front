import { storeToRefs } from 'pinia';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { computed, ref, watch } from 'vue';
import axiosInstance from '@/api/axiosInstance';
import { createSharedComposable } from '@vueuse/core';
import type { TopMenuItem } from '@/types/sidebarTypes';
import { useLanguageStore } from '@/stores/languageStore';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';
import { MODULE_DASHBOARD_ROUTE } from '@/config/moduleDashboards';
import { OBJECT } from '@/modules/user/constants/fixedValues';
import { toast } from 'vue-sonner';

export interface Module {
    code: string;
    icon: string;
    color: string;
    name: string | Record<string, string>;
    description: string | Record<string, string>;
    module_group?: {
        name: string;
        display_name: string;
        state: number;
        state_data: any;
    };
    is_subscribed?: boolean;
    is_free?: boolean;
}

export interface GroupedModules {
    [groupName: string]: Module[];
}

function moduleManagement() {
    const router = useRouter();
    const languageStore = useLanguageStore();
    const { translations, currentLanguage } = storeToRefs(languageStore);
    const allowedRoutesStore = useAllowedRoutesStore();
    const { customizeLanguageData } = languageStore;

    const searchQuery = ref('');
    const isLoading = ref(false);
    const modules = ref<Module[]>([]);
    const activeTab = ref<'all' | 'subscribed' | 'non-subscribed'>('all');

    const isOpen = ref(false);
    const isMobileMenuOpen = ref(false);
    const selectedModule = ref<any>(null);
    const activeMenuItem = ref<string | null>(null);
    const dropdownRef = ref<HTMLElement | null>(null);
    const filteredSidebarMenu = computed(() => allowedRoutesStore.filteredSidebarMenu);
    const activeSubmenu = ref<{ name: string; x: number; y: number; items: TopMenuItem[] } | null>(null);

    const isResultsVisible = ref(false);
    const hoveredModule = ref<Module | null>(null);
    const searchContainerRef = ref<HTMLElement | null>(null);

    /**
     * Where selecting a module should land: that module's own dashboard when it
     * ships one, otherwise the shared /dashboard (Core / System Config / Company
     * Setup have no dedicated dashboard).
     */
    const resolveModuleHome = (module: Module | null): RouteLocationRaw => {
        const routeName = module?.code ? MODULE_DASHBOARD_ROUTE[module.code] : undefined;
        return routeName && router.hasRoute(routeName) ? { name: routeName } : '/dashboard';
    };

    watch(filteredSidebarMenu, (newMenu) => {
        if (selectedModule.value && newMenu.length > 0) {
            router.push(resolveModuleHome(selectedModule.value));
        }
    });

    const totalCount = computed(() => modules.value.length);
    const isSubscribed = computed(() => selectedModule.value?.is_subscribed ?? false);
    const subscribedCount = computed(() => modules.value.filter((m) => m.is_subscribed).length);

    const moduleName = computed(() => {
        if (!selectedModule.value) return languageStore.translations.unknownModule || 'Unknown Module';
        return typeof selectedModule.value.name === OBJECT
            ? selectedModule.value.name[languageStore.currentLanguage] ||
                  selectedModule.value.name['en'] ||
                  selectedModule.value.name
            : selectedModule.value.name;
    });
    const notificationsData = [
        {
            id: 1,
            title: 'Stock Issued',
            message: 'Items have been deducted from inventory.',
            time: '1hr ago',
            module: 'Inventory',
            isPinned: true,
            isRead: false,
            icon: 'fa-box-open',
            colorClass: 'bg-orange-50 text-orange-500'
        },
        {
            id: 2,
            title: 'Accounting',
            message: 'Items have been deducted from inventory.',
            time: '1hr ago',
            module: 'Accounting',
            isPinned: false,
            isRead: true,
            icon: 'fa-calculator',
            colorClass: 'bg-blue-50 text-blue-500'
        }
    ];
    const message = computed(() => {
        if (isSubscribed.value) {
            return (
                languageStore.translations.moduleNotImplemented ||
                'This module is not yet implemented. Please check back later.'
            );
        } else {
            return (
                languageStore.translations.notSubscribedModules ||
                'You are not subscribed to this module. Please contact your administrator to get access.'
            );
        }
    });

    // used for module dashboard
    const groupedModules = computed(() => {
        const filtered = modules.value.filter((module) => {
            if (activeTab.value === 'subscribed') return module.is_subscribed;
            if (activeTab.value === 'non-subscribed') return !module.is_subscribed;
            return true;
        });

        return filtered.reduce((acc: GroupedModules, module) => {
            const groupName = module.module_group?.name || module.module_group?.display_name || 'General';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(module);
            return acc;
        }, {});
    });
    const filteredResults = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        if (!query) return [];

        return modules.value
            .filter((module) => {
                const name = (
                    typeof module.name === OBJECT && module.name
                        ? (module.name as Record<string, string>)[currentLanguage.value] ||
                          (module.name as Record<string, string>)['en'] ||
                          ''
                        : (module.name as string) || ''
                ).toLowerCase();
                return name.includes(query);
            })
            .map((module) => ({
                ...module,
                displayName:
                    typeof module.name === OBJECT
                        ? (module.name as Record<string, string>)[currentLanguage.value] ||
                          (module.name as Record<string, string>)['en']
                        : module.name,
                suffix: module.is_subscribed ? 'list' : 'locked'
            }))
            .slice(0, 8);
    });

    // used for sidebar menu
    const computedMenuData = computed(() => {
        const entitledCodes = allowedRoutesStore.entitledModuleCodes;
        const canSeeAllModules = allowedRoutesStore.isSuperAdmin;

        // First filter modules by entitlement, then by the search query
        const filteredModules = modules.value.filter((module) => {
            if (!canSeeAllModules && !entitledCodes.includes(module.code)) return false;
            if (!searchQuery.value) return true;
            const name = (
                typeof module.name === OBJECT && module.name
                    ? (module.name as Record<string, string>)[currentLanguage.value] ||
                      (module.name as Record<string, string>)['en'] ||
                      ''
                    : (module.name as string) || ''
            ).toLowerCase();
            const desc = (
                typeof module.description === OBJECT && module.description
                    ? (module.description as Record<string, string>)[currentLanguage.value] ||
                      (module.description as Record<string, string>)['en'] ||
                      ''
                    : (module.description as string) || ''
            ).toLowerCase();
            return name.includes(searchQuery.value.toLowerCase()) || desc.includes(searchQuery.value.toLowerCase());
        });

        const grouped = filteredModules.reduce((acc: { [key: string]: any[] }, module) => {
            const groupName = module.module_group?.name || module.module_group?.display_name || 'General';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(module);
            return acc;
        }, {});

        return Object.entries(grouped).map(([title, mods]) => ({
            title,
            items: mods.map((mod: any) => ({
                name: typeof mod.name === OBJECT ? mod.name[currentLanguage.value] || mod.name['en'] : mod.name,
                icon: mod.icon,
                path: undefined,
                module: mod,
                subtitle: undefined,
                subItems: []
            }))
        }));
    });

    const tabOptions = computed(() => [
        { label: translations.value.all || 'All', value: 'all' },
        { label: translations.value.subscribed || 'Subscribed', value: 'subscribed' },
        { label: translations.value.nonSubscribed || 'Non Subscribed', value: 'non-subscribed' }
    ]);

    const goBackToModules = () => {
        router.push('/modules');
    };

    const toggleMobileMenu = () => {
        isMobileMenuOpen.value = !isMobileMenuOpen.value;
    };

    const languageDropdownOpen = ref(false);

    const toggleLanguageDropdown = () => {
        languageDropdownOpen.value = !languageDropdownOpen.value;
    };

    const closeLanguageDropdown = () => {
        languageDropdownOpen.value = false;
    };

    const selectLanguage = (langCode: string) => {
        currentLanguage.value = langCode;
        languageStore.setLanguage(langCode);
        closeLanguageDropdown();
    };

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.language-dropdown-trigger') && !target.closest('.language-dropdown-menu')) {
            closeLanguageDropdown();
        }
    };

    // The Schedule starter kit is a single application with no module system,
    // so there is nothing to fetch. Kept as a no-op so the sidebar's module
    // switcher renders empty instead of calling a non-existent endpoint.
    const fetchModules = async () => {
        modules.value = [];
    };

    const onSearch = async () => {
        await fetchModules();
    };

    const onModuleClick = (module: Module) => {
        if (module.is_subscribed || module.is_free) {
            selectedModule.value = module;
            allowedRoutesStore.setSelectedModule(module);
            router.push(resolveModuleHome(module));
        } else {
            router.push('/subscribe');
        }
    };

    const toggleModuleDropdown = () => {
        isOpen.value = !isOpen.value;
        if (!isOpen.value) {
            activeSubmenu.value = null;
            activeMenuItem.value = null;
        }
    };

    const closeModuleDropdown = () => {
        isOpen.value = false;
        activeSubmenu.value = null;
        activeMenuItem.value = null;
    };

    const handleClickModuleOutside = (event: MouseEvent) => {
        if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
            closeModuleDropdown();
        }
    };

    const handleModuleMenuClick = (item: TopMenuItem, event: MouseEvent) => {
        if (item.subItems && item.subItems.length > 0) {
            event.stopPropagation();
            activeMenuItem.value = item.name;
            const rect = (event.target as HTMLElement).closest('.menu-item')?.getBoundingClientRect();
            if (rect) {
                activeSubmenu.value = {
                    name: item.name,
                    x: rect.right + 8,
                    y: rect.top,
                    items: item.subItems
                };
            }
        } else if (item.module) {
            selectedModule.value = item.module;
            allowedRoutesStore.setSelectedModule(item.module);
            if (allowedRoutesStore.filteredSidebarMenu.length === 0) {
                router.push('/module-not-available');
            }
            closeModuleDropdown();
        } else if (item.path) {
            router.push(item.path);
            closeModuleDropdown();
        }
    };

    const closeModuleSubmenu = () => {
        activeSubmenu.value = null;
        activeMenuItem.value = null;
    };

    const handleModuleSubmenuClick = (item: TopMenuItem, event: MouseEvent) => {
        if (item.subItems && item.subItems.length > 0) {
            event.stopPropagation();
            activeMenuItem.value = item.name;
            const rect = (event.target as HTMLElement).closest('.submenu-item')?.getBoundingClientRect();
            if (rect) {
                activeSubmenu.value = {
                    name: item.name,
                    x: rect.right + 8,
                    y: rect.top,
                    items: item.subItems
                };
            }
        } else if (item.path) {
            router.push(item.path);
            closeModuleDropdown();
        }
    };

    const isMenuItemActive = (itemName: string) => {
        return activeMenuItem.value === itemName;
    };

    const handleInput = () => {
        isResultsVisible.value = searchQuery.value.length > 0;
    };

    const setHovered = (module: Module | null) => {
        hoveredModule.value = module;
    };

    // 3. Click Outside (Integrated into Composable)
    const closeResults = () => {
        isResultsVisible.value = false;
        hoveredModule.value = null;
    };

    return {
        languageDropdownOpen,
        computedMenuData,
        isMobileMenuOpen,
        subscribedCount,
        groupedModules,
        selectedModule,
        activeMenuItem,
        activeSubmenu,
        dropdownRef,
        searchQuery,
        totalCount,
        tabOptions,
        moduleName,
        isLoading,
        activeTab,
        message,
        modules,
        isOpen,
        searchContainerRef,
        notificationsData,
        filteredResults,

        isResultsVisible,
        hoveredModule,
        handleInput,
        setHovered,
        closeResults,
        onSearch,
        fetchModules,
        onModuleClick,
        selectLanguage,
        goBackToModules,
        toggleMobileMenu,
        isMenuItemActive,
        closeModuleSubmenu,
        handleClickOutside,
        closeModuleDropdown,
        toggleModuleDropdown,
        closeLanguageDropdown,
        handleModuleMenuClick,
        toggleLanguageDropdown,
        handleClickModuleOutside,
        handleModuleSubmenuClick
    };
}

export const useGetModules = createSharedComposable(moduleManagement);
