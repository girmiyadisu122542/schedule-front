<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';

import CheckBox from '@/components/common/CheckBox.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

import GroupTreeNode from '@/modules/user/components/AccessManagement/Role/GroupTreeNode.vue';
import { usePermission } from '@/modules/user/composables/AccessManagement/permission/usePermission';
import PermissionDialog from '@/modules/user/components/AccessManagement/Permission/PermissionDialog.vue';
import PermissionGroupDialog from '@/modules/user/components/AccessManagement/Permission/PermissionGroupDialog.vue';
import PermissionGroupDetail from '@/modules/user/components/AccessManagement/Permission/PermissionGroupDetail.vue';
import PermissionDetail from '@/modules/user/components/AccessManagement/Permission/PermissionDetail.vue';
import { PAGINATION_OPTIONS, ACTIVE_STATUS } from '@/config/appConfig';

const {
    isLoading,
    isSaving,
    searchQuery,
    limit,
    permissionGroups,
    selectedGroupId,
    selectedGroup,
    permissions,
    selectedPermissions,
    isAllSelected,
    modules,
    groupDialogVisible,
    permDialogVisible,
    groupDetailVisible,
    permDetailVisible,
    selectedPermDetail,
    isEditingGroup,
    isEditingPerm,
    selectedGroupDetail,
    groupForm,
    permForm,
    groupFormErrors,
    permFormErrors,
    confirmGroupDeleteVisible,
    isDeletingGroup,
    confirmPermDeleteVisible,
    isDeletingPerm,
    fetchPermissionGroups,
    fetchPermissions,
    fetchModules,
    selectGroup,
    toggleSelectAll,
    togglePermission,
    openCreateGroup,
    saveGroup,
    openCreatePermission,
    openEditPermission,
    savePermission,
    confirmGroupDelete,
    openPermDeleteConfirm,
    confirmPermDelete,
    getGroupActions,
    getPermissionActions,
    permissionSearch,
    handlePermissionSearch,
    permFilterFields,
    permFilters,
    handlePermFilterChange,
    clearPermissionSelection,
    isBulkProcessing,
    bulkDeleteConfirmVisible,
    bulkActivatePermissions,
    bulkDeactivatePermissions,
    initiateBulkDelete,
    confirmBulkDelete,
    confirmState
} = usePermission();
const initials = (name: string) =>
    name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

