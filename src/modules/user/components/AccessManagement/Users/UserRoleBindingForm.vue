<script setup lang="ts">
import { onMounted, watch } from 'vue';

import DateTimePicker from '@/components/common/DateTimePicker.vue';
import type { User } from '@/modules/user/types/AccessManagement/User/UserType';
import UserHeader from '@/modules/user/components/AccessManagement/Users/UserHeader.vue';
import { useUserRoleBinding } from '@/modules/user/composables/AccessManagement/User/useUserRoleBinding';

import MainSelect from '@/components/common/MainSelect.vue';

const {
    userRoleBindingform,
    validationErrors,
    isRoleLoading,
    selectedUser,
    isAssigned,
    isRoleBindingDirty,
    clearRoleBindingForm,
    roles,
    fetchRoles,
    assignRoleToUser
} = useUserRoleBinding();

const emit = defineEmits(['roleAssigned']);
const props = defineProps<{
    user?: User | null;
}>();

defineExpose({ isDirty: isRoleBindingDirty, clearChanges: clearRoleBindingForm });

onMounted(() => {
    fetchRoles();
    if (props.user) {
        selectedUser.value = props.user;
    }
});

watch(isAssigned, (newVal) => {
    if (newVal === true) {
        emit('roleAssigned');
        isAssigned.value = false;
    }
});

watch(
    () => props.user,
    (newUser) => {
        if (newUser) {
            selectedUser.value = newUser;
        }
    }
);
</script>

<template>
    <div class="py-4">
        <div v-if="selectedUser">
            <form
                v-if="selectedUser.id"
                class="space-y-6"
                @submit.prevent="assignRoleToUser(selectedUser.id, userRoleBindingform)">
                <UserHeader
                    cssClass="border border-schedule-tertiary rounded-lg p-4 bg-schedule-primary dark:border-border-default dark:bg-surface-card"
                    :photo="selectedUser.photo"
                    :full_name="selectedUser.full_name"
                    :email="selectedUser.email"
                    :state="selectedUser.state"
                    :status="selectedUser.status" />

                <div class="dark:border-border-default rounded-lg border border-gray-300 p-4">
                    <h3 class="mb-3 text-sm font-medium uppercase">{{ $lang.validityPeriod }}</h3>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <MainSelect
                            :labelText="$lang.role || 'Role'"
                            :isRequired="true"
                            :loading="isRoleLoading"
                            v-model="userRoleBindingform.role_id"
                            :options="roles"
                            option-value="id"
                            option-label="name"
                            :placeholder="$lang.selectRole || 'Select Role'" />

                        <DateTimePicker
                            v-model="userRoleBindingform.starts_at"
                            :labelText="$lang.startsAt || 'Starts At'"
                            :placeholder="$lang.startsAt"
                            :invalid="!!validationErrors.starts_at"
                            :message="validationErrors.starts_at || ''"
                            messageType="error"
                            class="w-full" />

                        <DateTimePicker
                            v-model="userRoleBindingform.ends_at"
                            :labelText="$lang.endsAt || 'Ends At'"
                            :placeholder="$lang.endsAt"
                            :invalid="!!validationErrors.ends_at"
                            :message="validationErrors.ends_at || ''"
                            messageType="error"
                            class="w-full" />
                    </div>
                </div>
            </form>

            <div v-else>
                <p>{{ $lang.inValidUser || 'Invalid User' }}</p>
            </div>
        </div>

        <div
            v-else
            class="py-8 text-center">
            <p>{{ $lang.noUserSelected || 'No User Selected' }}</p>
        </div>
    </div>
</template>
