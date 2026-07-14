<script setup lang="ts">
import { computed } from 'vue';
import MainDialog from '@/components/common/MainDialog.vue';
import type { Role } from '@/modules/user/types/AccessManagement/role';

const props = defineProps<{
    visible: boolean;
    role: Role | null;
}>();

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>();

const createdOn = computed(() => {
    if (!props.role?.created_at) return null;
    return new Date(props.role.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
});

// Semantic chip palettes (audit: green=active/enabled, gray=inactive/disabled,
// blue=system, purple=custom).
const enabledChip = (on: boolean) =>
    on
        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        : 'bg-gray-100 text-gray-500 dark:bg-surface-card dark:text-text-tertiary';
</script>

<template>
    <MainDialog
        :plain-background="true"
        :visible="visible"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <template #header>
            <div class="flex items-center gap-3">
                <span class="text-text-primary text-xl font-semibold">
                    {{ $lang.roleDetail || 'Role Detail' }}
                </span>
                <span
                    :class="
                        role?.state === 1
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'dark:bg-surface-card dark:text-text-tertiary bg-gray-100 text-gray-500'
                    "
                    class="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {{ role?.state === 1 ? $lang.active || 'Active' : $lang.inactive || 'Inactive' }}
                </span>
            </div>
        </template>

        <div
            v-if="role"
            class="space-y-6 py-1">
            <!-- Identity hero -->
            <div class="border-border-subtle flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                <div class="min-w-0">
                    <h2 class="text-text-primary truncate text-lg font-semibold">{{ role.name }}</h2>
                </div>

                <!-- Permission count (static stat) -->
                <div class="border-border-subtle flex shrink-0 flex-col rounded-xl border px-4 py-2">
                    <span class="text-schedule-brand-blue text-lg leading-none font-bold">
                        {{ role.permissions_count ?? 0 }}
                    </span>
                    <span class="text-text-tertiary text-xs">{{ $lang.permission || 'Permissions' }}</span>
                </div>
            </div>

            <!-- Attribute grid -->
            <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                    <p class="text-text-tertiary text-xs font-medium tracking-wide uppercase">
                        {{ $lang.roleType || 'Role Type' }}
                    </p>
                    <span
                        :class="
                            role.is_system
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        "
                        class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {{ role.is_system ? $lang.system || 'System' : $lang.custom || 'Custom' }}
                    </span>
                </div>
                <div>
                    <p class="text-text-tertiary text-xs font-medium tracking-wide uppercase">
                        {{ $lang.uniquePerUser || 'Unique Per User' }}
                    </p>
                    <span
                        :class="enabledChip(!!role.unique_per_user)"
                        class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {{ role.unique_per_user ? $lang.enabled || 'Enabled' : $lang.disabled || 'Disabled' }}
                    </span>
                </div>
            </div>

            <!-- Description -->
            <div>
                <p class="text-text-tertiary mb-1.5 text-xs font-medium tracking-wide uppercase">
                    {{ $lang.description || 'Description' }}
                </p>
                <div class="border-border-subtle rounded-xl border p-4">
                    <div
                        v-if="role.description"
                        v-html="role.description"
                        class="text-text-secondary text-sm leading-relaxed"></div>
                    <p
                        v-else
                        class="text-text-tertiary text-sm italic">
                        {{ $lang.noDescriptionAvailable || 'No description available' }}
                    </p>
                </div>
            </div>

            <!-- Metadata -->
            <div
                v-if="createdOn"
                class="border-border-subtle text-text-tertiary flex flex-wrap gap-x-6 gap-y-1 border-t pt-4 text-xs">
                <span>
                    {{ $lang.createdOn || 'Created on' }}:
                    <span class="text-text-secondary font-medium">{{ createdOn }}</span>
                </span>
            </div>
        </div>
    </MainDialog>
</template>
