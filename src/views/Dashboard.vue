<script setup lang="ts">
import { useAuthStore } from '@/modules/user/store/authStore';

const authStore = useAuthStore();
</script>

<template>
    <div class="space-y-6">
        <div class="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Welcome{{ authStore.user?.first_name ? `, ${authStore.user.first_name}` : '' }}
            </h1>
            <p class="mt-2 text-gray-500 dark:text-gray-400">
                This is the Schedule starter dashboard. Use the sidebar to manage users, roles,
                permissions and dynamic values.
            </p>
        </div>
    </div>
</template>
