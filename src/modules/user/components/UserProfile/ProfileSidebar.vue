<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { PROFILE_TABS, type ProfileTab } from '@/config/appConfig';
import { useLanguageStore } from '@/stores/languageStore';

import BellIcon from '@/assets/icons/BellIcon.vue';
import Location from '@/assets/icons/Location.vue';
import LockIcon from '@/assets/icons/LockIcon.vue';
import SettingIcon from '@/assets/icons/Setting.vue';
import DeviceIcon from '@/assets/icons/DeviceIcon.vue';
import FingerPrint from '@/assets/icons/FingerPrint.vue';

const languageStore = useLanguageStore();

const { translations } = storeToRefs(languageStore);

const menuItems = computed(() => [
    { id: PROFILE_TABS.BASIC, label: translations.value.basicInformation, icon: Location },
    { id: PROFILE_TABS.PREFERENCE, label: translations.value.preference, icon: SettingIcon },
    { id: PROFILE_TABS.SECURITY, label: translations.value.passwordAndSecurity, icon: LockIcon },
    { id: PROFILE_TABS.VERIFICATION, label: translations.value.twoStepVerification, icon: FingerPrint },
    { id: PROFILE_TABS.NOTIFICATIONS, label: translations.value.notifications, icon: BellIcon },
    { id: PROFILE_TABS.DEVICES, label: translations.value.recentDevices, icon: DeviceIcon }
]);

const props = defineProps<{
    activeTab: ProfileTab;
}>();

const emit = defineEmits<{
    (e: 'selectTab', id: ProfileTab): void;
}>();

const handleItemClick = (id: ProfileTab) => {
    emit('selectTab', id);
};
</script>

<template>
    <div
        class="border-schedule-border-subtle w-full max-w-72 rounded-2xl border bg-white p-3 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <nav class="flex flex-col gap-2">
            <button
                v-for="item in menuItems"
                :key="item.id"
                @click="handleItemClick(item.id)"
                :class="[
                    'flex items-center gap-3 px-3 py-2 text-sm font-normal transition-all',
                    activeTab === item.id
                        ? 'text-schedule-text-secondary dark:text-schedule-brand-blue bg-schedule-secondary rounded-lg dark:bg-blue-900/30'
                        : 'text-schedule-text-tertiary hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                ]">
                <component
                    :is="item.icon"
                    class="h-5 w-5" />
                {{ item.label }}
            </button>
        </nav>
    </div>
</template>
