<script setup lang="ts">
import type { Role } from '@/modules/user/types/AccessManagement/role';
import { useUserRoleBindings } from '@/modules/user/composables/AccessManagement/User/useUserRoleBinding';
import { type UserRoleBinding } from '@/modules/user/schemas/AccessManagement/User/userRoleBindingSchema';
const props = defineProps<{
    roleBindings: UserRoleBinding[];
    availableRoles: Role[];
    userId?: number;
}>();

const emit = defineEmits<{
    'update:roleBindings': [bindings: UserRoleBinding[]];
}>();

const { roleBindingsForm, removeRoleBinding, updateRoleBinding } = useUserRoleBindings(props, emit);
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-4">
            <div
                v-for="(binding, index) in roleBindingsForm"
                :key="index"
                class="dark:border-border-default rounded-lg border border-gray-200 p-4">
                <div class="space-y-4">
                    <!-- Role Selection -->
                    <div>
                        <label class="dark:text-text-secondary block text-sm font-medium text-gray-700">
                            {{ $lang.role || 'Role' }}
                        </label>
                        <select
                            v-model="binding.role_id"
                            @change="
                                (e) =>
                                    updateRoleBinding(index, { role_id: Number((e.target as HTMLSelectElement).value) })
                            "
                            class="dark:border-border-strong dark:bg-surface-card dark:text-text-primary mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none">
                            <option value="">{{ $lang.selectRole || 'Select Role' }}</option>
                            <option
                                v-for="role in availableRoles"
                                :key="role.id"
                                :value="role.id">
                                {{ role.name }}
                            </option>
                        </select>
                    </div>

                    <!-- Remove Button -->
                    <div class="flex justify-end">
                        <button
                            type="button"
                            @click="removeRoleBinding(index)"
                            class="text-sm text-red-600 hover:text-red-800">
                            {{ $lang.remove || 'Remove' }}
                        </button>
                    </div>
                </div>
            </div>

            <div
                v-if="roleBindingsForm.length === 0"
                class="py-8 text-center text-gray-500">
                {{ $lang.noRolesAssigned || 'No roles assigned yet. Click "Add Role" to assign a role.' }}
            </div>
        </div>
    </div>
</template>
