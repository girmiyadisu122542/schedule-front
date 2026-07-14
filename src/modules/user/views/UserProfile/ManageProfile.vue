<script setup lang="ts">
import { ref } from 'vue';

import { PROFILE_TABS, type ProfileTab } from '@/config/appConfig';
import RecentDevice from '@/modules/user/components/UserProfile/RecentDevice.vue';
import ProfileSidebar from '@/modules/user/components/UserProfile/ProfileSidebar.vue';
import BasicInformation from '@/modules/user/components/UserProfile/BasicInformation.vue';
import PasswordandSecurity from '@/modules/user/components/UserProfile/PasswordandSecurity.vue';
import TwoStepVerificatiom from '@/modules/user/components/UserProfile/TwoStepVerificatiom.vue';

const activeId = ref<ProfileTab>(PROFILE_TABS.BASIC);
</script>
<template>
    <div class="min-h-screen bg-gray-50/50 p-4 md:p-8 dark:bg-black">
        <div>
            <div class="grid grid-cols-1 gap-8 lg:grid-cols-4">
                <div class="lg:col-span-1">
                    <ProfileSidebar
                        :active-tab="activeId"
                        @select-tab="(id) => (activeId = id)" />
                </div>

                <div class="lg:col-span-3">
                    <BasicInformation
                        v-if="activeId === PROFILE_TABS.BASIC"
                        :key="PROFILE_TABS.BASIC" />
                    <PasswordandSecurity v-else-if="activeId === PROFILE_TABS.SECURITY" />
                    <RecentDevice v-else-if="activeId === PROFILE_TABS.DEVICES" />
                    <TwoStepVerificatiom v-else-if="activeId === PROFILE_TABS.VERIFICATION" />
                    <div
                        v-else
                        class="border-schedule-tertiary rounded-2xl border bg-white p-12 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <p class="text-gray-400 italic">{{ activeId }} {{ $lang.isUnderDevelopment }}.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
