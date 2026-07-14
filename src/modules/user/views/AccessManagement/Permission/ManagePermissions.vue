<script setup lang="ts">
import { computed } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
const { customizeLanguageData } = useLanguageStore();

import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MonitorIcon from '@/assets/icons/MonitorIcon.vue';
import Permission from '@/modules/user/components/AccessManagement/Permission/Permission.vue';

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('managePermissions', 'Manage Permissions') }]);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="MonitorIcon" />
        </div>

        <div
            class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card rounded-2xl border bg-white px-4 py-4">
            <div class="mb-4">
                <h1 class="text-schedule-text-primary dark:text-text-primary text-xl font-semibold">
                    {{ $lang.managePermissions }}
                </h1>
                <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                    {{ $lang.managePermissionsDesc }}
                </p>
            </div>
            <Permission />
        </div>
    </div>
</template>
