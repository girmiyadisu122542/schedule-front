<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import type { PermissionGroup } from '@/modules/user/types/AccessManagement/permission';

defineProps<{
    visible: boolean;
    group: PermissionGroup | null;
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
            <div class="flex items-center gap-3">
                <span class="text-schedule-text-primary dark:text-text-primary text-lg font-bold">
                    {{ $lang.permissionGroupDetail }}
                </span>
            </div>
        </template>

        <div
            v-if="group"
            class="space-y-5 py-2">
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">{{ $lang.name }}</p>
                    <p class="text-schedule-text-primary dark:text-text-primary mt-1 font-semibold">{{ group.name }}</p>
                </div>
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">{{ $lang.code }}</p>
                    <p class="text-schedule-text-primary dark:text-text-primary mt-1 font-semibold">{{ group.code }}</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">{{ $lang.isGroup }}</p>
                    <span
                        class="bg-schedule-brand-blue-subtle text-schedule-brand-blue mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold">
                        {{ $lang.yes }}
                    </span>
                </div>
                <div>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                        {{ $lang.parentPermissionGroup }}
                    </p>
                    <p class="text-schedule-text-primary dark:text-text-primary mt-1 font-semibold">
                        {{ group.parent?.name ?? '-' }}
                    </p>
                </div>
            </div>

            <div>
                <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">{{ $lang.level }}</p>
                <p class="text-schedule-text-primary dark:text-text-primary mt-1 font-semibold">
                    Level {{ group.level }}
                </p>
            </div>

            <p class="text-schedule-text-tertiary dark:text-text-muted text-xs">
                {{ $lang.createdOn }} :{{
                    group.created_at
                        ? new Date(group.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                          })
                        : '-'
                }}
            </p>
        </div>
    </MainDialog>
</template>
