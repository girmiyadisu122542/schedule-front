<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import { ACTIVE_STATUS } from '@/config/appConfig';
import type { Permission } from '@/modules/user/types/AccessManagement/permission';

const props = defineProps<{
    visible: boolean;
    permission: Permission | null;
}>();

const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
}>();

const isActive = (perm: Permission | null): boolean => Number(perm?.state) === ACTIVE_STATUS;
</script>

<template>
    <MainDialog
        :visible="visible"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <template #header>
            <div class="flex items-center gap-3">
                <span class="text-schedule-text-primary dark:text-text-primary text-lg font-bold">
                    {{ $lang.permissionDetail || 'Permission Detail' }}
                </span>
            </div>
        </template>

        <div
            v-if="permission"
            class="space-y-5 py-2">
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">{{ $lang.name }}</p>
                    <p class="text-schedule-text-primary dark:text-text-primary mt-1 font-semibold">
                        {{ permission.name }}
                    </p>
                </div>
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">{{ $lang.key || 'Key' }}</p>
                    <p class="text-schedule-text-primary dark:text-text-primary mt-1 font-mono text-sm font-semibold">
                        {{ permission.key }}
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">{{ $lang.permissionGroup }}</p>
                    <p class="text-schedule-text-primary dark:text-text-primary mt-1 font-semibold">
                        {{ permission.permissionGroup?.name ?? '-' }}
                    </p>
                </div>
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                        {{ $lang.status || 'Status' }}
                    </p>
                    <span
                        :class="
                            isActive(permission)
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'dark:bg-surface-subtle dark:text-text-secondary bg-gray-100 text-gray-600'
                        "
                        class="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold">
                        {{ isActive(permission) ? $lang.active || 'Active' : $lang.inactive || 'Inactive' }}
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">{{ $lang.type || 'Type' }}</p>
                    <span
                        :class="
                            permission.is_system
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        "
                        class="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold">
                        {{ permission.is_system ? $lang.system || 'System' : $lang.custom || 'Custom' }}
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                        {{ $lang.uniquePerUser || 'Unique Per User' }}
                    </p>
                    <p class="text-schedule-text-primary dark:text-text-primary mt-1 font-semibold">
                        {{ permission.unique_per_user ? $lang.yes || 'Yes' : $lang.no || 'No' }}
                    </p>
                </div>
            </div>

            <p
                v-if="permission.created_at"
                class="text-schedule-text-tertiary dark:text-text-muted text-xs">
                {{ $lang.createdOn }} :{{
                    new Date(permission.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })
                }}
            </p>
        </div>
    </MainDialog>
</template>
