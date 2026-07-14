<script setup lang="ts">
import { computed } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useRole } from '@/modules/user/composables/AccessManagement/role/useRole';

import Breadcrumb from '@/components/common/Breadcrumb.vue';
import StatCard from '@/components/common/StatCard.vue';
import MonitorIcon from '@/assets/icons/MonitorIcon.vue';
import CalendarIcon from '@/assets/icons/Calendar.vue';
import CircleCheckIcon from '@/assets/icons/CircleCheckIcon.vue';
import ExclamationCircleIcon from '@/assets/icons/ExclamationCircleIcon.vue';
import UsersIcon from '@/assets/icons/UsersIcon.vue';
import Role from '@/modules/user/components/AccessManagement/Role/Role.vue';

const { customizeLanguageData } = useLanguageStore();
const { stats } = useRole();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('role', 'Role') }]);
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="MonitorIcon" />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                :title="$lang.allRoles"
                :value="stats.total"
                :icon="CalendarIcon"
                variant="primary" />
            <StatCard
                :title="$lang.activeRole"
                :value="stats.active"
                :icon="CircleCheckIcon"
                variant="success" />
            <StatCard
                :title="$lang.assignedUsers || 'Assigned Users'"
                :value="stats.assigned_users"
                :icon="UsersIcon"
                variant="primary" />
            <StatCard
                :title="$lang.unassignedRoles || 'Unassigned Roles'"
                :value="stats.unassigned"
                :icon="ExclamationCircleIcon"
                variant="warning" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-schedule-text-primary dark:text-text-primary text-xl font-semibold">
                    {{ $lang.manageRole }}
                </h1>
                <p class="text-md text-schedule-text-tertiary dark:text-text-tertiary font-normal">
                    {{ $lang.manageRoleDesc }}
                </p>
            </div>
            <Role />
        </div>
    </div>
</template>
