import Setting from '@/assets/icons/Setting.vue';
import BoxIcon from '@/assets/icons/BoxIcon.vue';
import CubeIcon from '@/assets/icons/CubeIcon.vue';
import GridIcon from '@/assets/icons/GridIcon.vue';
import Calendar from '@/assets/icons/Calendar.vue';
import BellIcon from '@/assets/icons/BellIcon.vue';

import MailIcon from '@/assets/icons/MailIcon.vue';
import UsersIcon from '@/assets/icons/UsersIcon.vue';
import AdjustIcon from '@/assets/icons/AdjustIcon.vue';
import MonitorIcon from '@/assets/icons/MonitorIcon.vue';
import DoubleCheck from '@/assets/icons/DoubleCheck.vue';
import GlobeWebIcon from '@/assets/icons/GlobeWebIcon.vue';
import InventoryIcon from '@/assets/icons/InventoryIcon.vue';

import UserCheckmark from '@/assets/icons/UserCheckmark.vue';
import MoneyBanknotes from '@/assets/icons/MoneyBanknotes.vue';
import ModernBuilding from '@/assets/icons/ModernBuilding.vue';
import UserProfileSetting from '@/assets/icons/UserProfileSetting.vue';
import ShieldCheckAltIcon from '@/assets/icons/ShieldCheckAltIcon.vue';
import TravelDatesCalendar from '@/assets/icons/TravelDatesCalendar.vue';
import AdvancedAnalyticsIcon from '@/assets/icons/AdvancedAnalyticsIcon.vue';
import ShieldProtectedCheckmark from '@/assets/icons/ShieldProtectedCheckmark.vue';

export const useModuleIconRegistry: Record<string, any> = {
    // Common module icons mapping
    'fa-solid fa-cube': CubeIcon,
    'fa-solid fa-users': UsersIcon,
    'fa-solid fa-grid': GridIcon,
    'fa-solid fa-money-bill-wave': MoneyBanknotes,
    'fa-solid fa-calendar': Calendar,
    'fa-solid fa-shield-alt': ShieldCheckAltIcon,
    'fa-solid fa-chart-line': AdvancedAnalyticsIcon,
    'fa-solid fa-boxes': InventoryIcon,
    'fa-solid fa-bell': BellIcon,
    'fa-solid fa-cog': Setting,
    'fa-solid fa-box': BoxIcon,
    'fa-solid fa-globe': GlobeWebIcon,
    'fa-solid fa-desktop': MonitorIcon,
    'fa-solid fa-envelope': MailIcon,
    'fa-solid fa-user-check': UserCheckmark,
    'fa-solid fa-calendar-alt': TravelDatesCalendar,
    'fa-solid fa-shield-check': ShieldProtectedCheckmark,
    'fa-solid fa-user-cog': UserProfileSetting,
    'fa-solid fa-calculator': AdvancedAnalyticsIcon,
    'fa-solid fa-chart-pie': AdvancedAnalyticsIcon,
    'fa-solid fa-shopping-cart': BoxIcon,
    'fa-solid fa-handshake': UserCheckmark,
    'fa-solid fa-building': BoxIcon,
    'fa-solid fa-clipboard-list': DoubleCheck,

    // Alternative mappings without fa-solid prefix for flexibility
    cube: CubeIcon,
    users: UsersIcon,
    grid: GridIcon,
    money: MoneyBanknotes,
    calendar: Calendar,
    shield: ShieldCheckAltIcon,
    analytics: AdvancedAnalyticsIcon,
    inventory: InventoryIcon,
    bell: BellIcon,
    setting: Setting,
    box: BoxIcon,
    globe: GlobeWebIcon,
    monitor: MonitorIcon,
    mail: MailIcon,
    userCheck: UserCheckmark,
    date: TravelDatesCalendar,
    security: ShieldProtectedCheckmark,
    profile: UserProfileSetting,
    calculator: AdvancedAnalyticsIcon,
    chart: AdvancedAnalyticsIcon,
    cart: BoxIcon,
    handshake: UserCheckmark,
    building: CubeIcon,
    clipboard: DoubleCheck,
    modernBuilding: ModernBuilding,
    adjustment: AdjustIcon
};
