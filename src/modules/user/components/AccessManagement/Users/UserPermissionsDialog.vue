<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import Badge from '@/components/common/Badge.vue';
import type { User } from '@/modules/user/types/AccessManagement/User/UserType';

defineProps<{
    visible: boolean;
    user: User | null;
    overrides: any[];
    loading: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
}>();
</script>

<template>
    <MainDialog
        :visible="visible"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <template #header>
            <div class="flex flex-col">
                <span class="text-schedule-text-primary dark:text-text-primary text-lg font-bold">
                    {{ $lang.userPermissions || 'User Permissions' }}
                </span>
                <span
                    v-if="user"
                    class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                    {{ user.full_name }}
                </span>
            </div>
        </template>

        <div class="py-2">
            <div
                v-if="loading"
                class="flex justify-center py-10">
                <div
                    class="border-schedule-brand-blue h-6 w-6 animate-spin rounded-full border-4 border-t-transparent"></div>
            </div>

            <div
                v-else-if="!overrides.length"
                class="text-schedule-text-tertiary dark:text-text-muted py-10 text-center text-sm">
                {{ $lang.noPermissionOverrides || 'No permissions assigned to this user.' }}
            </div>

            <div
                v-else
                class="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                <div
                    v-for="override in overrides"
                    :key="override.id"
                    class="border-schedule-border-subtle dark:border-border-default flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                    <div class="min-w-0">
                        <p class="text-text-primary truncate text-sm font-medium">
                            {{ override.permission }}
                        </p>
                        <p
                            v-if="override.entity?.name || override.starts_at || override.ends_at"
                            class="text-schedule-text-tertiary dark:text-text-tertiary mt-0.5 truncate text-xs">
                            <span v-if="override.entity?.name">{{ override.entity.name }}</span>
                            <span v-if="override.entity?.name && (override.starts_at || override.ends_at)">·</span>
                            <span v-if="override.starts_at || override.ends_at">
                                {{ override.starts_at || '…' }} → {{ override.ends_at || '…' }}
                            </span>
                        </p>
                    </div>
                    <Badge
                        outlined
                        :variant="override.allow ? 'success' : 'error'"
                        :label="override.allow ? $lang.granted || 'Granted' : $lang.revoked || 'Revoked'" />
                </div>
            </div>
        </div>
    </MainDialog>
</template>
