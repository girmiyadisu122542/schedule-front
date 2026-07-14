<script setup lang="ts">
import { ref, computed } from 'vue';

import { PAGINATION_OPTIONS } from '@/config/appConfig';
import type {
    RolePermissionGroup,
    RoleModuleGroup,
    RoleModule
} from '@/modules/user/types/AccessManagement/rolePermission';

import CheckBox from '@/components/common/CheckBox.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import Setting from '@/assets/icons/Setting.vue';
import GroupTreeNode from '@/modules/user/components/AccessManagement/Role/GroupTreeNode.vue';

const props = defineProps<{
    roleName?: string;
    showBanner?: boolean;

    permissionGroups: RolePermissionGroup[];
    filteredPgTree: RolePermissionGroup[];
    selectedGroupId: number | null;
    selectedGroup: RolePermissionGroup | null;
    pgSearchQuery: string;
    expandedGroups: Set<number>;
    isGroupAllSelected: boolean;
    groupGrantedCount: (g: RolePermissionGroup) => string;

    filteredModuleGroups: RoleModuleGroup[];
    selectedModuleGroupId: number | null;
    selectedModuleGroup: RoleModuleGroup | null;
    selectedModuleId: number | null;
    selectedModule: RoleModule | null;
    expandedModuleGroups: Set<number>;
    mgSearchQuery: string;
    isModuleAllSelected: boolean;
    moduleGrantedCount: (m: RoleModule) => string;
    moduleGroupGrantedCount: (mg: RoleModuleGroup) => string;

    selectedPermissions: Set<number>;
}>();

const emit = defineEmits<{
    (e: 'update:selectedGroupId', id: number): void;
    (e: 'update:selectedModuleGroupId', id: number): void;
    (e: 'update:selectedModuleId', id: number): void;
    (e: 'update:pgSearchQuery', val: string): void;
    (e: 'update:mgSearchQuery', val: string): void;
    (e: 'toggleExpand', id: number): void;
    (e: 'toggleModuleGroup', id: number): void;
    (e: 'togglePermission', id: number): void;
    (e: 'toggleGroupSelectAll'): void;
    (e: 'toggleModuleSelectAll'): void;
}>();

const permTab = ref<'permission_group' | 'module_group'>('permission_group');
const sidebarOpen = ref(false);

const pgCurrentPage = ref(1);
const pgPerPage = ref<number>(PAGINATION_OPTIONS[0] ?? 10);
const mgCurrentPage = ref(1);
const mgPerPage = ref<number>(PAGINATION_OPTIONS[0] ?? 10);

const perPageOptions = PAGINATION_OPTIONS.map((v) => ({ label: String(v), value: v }));

const pgPermissions = computed(() => props.selectedGroup?.permissions ?? []);
const pgTotal = computed(() => pgPermissions.value.length);
const pgLastPage = computed(() => Math.max(1, Math.ceil(pgTotal.value / pgPerPage.value)));
const pgFrom = computed(() => (pgTotal.value === 0 ? 0 : (pgCurrentPage.value - 1) * pgPerPage.value + 1));
const pgTo = computed(() => Math.min(pgCurrentPage.value * pgPerPage.value, pgTotal.value));
const pgPagedPermissions = computed(() =>
    pgPermissions.value.slice((pgCurrentPage.value - 1) * pgPerPage.value, pgCurrentPage.value * pgPerPage.value)
);

const mgPermissions = computed(() => props.selectedModule?.permissions ?? []);
const mgTotal = computed(() => mgPermissions.value.length);
const mgLastPage = computed(() => Math.max(1, Math.ceil(mgTotal.value / mgPerPage.value)));
const mgFrom = computed(() => (mgTotal.value === 0 ? 0 : (mgCurrentPage.value - 1) * mgPerPage.value + 1));
const mgTo = computed(() => Math.min(mgCurrentPage.value * mgPerPage.value, mgTotal.value));
const mgPagedPermissions = computed(() =>
    mgPermissions.value.slice((mgCurrentPage.value - 1) * mgPerPage.value, mgCurrentPage.value * mgPerPage.value)
);

const selectGroup = (id: number) => {
    emit('update:selectedGroupId', id);
    pgCurrentPage.value = 1;
    sidebarOpen.value = false;
};

const selectModule = (mgId: number, mId: number) => {
    emit('update:selectedModuleGroupId', mgId);
    emit('update:selectedModuleId', mId);
    mgCurrentPage.value = 1;
    sidebarOpen.value = false;
};
</script>

