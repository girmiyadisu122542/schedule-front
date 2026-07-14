<script setup lang="ts">
import { ref, computed } from 'vue';
import Badge from '@/components/common/Badge.vue';
import InputText from '@/components/common/InputText.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import RightChevronIcon from '@/assets/icons/RightChevronIcon.vue';
import MoreVerticalIcon from '@/assets/icons/MoreVerticalIcon.vue';

interface PermissionGroup {
    id: number;
    name: string;
    children?: PermissionGroup[];
    permissions?: string[];
}

const props = defineProps<{
    items: PermissionGroup[];
    searchable?: boolean;
    showBadge?: boolean;
    showActions?: boolean;
    actions?: any[];
}>();

const emit = defineEmits<{
    selectGroup: [group: PermissionGroup];
    actionClick: [action: string, group: PermissionGroup];
}>();

const searchQuery = ref('');
const expanded = ref<Set<number>>(new Set());

const filteredItems = computed(() => {
    if (!props.searchable || !searchQuery.value) return props.items;
    const query = searchQuery.value.toLowerCase();
    const filterTree = (items: PermissionGroup[]): PermissionGroup[] => {
        return items
            .filter((item) => {
                const matches = item.name.toLowerCase().includes(query);
                if (item.children) {
                    const filteredChildren = filterTree(item.children);
                    return matches || filteredChildren.length > 0;
                }
                return matches;
            })
            .map((item) => {
                if (item.children) {
                    return { ...item, children: filterTree(item.children) };
                }
                return item;
            });
    };
    return filterTree(props.items);
});

const toggleExpand = (id: number) => {
    if (expanded.value.has(id)) {
        expanded.value.delete(id);
    } else {
        expanded.value.add(id);
    }
};

const countChildren = (item: PermissionGroup): number => {
    let count = 0;
    if (item.children) {
        item.children.forEach((child) => {
            count += 1 + countChildren(child);
        });
    }
    return count;
};

const handleGroupClick = (item: PermissionGroup) => {
    if (!item.children || item.children.length === 0) {
        emit('selectGroup', item);
    } else {
        toggleExpand(item.id);
    }
};

const flattenTree = (items: PermissionGroup[], depth: number = 0): { item: PermissionGroup; depth: number }[] => {
    let flat: { item: PermissionGroup; depth: number }[] = [];
    items.forEach((item) => {
        flat.push({ item, depth });
        if (item.children && expanded.value.has(item.id)) {
            flat = flat.concat(flattenTree(item.children, depth + 1));
        }
    });
    return flat;
};

const flatItems = computed(() => flattenTree(filteredItems.value));
</script>

<template>
    <div>
        <InputText
            v-if="searchable"
            v-model="searchQuery"
            :placeholder="$lang.search || 'Search permission groups...'"
            class="my-4 w-full" />
        <div class="max-h-96 overflow-y-auto rounded-lg">
            <div
                v-for="{ item, depth } in flatItems"
                :key="item.id"
                :style="{ marginLeft: `${depth * 20}px` }"
                class="flex cursor-pointer items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                @click="handleGroupClick(item)">
                <div class="flex w-full items-center justify-between gap-8">
                    <div>
                        <button
                            v-if="item.children && item.children.length > 0"
                            @click.stop="toggleExpand(item.id)"
                            class="mr-2">
                            <RightChevronIcon
                                :class="expanded.has(item.id) ? 'h-4 w-4 rotate-90 transform' : 'h-4 w-4'" />
                        </button>
                        <span>{{ item.name }}</span>
                    </div>
                    <div>
                        <Badge
                            v-if="showBadge && item.children && item.children.length > 0"
                            outlined
                            class="ml-2"
                            :label="countChildren(item).toString()" />
                    </div>
                </div>
                <ActionMenu
                    class="ml-6"
                    v-if="showActions"
                    :options="
                        actions?.map((a) => ({
                            label: a.label,
                            icon: null,
                            onClick: () => emit('actionClick', a.value, item)
                        })) || []
                    ">
                    <MoreVerticalIcon class="h-4 w-4" />
                </ActionMenu>
            </div>
        </div>
    </div>
</template>
