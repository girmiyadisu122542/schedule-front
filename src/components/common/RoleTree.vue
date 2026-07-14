<script setup lang="ts">
import { ref } from 'vue';
import type { Role } from '@/modules/user/types/AccessManagement/User/UserType';

const props = defineProps<{
    roles?: Role[];
    onEdit?: (role: Role) => void;
    onDelete?: (role: Role) => void;
}>();

const expanded = ref<Record<string | number, boolean>>({});

const toggle = (id: string | number) => {
    expanded.value[id] = !expanded.value[id];
};
const isExpanded = (id: string | number) => !!expanded.value[id];
</script>

<template>
    <ul
        v-if="roles && roles.length"
        class="space-y-2 text-sm">
        <li
            v-for="role in roles"
            :key="role.id"
            class="relative">
            <div
                class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:shadow-lg">
                <!-- Left side: Role info -->
                <div class="flex items-center gap-3">
                    <!-- Role name + scope -->
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {{ role.name }}
                        </span>
                        <small class="text-xs text-gray-500 dark:text-gray-400">
                            {{ role.scope_name }} {{ role.model_name ? ` - ${role.model_name}` : '' }}
                        </small>
                    </div>

                    <!-- Descendants Badge -->
                    <span
                        v-if="role.include_descendants !== undefined"
                        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                        :class="
                            role.include_descendants
                                ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400'
                        "
                        :title="
                            role.include_descendants
                                ? 'This role includes permissions for its descendants'
                                : 'This role does not include descendant permissions'
                        ">
                        <svg
                            v-if="role.include_descendants"
                            class="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 16 16">
                            <path
                                d="M13.485 3.929a1 1 0 0 1 0 1.414l-6.364 6.364a1 1 0 0 1-1.414 0l-2.121-2.121a1 1 0 1 1 1.414-1.414l1.414 1.414 5.657-5.657a1 1 0 0 1 1.414 0z" />
                        </svg>
                        <svg
                            v-else
                            class="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            viewBox="0 0 16 16">
                            <path
                                d="M4 8h8"
                                stroke-linecap="round" />
                        </svg>
                        <span>{{ role.include_descendants ? $lang.includesDescendants : $lang.noDescendants }}</span>
                    </span>

                    <!-- Expand / Collapse -->
                    <button
                        v-if="role.has_descendants"
                        @click="toggle(role.id)"
                        class="flex h-6 w-6 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        :aria-expanded="isExpanded(role.id)"
                        :title="isExpanded(role.id) ? 'Collapse children' : 'Expand children'">
                        <i :class="isExpanded(role.id) ? 'fa-solid fa-angle-up' : 'fa-solid fa-angle-down'"></i>
                    </button>
                </div>
            </div>

            <!-- Recursive Children -->
            <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-screen"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 max-h-screen"
                leave-to-class="opacity-0 max-h-0">
                <div
                    v-if="role.has_descendants && isExpanded(role.id)"
                    class="overflow-hidden">
                    <RoleTree
                        :roles="role.descendants"
                        class="mt-2 ml-6 border-l-2 border-gray-200 pl-3 dark:border-gray-600" />
                </div>
            </transition>
        </li>
    </ul>
    <div
        v-else
        class="p-4 text-center text-gray-500">
        {{ $lang.noRolesAssigned }}
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}
</style>
