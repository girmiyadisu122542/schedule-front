<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

import Search from '@/assets/icons/Search.vue';

const router = useRouter();

const props = defineProps({
    width: {
        type: String,
        default: '100%'
    },
    placeholder: {
        type: String,
        default: 'Search menu or type / for all items...'
    },
    modelValue: {
        type: String,
        default: ''
    },
    onChange: {
        type: Function,
        default: null
    },
    menuData: {
        type: Array,
        default: () => []
    },
    onMenuItemClick: {
        type: Function,
        default: null
    }
});

const searchInput = ref(null);

defineExpose({
    focus: () => {
        searchInput.value?.focus();
    }
});

const emit = defineEmits(['update:modelValue']);

function onInput(e) {
    const value = e.target.value;
    emit('update:modelValue', value);
    if (props.onChange) props.onChange(value);
}

// Flatten menu items and filter by search query
const filteredMenuItems = computed(() => {
    const query = props.modelValue.toLowerCase();

    // If query is just "/" or starts with "/", show all menu items with URLs
    const showAllItems = query === '/' || query.startsWith('/');

    if (!showAllItems && !query.trim()) return [];

    const results = [];

    // Helper function to recursively search menu items
    const searchItems = (items, path = []) => {
        items.forEach((item) => {
            if (item.path) {
                // Show all items if query is "/" or matches the search
                const shouldInclude = showAllItems || item.name.toLowerCase().includes(query);
                if (shouldInclude) {
                    results.push({
                        ...item,
                        path: item.path,
                        fullPath: [...path, item.name]
                    });
                }
            }
            if (item.subItems) {
                searchItems(item.subItems, [...path, item.name]);
            }
        });
    };

    props.menuData.forEach((group) => {
        searchItems(group.items);
    });

    return results.slice(0, 10); // Limit to 10 results
});

// Highlight matching text
function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts
        .map((part, index) =>
            regex.test(part) ? `<mark class="bg-yellow-200 dark:bg-yellow-600 px-0.5 rounded">${part}</mark>` : part
        )
        .join('');
}

function handleMenuItemClick(item) {
    if (item.path) {
        router.push(item.path);
        emit('update:modelValue', '');
        if (props.onMenuItemClick) {
            props.onMenuItemClick(item);
        }
    }
}
</script>

<template>
    <div class="w-full">
        <form @submit.prevent>
            <div class="relative w-full">
                <span class="text-text-muted absolute top-1/2 left-4 -translate-y-1/2">
                    <Search />
                </span>
                <input
                    ref="searchInput"
                    type="text"
                    :placeholder="placeholder"
                    :style="{ width }"
                    :value="modelValue"
                    @input="onInput"
                    class="border-border-default bg-surface-subtle text-text-primary placeholder:text-text-muted focus:border-schedule-border-brand focus:ring-schedule-border-brand focus:bg-surface-card dark:focus:border-primary-500/70 dark:focus:ring-primary-500/70 h-11 w-full rounded-full border py-2.5 pr-14 pl-12 text-sm transition-colors outline-none focus:ring-1" />

                <div
                    class="border-border-default bg-surface-card text-text-muted absolute top-1/2 right-3 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md border text-xs font-semibold">
                    /
                </div>

                <!-- Dropdown -->
                <div
                    v-if="filteredMenuItems.length > 0"
                    class="bg-surface-card border-border-default absolute top-full left-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border shadow-lg"
                    :style="{ width }">
                    <div
                        v-for="(item, index) in filteredMenuItems"
                        :key="item.path"
                        @click="handleMenuItemClick(item)"
                        class="border-border-subtle hover:bg-surface-hover cursor-pointer border-b px-4 py-3 last:border-b-0">
                        <div class="flex items-center gap-3">
                            <i
                                v-if="item.icon"
                                :class="[item.icon, 'text-text-tertiary h-4 w-4']"></i>
                            <div class="flex-1">
                                <div
                                    class="text-text-primary text-sm"
                                    v-html="highlightText(item.name, props.modelValue)"></div>
                                <div class="text-text-tertiary text-xs">
                                    {{ item.fullPath.slice(0, -1).join(' > ') }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>
