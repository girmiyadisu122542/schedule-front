<script setup lang="ts">
import Badge from '@/components/common/Badge.vue';
import MainButton from '@/components/common/MainButton.vue';
import CopyIcon from '@/assets/icons/CopyIcon.vue';
import type { Status } from '@/types/CommonTypes';
import { useCommonData } from '@/composables/common/useCommonData';
import { toCapitalizedWords, truncate } from '@/utils/commonUtils';
import { STATUS_PENDING, STATUS_REJECTED } from '@/constants/statusOptions';
import type { Role } from '@/modules/user/types/AccessManagement/User/UserType';

interface Props {
    photo?: string;
    full_name?: string;
    email: string;
    status?: Status;
    state?: number | null | undefined;
    cssClass?: string;
    roles?: Role[];
}

const props = defineProps<Props>();
const { copy } = useCommonData();
const variant =
    props.status?.id === STATUS_PENDING ? 'light' : props.status?.id === STATUS_REJECTED ? 'error' : 'success';
</script>

<template>
    <div
        :class="[
            'flex flex-col items-center justify-between gap-4 sm:flex-row',
            props.cssClass ? props.cssClass : 'dark:border-border-default border-b border-gray-200 pb-4'
        ]">
        <div class="flex items-center gap-2">
            <img
                v-if="photo"
                :src="photo"
                class="h-10 w-10 rounded-full object-cover" />
            <div
                v-else-if="full_name"
                class="dark:bg-surface-subtle dark:text-text-primary flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                {{ full_name.charAt(0).toUpperCase() }}{{ full_name.charAt(1).toUpperCase() }}
            </div>

            <div>
                <h2 class="dark:text-text-primary text-sm font-medium text-gray-900">
                    {{ toCapitalizedWords(full_name) }}
                </h2>
                <div class="flex items-center gap-1">
                    <p
                        :title="email"
                        class="dark:text-text-tertiary text-sm font-normal text-gray-600">
                        {{ truncate(email, 17) }}
                    </p>
                    <MainButton
                        v-if="email"
                        ghost
                        @click="copy(email)"
                        :icon="CopyIcon"
                        class="dark:text-text-tertiary dark:hover:text-text-secondary text-gray-400 hover:text-gray-600" />
                </div>
            </div>
        </div>

        <div
            v-if="roles && roles.length > 0"
            class="flex items-start justify-center text-sm">
            <span class="mr-2">{{ $lang.role || 'User Role' }}</span>
            <div
                v-for="(role, index) in roles"
                :key="index">
                <Badge
                    v-if="role.name"
                    :label="role.name ?? 'Role Name'"
                    :variant="'primary'"
                    class="mr-2"
                    outlined />
            </div>
        </div>

        <div
            v-if="status"
            class="text-sm">
            <Badge
                v-if="state || variant"
                outlined
                :variant="!state ? variant : state === 0 ? 'light' : 'success'"
                :label-text="$lang.status || 'Status'"
                :label="
                    !state ? status.name : state === 0 ? ($lang.inactive ?? 'Inactive') : ($lang.active ?? 'Active')
                " />

            <div v-else>
                {{ state }}
                <span
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    :class="`bg-${status.color}-100 text-${status.color}-600`">
                    {{ status.name }}
                </span>
            </div>
        </div>
    </div>
</template>
