<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';

import TabList from '@/components/common/TabList.vue';
import Security from '@/modules/user/components/UserProfile/Security.vue';
import CoverPhoto from '@/modules/user/components/UserProfile/CoverPhoto.vue';
import ChangePassword from '@/modules/user/components/UserProfile/ChangePassword.vue';

import LockIcon from '@/assets/icons/LockIcon.vue';
import ShieldProtectedCheckmark from '@/assets/icons/ShieldProtectedCheckmark.vue';

const languageStore = useLanguageStore();

const { translations } = storeToRefs(languageStore);

const tabOptions = computed(() => [
    {
        id: 1,
        label: translations.value.password,
        value: 'password',
        icon: LockIcon
    },
    {
        id: 2,
        label: translations.value.security,
        value: 'security',
        icon: ShieldProtectedCheckmark
    }
]);
const activeSub = ref('password');
</script>

<template>
    <div
        class="border-schedule-border-subtle overflow-hidden rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
        <CoverPhoto />

        <div class="px-8 pb-8">
            <div class="mb-6">
                <TabList
                    v-model="activeSub"
                    :options="tabOptions" />
            </div>
            <div
                v-if="activeSub === 'password'"
                class="space-y-6">
                <ChangePassword />
            </div>

            <div v-else>
                <Security />
            </div>
        </div>
    </div>
</template>
