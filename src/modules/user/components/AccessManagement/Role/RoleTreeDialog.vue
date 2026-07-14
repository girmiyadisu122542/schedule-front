<script setup lang="ts">
import RoleTree from '@/components/common/RoleTree.vue';
import MainDialog from '@/components/common/MainDialog.vue';
import type { Role } from '@/modules/user/types/AccessManagement/User/UserType';
import { useUserRoleBinding } from '@/modules/user/composables/AccessManagement/User/useUserRoleBinding';

defineProps<{
    roles?: Role[];
    onEdit?: (role: Role) => void;
    onDelete?: (role: Role) => void;
}>();

const { showRoleTreeDialog } = useUserRoleBinding();
</script>

<template>
    <MainDialog
        :visible="showRoleTreeDialog"
        :plain-background="true"
        :header="$lang.userRoles"
        rounded
        maxWidth="max-w-2xl pb-4"
        @update:visible="showRoleTreeDialog = $event">
        <RoleTree
            v-if="roles && roles.length"
            :roles="roles"
            :on-edit="onEdit"
            :on-delete="onDelete" />
        <div
            v-else
            class="dark:text-text-tertiary p-4 text-center text-gray-500">
            {{ $lang.noRolesAssignedToUser || 'No roles available.' }}
        </div>
    </MainDialog>
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
