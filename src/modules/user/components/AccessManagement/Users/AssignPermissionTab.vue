<script setup lang="ts">
import { ref } from 'vue';
import type { UserPermissionOverride } from '@/modules/user/types/AccessManagement/User/UserType';

interface Permission {
    id: number;
    name: string;
    display_name: string;
    scope?: number;
}

const props = defineProps<{
    permissionOverrides: UserPermissionOverride[];
    availablePermissions: Permission[];
    userId?: number;
}>();

const emit = defineEmits<{
    'update:permissionOverrides': [overrides: UserPermissionOverride[]];
}>() as any;

const permissionOverridesForm = ref<UserPermissionOverride[]>(props.permissionOverrides);

const addPermissionOverride = () => {
    const newOverride: UserPermissionOverride = {
        user_id: props.userId || 0,
        permission_id: 0,
        override_type: 'allow',
        scope: undefined,
        scope_id: undefined
    };
    permissionOverridesForm.value.push(newOverride);
    emit('update:permissionOverrides', permissionOverridesForm.value);
};

// Remove permission override
const removePermissionOverride = (index: number) => {
    permissionOverridesForm.value.splice(index, 1);
    emit('update:permissionOverrides', permissionOverridesForm.value);
};

// Update permission override
const updatePermissionOverride = (index: number, updates: Partial<UserPermissionOverride>) => {
    permissionOverridesForm.value[index] = {
        ...permissionOverridesForm.value[index],
        ...updates
    } as UserPermissionOverride;
    emit('update:permissionOverrides', permissionOverridesForm.value);
};
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
                {{ $lang.assignPermissionOverrides || 'Assign Permission Overrides' }}
            </h3>
            <button
                type="button"
                @click="addPermissionOverride"
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                {{ $lang.addPermissionOverride || 'Add Permission Override' }}
            </button>
        </div>

        <div class="space-y-4">
            <div
                v-for="(override, index) in permissionOverridesForm"
                :key="index"
                class="dark:border-border-default rounded-lg border border-gray-200 p-4">
                <div class="space-y-4">
                    <!-- Permission Selection -->
                    <div>
                        <label class="dark:text-text-secondary block text-sm font-medium text-gray-700">
                            {{ $lang.permission || 'Permission' }}
                        </label>
                        <select
                            v-model="override.permission_id"
                            @change="
                                (e) =>
                                    updatePermissionOverride(index, {
                                        permission_id: Number((e.target as HTMLSelectElement).value)
                                    })
                            "
                            class="dark:border-border-strong dark:bg-surface-card dark:text-text-primary mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none">
                            <option value="">{{ $lang.selectPermission || 'Select Permission' }}</option>
                            <option
                                v-for="permission in availablePermissions"
                                :key="permission.id"
                                :value="permission.id">
                                {{ permission.display_name }}
                            </option>
                        </select>
                    </div>

                    <!-- Override Type -->
                    <div>
                        <label class="dark:text-text-secondary block text-sm font-medium text-gray-700">
                            {{ $lang.overrideType || 'Override Type' }}
                        </label>
                        <select
                            v-model="override.override_type"
                            @change="
                                (e) =>
                                    updatePermissionOverride(index, {
                                        override_type: (e.target as HTMLSelectElement).value as 'allow' | 'deny'
                                    })
                            "
                            class="dark:border-border-strong dark:bg-surface-card dark:text-text-primary mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none">
                            <option value="allow">{{ $lang.allow || 'Allow' }}</option>
                            <option value="deny">{{ $lang.deny || 'Deny' }}</option>
                        </select>
                    </div>

                    <!-- Entity (if applicable) -->
                    <div>
                        <label class="dark:text-text-secondary block text-sm font-medium text-gray-700">
                            {{ $lang.entityCode || 'Entity Code (Optional)' }}
                        </label>
                        <input
                            v-model="override.scope"
                            type="number"
                            :placeholder="$lang.selectEntityCode || 'Enter entity code'"
                            @input="
                                (e) =>
                                    updatePermissionOverride(index, {
                                        scope: Number((e.target as HTMLInputElement).value)
                                    })
                            "
                            class="dark:border-border-strong dark:bg-surface-card dark:text-text-primary mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none" />
                    </div>

                    <!-- Entity ID (if applicable) -->
                    <div>
                        <label class="dark:text-text-secondary block text-sm font-medium text-gray-700">
                            {{ $lang.entityId || 'Entity (Optional)' }}
                        </label>
                        <input
                            v-model="override.scope_id"
                            type="number"
                            :placeholder="$lang.selectEntity || 'Selecte entity'"
                            @input="
                                (e) =>
                                    updatePermissionOverride(index, {
                                        scope_id: Number((e.target as HTMLInputElement).value)
                                    })
                            "
                            class="dark:border-border-strong dark:bg-surface-card dark:text-text-primary mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none" />
                    </div>

                    <!-- Remove Button -->
                    <div class="flex justify-end">
                        <button
                            type="button"
                            @click="removePermissionOverride(index)"
                            class="text-sm text-red-600 hover:text-red-800">
                            {{ $lang.remove || 'Remove' }}
                        </button>
                    </div>
                </div>
            </div>

            <div
                v-if="permissionOverridesForm.length === 0"
                class="py-8 text-center text-gray-500">
                {{
                    $lang.noPermissionOverrides ||
                    'No permission overrides assigned yet. Click "Add Permission Override" to assign a permission override.'
                }}
            </div>
        </div>
    </div>
</template>
