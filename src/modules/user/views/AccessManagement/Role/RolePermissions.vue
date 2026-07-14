<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainButton from '@/components/common/MainButton.vue';
import InputText from '@/components/common/InputText.vue';
import CheckBox from '@/components/common/CheckBox.vue';
import MonitorIcon from '@/assets/icons/MonitorIcon.vue';
import ShieldProtectedCheckmark from '@/assets/icons/ShieldProtectedCheckmark.vue';
import { useRolePermissions } from '@/modules/user/composables/AccessManagement/role/useRolePermissions';

const route = useRoute();
const roleId = Number(route.params.id);

const {
    isLoading,
    isSaving,
    role,
    filteredGroups,
    selectedGroupId,
    selectedGroup,
    selectedPermissions,
    searchQuery,
    activeTab,
    isAllSelected,
    groupPermissionCount,
    toggleSelectAll,
    togglePermission,
    fetchRolePermissions,
    fetchRoleDetail,
    savePermissions
} = useRolePermissions(roleId);

onMounted(async () => {
    await Promise.all([fetchRolePermissions(), fetchRoleDetail()]);
});
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="space-y-1">
                <Breadcrumb
                    :items="[{ label: $lang.role }, { label: $lang.assignPermission }]"
                    :icon="MonitorIcon" />
                <div class="flex items-center gap-2">
                    <span
                        class="bg-schedule-warning-subtle text-schedule-warning-strong rounded-full px-3 py-0.5 text-xs font-semibold">
                        {{ $lang.notSaved }}
                    </span>
                </div>
            </div>
            <MainButton
                :label="$lang.save"
                severity="primary"
                :loading="isSaving"
                @click="savePermissions" />
        </div>

        <div
            class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card rounded-2xl border bg-white p-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label class="text-schedule-text-secondary dark:text-text-secondary mb-1 block text-sm font-medium">
                        {{ $lang.name }}
                    </label>
                    <InputText
                        :model-value="role?.name ?? ''"
                        placeholder="Enter name"
                        disabled />
                </div>
                <div class="md:col-span-2">
                    <label class="text-schedule-text-secondary dark:text-text-secondary mb-1 block text-sm font-medium">
                        {{ $lang.description }}
                    </label>
                    <textarea
                        disabled
                        :value="role?.description ?? ''"
                        rows="3"
                        placeholder="Enter a description..."
                        class="border-schedule-border-primary text-schedule-text-primary dark:border-border-strong dark:bg-surface-card dark:text-text-secondary w-full rounded-lg border bg-white px-3 py-2 text-sm" />
                </div>
                <div class="flex items-center gap-6">
                    <CheckBox
                        :model-value="role?.unique_per_user ?? false"
                        :binary="true"
                        label="Unique Per User"
                        disabled />
                    <CheckBox
                        :model-value="role?.unique_per_scope ?? false"
                        :binary="true"
                        label="Unique Per Scope"
                        disabled />
                </div>
            </div>
        </div>

        <div
            class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card rounded-2xl border bg-white p-6">
            <div class="mb-4">
                <h2 class="text-schedule-text-primary dark:text-text-primary text-lg font-semibold">
                    {{ $lang.permissionManagement }}
                </h2>
                <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                    {{ $lang.managePermissionGroupAndPermission }}
                </p>
            </div>

            <div class="border-schedule-border-subtle dark:border-border-default mb-6 flex gap-6 border-b">
                <button
                    @click="activeTab = 'permission_group'"
                    :class="
                        activeTab === 'permission_group'
                            ? 'border-schedule-brand-blue text-schedule-brand-blue border-b-2 font-semibold'
                            : 'text-schedule-text-tertiary dark:text-text-tertiary'
                    "
                    class="pb-2 text-sm transition-colors">
                    {{ $lang.permissionGroup }}
                </button>
                <button
                    @click="activeTab = 'module_group'"
                    :class="
                        activeTab === 'module_group'
                            ? 'border-schedule-brand-blue text-schedule-brand-blue border-b-2 font-semibold'
                            : 'text-schedule-text-tertiary dark:text-text-tertiary'
                    "
                    class="pb-2 text-sm transition-colors">
                    {{ $lang.moduleGroup }}
                </button>
            </div>

            <div
                v-if="isLoading"
                class="flex justify-center py-12">
                <div
                    class="border-schedule-brand-blue h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
            </div>

            <div
                v-else
                class="flex gap-4">
                <div
                    class="border-schedule-border-subtle bg-schedule-neutral-50 dark:border-border-default dark:bg-surface-card w-64 shrink-0 rounded-xl border p-3">
                    <h3 class="text-schedule-text-primary dark:text-text-secondary mb-3 text-sm font-semibold">
                        {{ $lang.permissionGroup }}
                    </h3>
                    <InputText
                        v-model="searchQuery"
                        placeholder="Search..."
                        size="small"
                        class="mb-3" />
                    <div
                        class="space-y-1 overflow-y-auto"
                        style="max-height: 400px">
                        <button
                            v-for="group in filteredGroups"
                            :key="group.id"
                            @click="selectedGroupId = group.id"
                            :class="
                                selectedGroupId === group.id
                                    ? 'bg-schedule-brand-blue-subtle text-schedule-brand-blue font-semibold'
                                    : 'text-schedule-text-primary hover:bg-schedule-neutral-100 dark:text-text-secondary dark:hover:bg-surface-hover'
                            "
                            class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors">
                            <span>{{ group.name }}</span>
                            <span class="text-schedule-brand-blue text-xs font-semibold">
                                {{ groupPermissionCount(group) }}
                            </span>
                        </button>
                    </div>
                </div>

                <div
                    class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card flex-1 rounded-xl border bg-white p-4">
                    <template v-if="selectedGroup">
                        <div class="mb-4 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div
                                    class="bg-schedule-brand-blue-subtle flex h-9 w-9 items-center justify-center rounded-lg">
                                    <component
                                        :is="ShieldProtectedCheckmark"
                                        class="text-schedule-brand-blue h-5 w-5" />
                                </div>
                                <div>
                                    <p class="text-schedule-text-primary dark:text-text-primary font-semibold">
                                        {{ selectedGroup.name }}
                                    </p>
                                    <p class="text-schedule-text-tertiary dark:text-text-tertiary text-xs">
                                        {{
                                            selectedGroup.permissions.filter((p) => selectedPermissions.has(p.id))
                                                .length
                                        }}
                                        {{ $lang.permissionGranted }}
                                    </p>
                                </div>
                            </div>
                            <span class="text-schedule-brand-blue text-sm font-semibold">
                                {{ groupPermissionCount(selectedGroup) }}
                            </span>
                        </div>

                        <div class="mb-3">
                            <CheckBox
                                :model-value="isAllSelected"
                                :binary="true"
                                :label="$lang.selectAll"
                                @update:model-value="toggleSelectAll" />
                        </div>

                        <div class="grid grid-cols-3 gap-2">
                            <label
                                v-for="perm in selectedGroup.permissions"
                                :key="perm.id"
                                class="border-schedule-border-subtle hover:bg-schedule-neutral-50 dark:border-border-default dark:hover:bg-surface-hover flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors">
                                <CheckBox
                                    :model-value="selectedPermissions.has(perm.id)"
                                    :binary="true"
                                    size="small"
                                    @update:model-value="() => togglePermission(perm.id)" />
                                <span class="text-schedule-text-primary dark:text-text-secondary text-sm">
                                    {{ perm.name }}
                                </span>
                            </label>
                        </div>
                    </template>
                    <div
                        v-else
                        class="text-schedule-text-tertiary dark:text-text-muted flex h-40 items-center justify-center">
                        {{ $lang.selectGroupToViewPermissions }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
