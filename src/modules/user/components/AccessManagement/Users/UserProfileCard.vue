<script setup lang="ts">
import { computed } from 'vue';
import Badge from '@/components/common/Badge.vue';
import { STATE_INACTIVE } from '@/constants/statusOptions';
import { toCapitalizedWords } from '@/utils/commonUtils';
import type { User } from '@/modules/user/types/AccessManagement/User/UserType';

const props = defineProps<{
    user: User;
}>();

const isInactive = computed(() => props.user.state === STATE_INACTIVE);
const roleLabel = computed(() => props.user.roles?.[0]?.name ?? '');
const initials = computed(() => {
    const name = props.user.full_name?.trim() ?? '';
    return (name.charAt(0) + (name.charAt(1) || '')).toUpperCase();
});
</script>

<template>
    <div class="w-full">
        <div class="flex flex-col gap-10 px-8 pt-6 pb-10">
            <div class="flex items-center gap-5">
                <img
                    v-if="user.photo"
                    :src="user.photo"
                    :alt="user.full_name"
                    class="h-14 w-14 shrink-0 rounded-full object-cover" />
                <div
                    v-else
                    class="bg-surface-subtle text-text-tertiary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold">
                    {{ initials || '—' }}
                </div>

                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-3">
                        <h2 class="text-schedule-text-primary dark:text-text-primary truncate text-xl font-semibold">
                            {{ toCapitalizedWords(user.full_name) || user.email }}
                        </h2>
                        <Badge
                            outlined
                            size="sm"
                            :variant="isInactive ? 'light' : 'success'"
                            :label="isInactive ? $lang.inactive || 'Inactive' : $lang.active || 'Active'" />
                    </div>
                    <p
                        v-if="roleLabel"
                        class="text-schedule-text-tertiary dark:text-text-tertiary mt-1 truncate text-base">
                        {{ roleLabel }}
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div class="min-w-0">
                    <p class="text-schedule-text-primary dark:text-text-primary truncate text-base font-semibold">
                        {{ user.detail?.gender_ || '-' }}
                    </p>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary mt-1 text-base">
                        {{ $lang.gender || 'Gender' }}
                    </p>
                </div>

                <div class="min-w-0">
                    <p class="text-schedule-text-primary dark:text-text-primary truncate text-base font-semibold">
                        {{ user.detail?.birth_date || '-' }}
                    </p>
                    <p class="text-schedule-text-tertiary dark:text-text-tertiary mt-1 text-base">
                        {{ $lang.dob || 'Date of birth' }}
                    </p>
                </div>

                <div class="min-w-0">
                    <p
                        :title="user.email"
                        class="text-text-primary truncate text-base font-semibold">
                        {{ user.email || '-' }}
                    </p>
                    <p class="text-text-tertiary mt-1 text-base">{{ $lang.email || 'Email' }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