const expandedGroups = ref<Set<number>>(new Set());
const toggleExpand = (id: number) => {
    const next = new Set(expandedGroups.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedGroups.value = next;
};

const groupTree = computed(() => {
    const flat = permissionGroups.value.data;
    const map = new Map<number, any>();
    const roots: any[] = [];
    flat.forEach((g: any) => map.set(g.id, { ...g, children: [] }));
    flat.forEach((g: any) => {
        const node = map.get(g.id)!;
        if (g.permission_group_id && map.has(g.permission_group_id)) {
            map.get(g.permission_group_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
});

const filteredTree = computed(() => {
    if (!searchQuery.value) return groupTree.value;
    const q = searchQuery.value.toLowerCase();
    const filterNodes = (nodes: any[]): any[] =>
        nodes.flatMap((n) => {
            const match = n.name.toLowerCase().includes(q);
            const filteredChildren = filterNodes(n.children ?? []);
            if (match || filteredChildren.length) return [{ ...n, children: filteredChildren }];
            return [];
        });
    return filterNodes(groupTree.value);
});

const showFilters = ref(false);
const activeFilterCount = computed(
    () =>
        Object.keys(permFilters.value).filter(
            (k) => permFilters.value[k] !== undefined && permFilters.value[k] !== null && permFilters.value[k] !== ''
        ).length
);

const groupCount = (group: any): string => String(group.permissions_count ?? 0);

const perPageOptions = PAGINATION_OPTIONS.map((v) => ({ label: String(v), value: v }));

const onPerPageChange = (val: number) => {
    limit.value = val;
    fetchPermissions({ page: 1, perPage: val });
};

onMounted(async () => {
    await Promise.all([fetchPermissionGroups(), fetchModules()]);
    if (selectedGroupId.value) fetchPermissions();
});
</script>

<template>
    <div class="flex flex-col gap-4 lg:flex-row">
        <div
            class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card w-full shrink-0 rounded-2xl border bg-white p-4 lg:w-96">
            <div class="mb-3 flex items-center justify-between">
                <h3 class="text-schedule-text-primary dark:text-text-primary text-base font-semibold">
                    {{ $lang.permissionGroup }}
                </h3>
                <button
                    v-if="$can('createPermissionGroup')"
                    @click="openCreateGroup"
                    class="border-schedule-border-primary text-schedule-text-primary hover:border-schedule-brand-blue hover:text-schedule-brand-blue dark:border-border-strong dark:bg-surface-card dark:text-text-secondary flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-sm font-semibold transition-all">
                    <i class="fa-solid fa-plus text-xs"></i>
                    {{ $lang.addNewGroup }}
                </button>
            </div>

            <div class="relative mb-3">
                <i
                    class="fa-solid fa-magnifying-glass text-schedule-text-tertiary dark:text-text-tertiary absolute top-1/2 left-3 -translate-y-1/2 text-xs"></i>
                <input
                    v-model="searchQuery"
                    :placeholder="$lang.search"
                    class="border-schedule-border-primary text-schedule-text-primary placeholder:text-schedule-text-tertiary dark:border-border-strong dark:bg-surface-card dark:text-text-secondary dark:placeholder:text-text-muted w-full rounded-lg border bg-white py-2 pr-3 pl-8 text-sm focus:outline-none" />
            </div>

            <div
                class="overflow-y-auto"
                style="max-height: 520px">
                <div
                    v-for="node in filteredTree"
                    :key="node.id">
                    <div
                        :class="
                            selectedGroupId === node.id
                                ? 'bg-schedule-brand-blue-subtle text-schedule-brand-blue font-semibold dark:bg-blue-900/20'
                                : 'text-schedule-text-primary hover:bg-schedule-neutral-100 dark:text-text-secondary dark:hover:bg-surface-hover'
                        "
                        class="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                        @click="selectGroup(node.id)">
                        <div class="flex min-w-0 items-center gap-1.5">
                            <i
                                v-if="node.children?.length"
                                @click.stop="toggleExpand(node.id)"
                                :class="expandedGroups.has(node.id) ? 'fa-chevron-down' : 'fa-chevron-right'"
                                class="fa-solid text-schedule-text-tertiary dark:text-text-tertiary w-3 shrink-0 cursor-pointer text-xs"></i>
                            <i
                                v-else
                                class="w-3 shrink-0"></i>
                            <span class="truncate">{{ node.name }}</span>
                        </div>
                        <div class="ml-2 flex shrink-0 items-center gap-2">
                            <span
                                class="bg-surface-subtle text-text-secondary rounded-full px-2 py-0.5 text-xs font-semibold">
                                {{ groupCount(node) }}
                            </span>
                            <div @click.stop>
                                <ActionMenu :options="getGroupActions(node)" />
                            </div>
                        </div>
                    </div>
                    <div
                        v-if="node.children?.length && expandedGroups.has(node.id)"
                        class="ml-4">
                        <GroupTreeNode
                            :nodes="node.children"
                            :selected-group-id="selectedGroupId"
                            :expanded-groups="expandedGroups"
                            :depth="1"
                            :granted-count="groupCount"
                            count-color="text-text-secondary"
                            count-bg="bg-surface-subtle"
                            selected-color="bg-schedule-brand-blue-subtle text-schedule-brand-blue dark:bg-blue-900/20"
                            :get-actions="getGroupActions"
                            @select="selectGroup($event)"
                            @toggle="toggleExpand($event)" />
                    </div>
                </div>
            </div>
        </div>

        <div
            class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card flex-1 rounded-2xl border bg-white p-4">
            <template v-if="selectedGroup">
                <div
                    class="border-schedule-border-subtle dark:border-border-default mb-4 flex items-center justify-between border-b pb-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="bg-schedule-brand-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                            {{ initials(selectedGroup.name) }}
                        </div>
                        <div>
                            <p class="text-schedule-text-primary dark:text-text-primary text-base font-bold">
                                {{ selectedGroup.name }}
                            </p>
                            <p class="text-schedule-text-tertiary dark:text-text-tertiary text-sm">
                                {{ permissions.pagination?.total ?? permissions.data.length }}
                                {{ $lang.permissionCreated }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="mb-4 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 pl-4">
                        <CheckBox
                            :model-value="isAllSelected"
                            :binary="true"
                            size="normal"
                            @update:model-value="toggleSelectAll" />
                        <span
                            class="text-schedule-brand-blue cursor-pointer text-sm font-semibold"
                            @click="toggleSelectAll">
                            {{ $lang.selectAll }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <i
                                class="fa-solid fa-magnifying-glass text-schedule-text-tertiary dark:text-text-tertiary absolute top-1/2 left-3 -translate-y-1/2 text-xs"></i>
                            <input
                                :value="permissionSearch"
                                @input="handlePermissionSearch(($event.target as HTMLInputElement).value)"
                                :placeholder="$lang.searchPermissions || $lang.search"
                                class="border-schedule-border-primary text-schedule-text-primary placeholder:text-schedule-text-tertiary dark:border-border-strong dark:bg-surface-card dark:text-text-secondary dark:placeholder:text-text-muted w-44 rounded-lg border bg-white py-1.5 pr-3 pl-8 text-sm focus:outline-none sm:w-56" />
                        </div>
                        <button
                            v-if="permFilterFields.length > 0"
                            @click="showFilters = !showFilters"
                            :class="[
                                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all',
                                showFilters
                                    ? 'border-schedule-brand-blue text-schedule-brand-blue bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-schedule-border-primary text-schedule-text-primary hover:bg-schedule-neutral-50 dark:border-border-strong dark:text-text-secondary dark:hover:bg-surface-hover'
                            ]">
                            <i class="fa-solid fa-filter text-xs"></i>
                            {{ showFilters ? $lang.hideFilter || 'Hide Filter' : $lang.filter || 'Filter' }}
                            <span
                                v-if="activeFilterCount > 0"
                                class="bg-schedule-brand-blue flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white">
                                {{ activeFilterCount }}
                            </span>
                        </button>
                        <button
                            v-if="$can('createPermission')"
                            @click="openCreatePermission"
                            class="text-schedule-brand-blue hover:text-schedule-brand-blue-hover flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all">
                            <i class="fa-solid fa-plus text-xs"></i>
                            {{ $lang.addNewPermission }}
                        </button>
                    </div>
                </div>

                <div
                    v-if="showFilters && permFilterFields.length > 0"
                    class="border-schedule-border-subtle dark:border-border-default mb-4 border-b pb-4">
                    <div class="flex flex-wrap items-end gap-3">
                        <div
                            v-for="filter in permFilterFields"
                            :key="filter.key"
                            class="min-w-40 flex-1">
                            <MainSelect
                                :modelValue="permFilters[filter.key] || null"
                                :options="filter.options"
                                :placeholder="`${$lang.all || 'All'} ${filter.label}s`"
                                :labelText="filter.label"
                                optionLabel="label"
                                optionValue="value"
                                size="small"
                                variant="outlined"
                                :showClear="!!permFilters[filter.key]"
                                @update:modelValue="
                                    (val) => handlePermFilterChange({ ...permFilters, [filter.key]: val || undefined })
                                "
                                @clear="() => handlePermFilterChange({ ...permFilters, [filter.key]: undefined })" />
                        </div>
                    </div>
                    <div
                        v-if="activeFilterCount > 0"
                        class="mt-3 flex justify-end">
                        <button
                            @click="handlePermFilterChange({})"
                            class="text-schedule-brand-blue flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80">
                            <i class="fa-solid fa-xmark"></i>
                            {{ $lang.resetFilter || 'Reset Filter' }}
                        </button>
                    </div>
                </div>

                <!-- Contextual bulk-action toolbar -->
                <div
                    v-if="selectedPermissions.size > 0"
                    class="border-schedule-brand-blue/30 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-blue-50/60 px-4 py-2 dark:bg-blue-900/15">
                    <span class="text-schedule-brand-blue text-sm font-semibold">
                        {{ selectedPermissions.size }} {{ $lang.selected || 'selected' }}
                    </span>
                    <div class="flex flex-wrap items-center gap-2">
                        <button
                            v-if="$can('changePermissionStatus')"
                            :disabled="isBulkProcessing"
                            @click="bulkActivatePermissions"
                            class="border-border-default text-text-secondary hover:bg-surface-hover dark:bg-surface-card rounded-md border bg-white px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50">
                            {{ $lang.activate || 'Activate' }}
                        </button>
                        <button
                            v-if="$can('changePermissionStatus')"
                            :disabled="isBulkProcessing"
                            @click="bulkDeactivatePermissions"
                            class="border-border-default text-text-secondary hover:bg-surface-hover dark:bg-surface-card rounded-md border bg-white px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50">
                            {{ $lang.deactivate || 'Deactivate' }}
                        </button>
                        <button
                            v-if="$can('deletePermission')"
                            :disabled="isBulkProcessing"
                            @click="initiateBulkDelete"
                            class="dark:bg-surface-card rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:hover:bg-red-900/20">
                            {{ $lang.delete || 'Delete' }}
                        </button>
                        <button
                            :disabled="isBulkProcessing"
                            @click="clearPermissionSelection"
                            class="text-text-tertiary hover:text-text-primary px-2 py-1 text-xs font-medium disabled:opacity-50">
                            {{ $lang.clear || 'Clear' }}
                        </button>
                    </div>
                </div>

                <div
                    v-if="isLoading"
                    class="flex justify-center py-8">
                    <div
                        class="border-schedule-brand-blue h-6 w-6 animate-spin rounded-full border-4 border-t-transparent"></div>
                </div>
                <div
                    v-else
                    class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div
                        v-for="perm in permissions.data"
                        :key="perm.id"
                        class="border-border-subtle hover:border-schedule-brand-blue/40 hover:bg-surface-subtle group flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors">
                        <CheckBox
                            :model-value="selectedPermissions.has(perm.id)"
                            :binary="true"
                            size="normal"
                            @update:model-value="() => togglePermission(perm.id)" />
                        <span class="text-text-primary flex-1 truncate text-sm font-medium">
                            {{ perm.name }}
                        </span>
                        <span
                            :class="
                                Number(perm.state) === ACTIVE_STATUS
                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : 'dark:bg-surface-subtle dark:text-text-secondary bg-gray-100 text-gray-600'
                            "
                            class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                            {{
                                Number(perm.state) === ACTIVE_STATUS
                                    ? $lang.active || 'Active'
                                    : $lang.inactive || 'Inactive'
                            }}
                        </span>
                        <div
                            class="shrink-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                            @click.stop>
                            <ActionMenu :options="getPermissionActions(perm)" />
                        </div>
                    </div>
                </div>

                <div
                    class="border-schedule-border-subtle dark:border-border-default mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <div class="dark:text-text-tertiary flex items-center gap-3 text-sm text-gray-500">
                        <span>
                            {{ $lang.showing || 'Showing' }}
                            {{ permissions.pagination?.from ?? 1 }}
                            {{ $lang.to || 'to' }}
                            {{ permissions.pagination?.to ?? permissions.data.length }}
                            {{ $lang.of || 'of' }}
                            {{ permissions.pagination?.total ?? permissions.data.length }}
                            {{ $lang.entries || 'entries' }}
                        </span>
                        <div class="flex items-center gap-2">
                            <span>{{ $lang.perPage || 'Per Page:' }}</span>
                            <MainSelect
                                :modelValue="limit"
                                :options="perPageOptions"
                                size="small"
                                variant="outlined"
                                class="w-20"
                                @update:modelValue="onPerPageChange" />
                        </div>
                    </div>
                    <div
                        class="dark:border-border-strong flex items-center overflow-hidden rounded-lg border border-gray-300">
                        <button
                            :disabled="!permissions.pagination || permissions.pagination.current_page <= 1"
                            @click="fetchPermissions({ page: (permissions.pagination?.current_page ?? 1) - 1 })"
                            :class="[
                                'dark:border-border-strong flex items-center gap-1 border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all',
                                !permissions.pagination || permissions.pagination.current_page <= 1
                                    ? 'dark:bg-surface-card dark:text-text-muted cursor-not-allowed bg-white text-gray-300'
                                    : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                            ]">
                            <i class="fa-solid fa-chevron-left text-xs"></i>
                            <span>{{ $lang.previous || 'Previous' }}</span>
                        </button>

                        <template v-if="permissions.pagination">
                            <button
                                v-for="p in permissions.pagination.last_page"
                                :key="p"
                                @click="fetchPermissions({ page: p })"
                                :class="[
                                    'dark:border-border-strong border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all',
                                    p === permissions.pagination.current_page
                                        ? 'bg-schedule-brand-blue text-white'
                                        : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                                ]">
                                {{ p }}
                            </button>
                        </template>

                        <button
                            :disabled="
                                !permissions.pagination ||
                                permissions.pagination.current_page >= permissions.pagination.last_page
                            "
                            @click="fetchPermissions({ page: (permissions.pagination?.current_page ?? 1) + 1 })"
                            :class="[
                                'flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all',
                                !permissions.pagination ||
                                permissions.pagination.current_page >= permissions.pagination.last_page
                                    ? 'dark:bg-surface-card dark:text-text-muted cursor-not-allowed bg-white text-gray-300'
                                    : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                            ]">
                            <span>{{ $lang.next || 'Next' }}</span>
                            <i class="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                    </div>
                </div>
            </template>

            <div
                v-else
                class="text-schedule-text-tertiary dark:text-text-muted flex h-40 items-center justify-center text-sm">
                {{ $lang.selectGroupToViewPermissions }}
            </div>
        </div>
    </div>

    <PermissionGroupDialog
        v-model:visible="groupDialogVisible"
        :is-editing="isEditingGroup"
        :is-saving="isSaving"
        :form="groupForm"
        :errors="groupFormErrors"
        :groups="permissionGroups.data"
        @save="saveGroup" />

    <PermissionDialog
        v-model:visible="permDialogVisible"
        :is-editing="isEditingPerm"
        :is-saving="isSaving"
        :form="permForm"
        :errors="permFormErrors"
        :groups="permissionGroups.data"
        :modules="modules"
        @save="savePermission" />

    <PermissionGroupDetail
        v-model:visible="groupDetailVisible"
        :group="selectedGroupDetail" />

    <PermissionDetail
        v-model:visible="permDetailVisible"
        :permission="selectedPermDetail" />

    <ConfirmDialog
        :show="confirmGroupDeleteVisible"
        :title="String($lang.delete)"
        :message="String($lang.confirmDelete)"
        :confirm-label="String($lang.delete)"
        :cancel-label="String($lang.cancel)"
        type="danger"
        :loading="isDeletingGroup"
        @confirm="confirmGroupDelete"
        @update:show="confirmGroupDeleteVisible = $event" />

    <ConfirmDialog
        :show="confirmPermDeleteVisible"
        :title="String($lang.delete)"
        :message="String($lang.confirmDelete)"
        :confirm-label="String($lang.delete)"
        :cancel-label="String($lang.cancel)"
        type="danger"
        :loading="isDeletingPerm"
        @confirm="confirmPermDelete"
        @update:show="confirmPermDeleteVisible = $event" />

    <ConfirmDialog
        :show="bulkDeleteConfirmVisible"
        :title="String($lang.delete)"
        :message="
            String(
                $lang.confirmDeleteSelectedPermissions ||
                    'Delete the selected permissions? Permissions still in use will be skipped.'
            )
        "
        :confirm-label="String($lang.delete)"
        :cancel-label="String($lang.cancel)"
        type="danger"
        :loading="isBulkProcessing"
        @confirm="confirmBulkDelete"
        @update:show="bulkDeleteConfirmVisible = $event" />

    <ConfirmDialog
        v-model:show="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :item-label="confirmState.itemLabel"
        :item-names="confirmState.itemNames"
        :confirm-label="confirmState.confirmLabel"
        :cancel-label="String($lang.cancel)"
        :type="confirmState.type"
        :loading="confirmState.loading"
        @confirm="confirmState.onConfirm" />
</template>