<template>
    <div>
        <div class="border-schedule-border-subtle dark:border-border-default mb-4 flex gap-4 border-b sm:mb-6 sm:gap-6">
            <button
                @click="permTab = 'permission_group'"
                :class="
                    permTab === 'permission_group'
                        ? 'border-schedule-brand-blue text-schedule-brand-blue border-b-2 font-semibold'
                        : 'text-schedule-text-tertiary dark:text-text-tertiary'
                "
                class="pb-2 text-xs transition-colors sm:text-sm">
                {{ $lang.permissionGroup }}
            </button>
            <button
                @click="permTab = 'module_group'"
                :class="
                    permTab === 'module_group'
                        ? 'border-schedule-brand-blue text-schedule-brand-blue border-b-2 font-semibold'
                        : 'text-schedule-text-tertiary dark:text-text-tertiary'
                "
                class="pb-2 text-xs transition-colors sm:text-sm">
                {{ $lang.moduleGroup }}
            </button>
        </div>

        <button
            @click="sidebarOpen = !sidebarOpen"
            class="border-schedule-border-subtle bg-schedule-neutral-50 dark:border-border-default dark:bg-surface-card mb-4 flex w-full items-center justify-between rounded-lg border px-4 py-3 lg:hidden">
            <span class="text-schedule-text-primary dark:text-text-secondary text-sm font-medium">
                {{ permTab === 'permission_group' ? $lang.permissionGroup : $lang.moduleGroup }}
            </span>
            <i
                :class="sidebarOpen ? 'fa-chevron-up' : 'fa-chevron-down'"
                class="fa-solid text-schedule-text-tertiary dark:text-text-tertiary text-xs"></i>
        </button>

        <div class="flex flex-col gap-4 lg:flex-row">
            <div
                :class="sidebarOpen ? 'block' : 'hidden lg:block'"
                class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card w-full shrink-0 rounded-xl border bg-white p-3 lg:w-72">
                <h3 class="text-schedule-text-primary dark:text-text-secondary mb-3 text-sm font-semibold">
                    {{ permTab === 'permission_group' ? $lang.permissionGroup : $lang.moduleGroup }}
                </h3>
                <div class="relative mb-3">
                    <i
                        class="fa-solid fa-magnifying-glass text-schedule-text-tertiary dark:text-text-tertiary absolute top-1/2 left-3 -translate-y-1/2 text-xs"></i>
                    <input
                        :value="permTab === 'permission_group' ? pgSearchQuery : mgSearchQuery"
                        @input="
                            permTab === 'permission_group'
                                ? emit('update:pgSearchQuery', ($event.target as HTMLInputElement).value)
                                : emit('update:mgSearchQuery', ($event.target as HTMLInputElement).value)
                        "
                        :placeholder="$lang.search"
                        class="border-schedule-border-primary text-schedule-text-primary placeholder:text-schedule-text-tertiary dark:border-border-strong dark:bg-surface-card dark:text-text-secondary dark:placeholder:text-text-muted w-full rounded-lg border bg-white py-2 pr-3 pl-8 text-sm focus:outline-none" />
                </div>

                <div
                    v-if="permTab === 'permission_group'"
                    class="overflow-y-auto"
                    style="max-height: 420px">
                    <GroupTreeNode
                        :nodes="filteredPgTree"
                        :selected-group-id="selectedGroupId"
                        :expanded-groups="expandedGroups"
                        :granted-count="groupGrantedCount"
                        @select="selectGroup"
                        @toggle="emit('toggleExpand', $event)" />
                </div>

                <div
                    v-else
                    class="space-y-1 overflow-y-auto"
                    style="max-height: 420px">
                    <div
                        v-for="mg in filteredModuleGroups"
                        :key="mg.id">
                        <button
                            @click="emit('toggleModuleGroup', mg.id)"
                            class="hover:bg-schedule-neutral-100 dark:hover:bg-surface-hover flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors"
                            :class="
                                selectedModuleGroupId === mg.id
                                    ? 'text-schedule-brand-blue font-semibold'
                                    : 'text-schedule-text-primary dark:text-text-secondary'
                            ">
                            <div class="flex items-center gap-2">
                                <i
                                    :class="expandedModuleGroups.has(mg.id) ? 'fa-chevron-down' : 'fa-chevron-right'"
                                    class="fa-solid text-schedule-text-tertiary dark:text-text-tertiary w-3 text-xs"></i>
                                <span>{{ mg.name }}</span>
                            </div>
                            <span class="text-schedule-brand-blue text-xs font-semibold">
                                {{ moduleGroupGrantedCount(mg) }}
                            </span>
                        </button>
                        <div
                            v-if="expandedModuleGroups.has(mg.id)"
                            class="ml-4 space-y-0.5">
                            <button
                                v-for="mod in mg.modules"
                                :key="mod.id"
                                @click="selectModule(mg.id, mod.id)"
                                :class="
                                    selectedModuleId === mod.id
                                        ? 'bg-schedule-brand-blue-subtle text-schedule-brand-blue font-semibold'
                                        : 'text-schedule-text-primary hover:bg-schedule-neutral-100 dark:text-text-secondary dark:hover:bg-surface-hover'
                                "
                                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors">
                                <span>{{ mod.name }}</span>
                                <span class="text-schedule-brand-blue text-xs font-semibold">
                                    {{ moduleGrantedCount(mod) }}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="border-schedule-border-subtle dark:border-border-default dark:bg-surface-card flex-1 rounded-xl border bg-white">
                <div
                    v-if="showBanner && roleName"
                    class="border-schedule-brand-blue-subtle bg-schedule-brand-blue-surface dark:border-border-default dark:bg-surface-card flex items-center gap-3 rounded-t-xl border-b px-4 py-3">
                    <component
                        :is="Setting"
                        class="text-schedule-brand-blue h-5 w-5 shrink-0" />
                    <p class="text-schedule-text-secondary dark:text-text-secondary text-xs sm:text-sm">
                        {{ $lang.assigningPermissionsFor }}
                        <span class="text-schedule-brand-blue font-bold">{{ roleName }}</span>
                        {{ $lang.role }}.
                    </p>
                </div>

                <div
                    v-if="permTab === 'permission_group'"
                    class="p-4 sm:p-6">
                    <template v-if="selectedGroup">
                        <div class="mb-5 flex items-center justify-between">
                            <div>
                                <p class="text-schedule-text-primary dark:text-text-primary text-base font-bold">
                                    {{ selectedGroup.name }}
                                </p>
                                <p class="text-schedule-text-tertiary dark:text-text-tertiary mt-0.5 text-sm">
                                    {{ selectedGroup.permissions.filter((p) => selectedPermissions.has(p.id)).length }}
                                    {{ $lang.permissionGranted }}
                                </p>
                            </div>
                            <span class="text-schedule-brand-blue text-sm font-bold">
                                {{ groupGrantedCount(selectedGroup) }}
                            </span>
                        </div>

                        <div class="mb-4 flex items-center gap-3 pl-4">
                            <CheckBox
                                :model-value="isGroupAllSelected"
                                :binary="true"
                                size="normal"
                                @update:model-value="emit('toggleGroupSelectAll')" />
                            <span
                                class="text-schedule-brand-blue cursor-pointer text-sm font-semibold"
                                @click="emit('toggleGroupSelectAll')">
                                {{ $lang.selectAll }}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <label
                                v-for="perm in pgPagedPermissions"
                                :key="perm.id"
                                class="border-schedule-border-subtle hover:bg-schedule-neutral-50 bg-schedule-disabled dark:border-border-default dark:hover:bg-surface-hover flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors dark:bg-gray-700/30">
                                <CheckBox
                                    :model-value="selectedPermissions.has(perm.id)"
                                    :binary="true"
                                    size="normal"
                                    @update:model-value="emit('togglePermission', perm.id)" />
                                <span class="text-schedule-text-primary dark:text-text-secondary text-sm font-medium">
                                    {{ perm.name }}
                                </span>
                            </label>
                        </div>

                        <div
                            class="border-schedule-border-subtle dark:border-border-default mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                            <div class="dark:text-text-tertiary flex items-center gap-3 text-sm text-gray-500">
                                <span>
                                    {{ $lang.showing || 'Showing' }} {{ pgFrom }} {{ $lang.to || 'to' }} {{ pgTo }}
                                    {{ $lang.of || 'of' }} {{ pgTotal }} {{ $lang.entries || 'entries' }}
                                </span>
                                <div class="flex items-center gap-2">
                                    <span class="dark:text-text-tertiary text-sm text-gray-500">
                                        {{ $lang.perPage || 'Per Page:' }}
                                    </span>
                                    <MainSelect
                                        :modelValue="pgPerPage"
                                        :options="perPageOptions"
                                        size="small"
                                        variant="outlined"
                                        class="w-20"
                                        @update:modelValue="
                                            (v) => {
                                                pgPerPage = v;
                                                pgCurrentPage = 1;
                                            }
                                        " />
                                </div>
                            </div>
                            <div
                                class="dark:border-border-strong flex items-center overflow-hidden rounded-lg border border-gray-300">
                                <button
                                    :disabled="pgCurrentPage === 1"
                                    @click="pgCurrentPage--"
                                    :class="[
                                        'dark:border-border-strong flex items-center gap-1 border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all',
                                        pgCurrentPage === 1
                                            ? 'dark:bg-surface-card dark:text-text-muted cursor-not-allowed bg-white text-gray-300'
                                            : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                                    ]">
                                    <i class="fa-solid fa-chevron-left text-xs"></i>
                                    <span>{{ $lang.previous || 'Previous' }}</span>
                                </button>
                                <button
                                    v-for="p in pgLastPage"
                                    :key="p"
                                    @click="pgCurrentPage = p"
                                    :class="[
                                        'dark:border-border-strong border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all',
                                        p === pgCurrentPage
                                            ? 'bg-schedule-brand-blue text-white'
                                            : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                                    ]">
                                    {{ p }}
                                </button>
                                <button
                                    :disabled="pgCurrentPage === pgLastPage"
                                    @click="pgCurrentPage++"
                                    :class="[
                                        'flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all',
                                        pgCurrentPage === pgLastPage
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

                <div
                    v-else
                    class="p-4 sm:p-6">
                    <template v-if="selectedModule">
                        <div class="mb-5 flex items-center justify-between">
                            <div>
                                <p class="text-schedule-text-primary dark:text-text-primary text-base font-bold">
                                    {{ selectedModule.name }}
                                </p>
                                <p class="text-schedule-text-tertiary dark:text-text-tertiary mt-0.5 text-sm">
                                    {{ selectedModule.permissions.filter((p) => selectedPermissions.has(p.id)).length }}
                                    {{ $lang.permissionGranted }}
                                </p>
                            </div>
                            <span class="text-schedule-brand-blue text-sm font-bold">
                                {{ moduleGrantedCount(selectedModule) }}
                            </span>
                        </div>

                        <div class="mb-4 flex items-center gap-3 pl-4">
                            <CheckBox
                                :model-value="isModuleAllSelected"
                                :binary="true"
                                size="normal"
                                @update:model-value="emit('toggleModuleSelectAll')" />
                            <span
                                class="text-schedule-brand-blue cursor-pointer text-sm font-semibold"
                                @click="emit('toggleModuleSelectAll')">
                                {{ $lang.selectAll }}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <label
                                v-for="perm in mgPagedPermissions"
                                :key="perm.id"
                                class="border-schedule-border-subtle hover:bg-schedule-neutral-50 bg-schedule-disabled dark:border-border-default dark:hover:bg-surface-hover flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors dark:bg-gray-700/30">
                                <CheckBox
                                    :model-value="selectedPermissions.has(perm.id)"
                                    :binary="true"
                                    size="normal"
                                    @update:model-value="emit('togglePermission', perm.id)" />
                                <span class="text-schedule-text-primary dark:text-text-secondary text-sm font-medium">
                                    {{ perm.name }}
                                </span>
                            </label>
                        </div>

                        <div
                            class="border-schedule-border-subtle dark:border-border-default mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                            <div class="dark:text-text-tertiary flex items-center gap-3 text-sm text-gray-500">
                                <span>
                                    {{ $lang.showing || 'Showing' }} {{ mgFrom }} {{ $lang.to || 'to' }} {{ mgTo }}
                                    {{ $lang.of || 'of' }} {{ mgTotal }} {{ $lang.entries || 'entries' }}
                                </span>
                                <div class="flex items-center gap-2">
                                    <span class="dark:text-text-tertiary text-sm text-gray-500">
                                        {{ $lang.perPage || 'Per Page:' }}
                                    </span>
                                    <MainSelect
                                        :modelValue="mgPerPage"
                                        :options="perPageOptions"
                                        size="small"
                                        variant="outlined"
                                        class="w-20"
                                        @update:modelValue="
                                            (v) => {
                                                mgPerPage = v;
                                                mgCurrentPage = 1;
                                            }
                                        " />
                                </div>
                            </div>
                            <div
                                class="dark:border-border-strong flex items-center overflow-hidden rounded-lg border border-gray-300">
                                <button
                                    :disabled="mgCurrentPage === 1"
                                    @click="mgCurrentPage--"
                                    :class="[
                                        'dark:border-border-strong flex items-center gap-1 border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all',
                                        mgCurrentPage === 1
                                            ? 'dark:bg-surface-card dark:text-text-muted cursor-not-allowed bg-white text-gray-300'
                                            : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                                    ]">
                                    <i class="fa-solid fa-chevron-left text-xs"></i>
                                    <span>{{ $lang.previous || 'Previous' }}</span>
                                </button>
                                <button
                                    v-for="p in mgLastPage"
                                    :key="p"
                                    @click="mgCurrentPage = p"
                                    :class="[
                                        'dark:border-border-strong border-r border-gray-300 px-3 py-2 text-sm font-medium transition-all',
                                        p === mgCurrentPage
                                            ? 'bg-schedule-brand-blue text-white'
                                            : 'dark:bg-surface-card dark:text-text-secondary dark:hover:bg-surface-hover bg-white text-gray-700 hover:bg-gray-50'
                                    ]">
                                    {{ p }}
                                </button>
                                <button
                                    :disabled="mgCurrentPage === mgLastPage"
                                    @click="mgCurrentPage++"
                                    :class="[
                                        'flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all',
                                        mgCurrentPage === mgLastPage
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
        </div>
    </div>
</template>
