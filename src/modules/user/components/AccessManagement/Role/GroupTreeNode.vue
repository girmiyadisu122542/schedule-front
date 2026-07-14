<script setup lang="ts">
import ActionMenu from '@/components/common/ActionMenu.vue';

interface ActionOption {
    label: string;
    icon: any;
    onClick: () => void;
    variant?: 'danger' | 'info' | 'success' | 'warning' | 'activate' | 'deactivate' | 'primary';
    isOnFooter?: boolean;
}

const props = withDefaults(
    defineProps<{
        nodes: any[];
        selectedGroupId: number | null;
        expandedGroups: Set<number>;
        depth?: number;
        countColor?: string;
        countBg?: string;
        selectedColor?: string;
        grantedCount: (g: any) => string;
        getActions?: (node: any) => ActionOption[];
    }>(),
    {
        countColor: 'text-schedule-brand-blue',
        countBg: 'bg-schedule-brand-blue-subtle',
        selectedColor: 'bg-schedule-brand-blue-subtle text-schedule-brand-blue'
    }
);

const emit = defineEmits<{
    (e: 'select', id: number): void;
    (e: 'toggle', id: number): void;
}>();
</script>

<template>
    <div>
        <div
            v-for="node in nodes"
            :key="node.id">
            <div
                @click="emit('select', node.id)"
                :class="[
                    'flex w-full cursor-pointer items-center justify-between rounded-lg py-2 text-left text-sm transition-colors',
                    selectedGroupId === node.id
                        ? selectedColor + ' font-semibold'
                        : 'text-schedule-text-primary hover:bg-schedule-neutral-100 dark:text-text-secondary dark:hover:bg-surface-hover'
                ]"
                :style="{ paddingLeft: `${(depth ?? 0) * 16 + 12}px`, paddingRight: '8px' }">
                <div class="flex min-w-0 items-center gap-1.5">
                    <i
                        v-if="node.children?.length"
                        @click.stop="emit('toggle', node.id)"
                        :class="expandedGroups.has(node.id) ? 'fa-chevron-down' : 'fa-chevron-right'"
                        class="fa-solid text-schedule-text-tertiary dark:text-text-tertiary w-3 shrink-0 cursor-pointer text-xs"></i>
                    <i
                        v-else
                        class="w-3 shrink-0"></i>
                    <span class="truncate">{{ node.name }}</span>
                </div>
                <div class="ml-2 flex shrink-0 items-center gap-1">
                    <span :class="['rounded-full px-2 py-0.5 text-xs font-semibold', countBg, countColor]">
                        {{ grantedCount(node) }}
                    </span>
                    <template v-if="getActions">
                        <div @click.stop>
                            <ActionMenu :options="getActions(node)" />
                        </div>
                    </template>
                </div>
            </div>

            <GroupTreeNode
                v-if="node.children?.length && expandedGroups.has(node.id)"
                :nodes="node.children"
                :selected-group-id="selectedGroupId"
                :expanded-groups="expandedGroups"
                :depth="(depth ?? 0) + 1"
                :count-color="countColor"
                :count-bg="countBg"
                :selected-color="selectedColor"
                :granted-count="grantedCount"
                :get-actions="getActions"
                @select="emit('select', $event)"
                @toggle="emit('toggle', $event)" />
        </div>
    </div>
</template>
