<script setup lang="ts">
import type { Component } from 'vue';
import { ref, watch, computed } from 'vue';
import { TYPEOF } from '@/config/appConfig';

import CheckBox from '@/components/common/CheckBox.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import RightChevronIcon from '@/assets/icons/RightChevronIcon.vue';
import { useCommonData } from '@/composables/common/useCommonData';

export interface TreeNode {
    id?: number | string;
    name?: string;
    is_group?: boolean;
    children?: TreeNode[];
    descendents?: TreeNode[];
    has_descendants?: boolean;
    has_children?: boolean;
    permissions_count?: number;
    granted_count?: number;
}

type Position = 'left' | 'right' | 'end';

interface Props {
    class?: string;
    nodes?: TreeNode[];
    node?: TreeNode;
    modelValue?: boolean;
    defaultOpen?: boolean;
    chevronPosition?: Position;
    countBadgePosition?: Position;
    needCountBadge?: boolean;
    parentIcon?: Component;
    parentOpenIcon?: Component;
    childIcon?: Component;
    iconPosition?: Position;
    needChevronIconOnLeafNode?: boolean;
    hasCheckBox?: boolean;
    checkBoxKey?: string;
    hasRadioButton?: boolean;
    radioLabel?: string;
    radioButtonKey?: string;
    activeNodeId?: number | string;
    needActiveColor?: boolean;
    searchQuery?: string;
    isRoot?: boolean;
    hideChevron?: boolean;
    activeClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
    chevronPosition: 'right',
    countBadgePosition: 'right',
    needCountBadge: true,
    iconPosition: 'right',
    needChevronIconOnLeafNode: true,
    needActiveColor: false,
    searchQuery: '',
    class: 'rounded-xl border border-schedule-border-subtle bg-schedule-primary dark:border-border-default dark:bg-surface-card'
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'expand', node: TreeNode): void;
    (e: 'leafClicked', node?: TreeNode): void;
    (e: 'nodeClicked', node?: TreeNode): void;
}>();

const { addToSelected, removeFromSelected, updateToggleValue } = useCommonData();
const isOpen = ref(props.defaultOpen ?? false);
const isChecked = ref(false);
const toggleValue = ref(false);
const internalSearch = ref(props.searchQuery || '');

const hasChildren = computed(() => {
    if (props.node) {
        return !!(props.node.children?.length || props.node.descendents?.length);
    }

    if (props.nodes) {
        return !!props.nodes.length;
    }

    // For simple collapsible mode without node/props, treat as a toggleable item
    return true;
});

const nodeHasChildren = computed(() => {
    if (props.node && typeof props.node.has_children === TYPEOF.BOOLEAN) {
        return props.node.has_children || hasChildren.value;
    }
    return hasChildren.value;
});

const currentIcon = computed(() => {
    const node = props.node;
    if (node && typeof node.has_children === TYPEOF.BOOLEAN) {
        if (!props.isRoot && !nodeHasChildren.value) {
            return props.childIcon;
        }
        return isOpen.value ? (props.parentOpenIcon ?? props.parentIcon) : props.parentIcon;
    }

    if (isOpen.value && hasChildren.value) {
        return props.parentOpenIcon;
    } else if (hasChildren.value) {
        return props.parentIcon;
    } else {
        return props.isRoot ? props.parentIcon : props.childIcon;
    }
});

const countBadgeValue = computed(() => {
    const node = props.node;
    if (node && typeof node.permissions_count === TYPEOF.NUMBER) {
        const granted = typeof node.granted_count === TYPEOF.NUMBER ? node.granted_count : 0;
        return `${granted}/${node.permissions_count}`;
    }
    return filteredChildren.value.length;
});

const isActiveNode = computed(
    () => !hasChildren.value && props.needActiveColor && props.activeNodeId === props.node?.id
);

const resolvedActiveClass = computed(
    () =>
        props.activeClass ||
        'bg-schedule-brand-blue-active hover:bg-schedule-info-surface-hover dark:bg-surface-subtle dark:hover:bg-surface-hover'
);

const showCountBadge = computed(() => {
    if (props.node && typeof props.node.has_children === TYPEOF.BOOLEAN) {
        return props.isRoot || nodeHasChildren.value;
    }
    return nodeHasChildren.value;
});

const isSearching = computed(() => {
    return !!internalSearch.value.trim();
});

watch(
    () => props.modelValue,
    (val) => {
        if (typeof val === TYPEOF.BOOLEAN) {
            isOpen.value = val;
        }
    }
);

watch(
    () => props.searchQuery,
    (val) => {
        internalSearch.value = val || '';
    }
);

watch(isSearching, (val) => {
    if (val) {
        isOpen.value = true;
    }
});

watch(
    () => isOpen.value,
    (val) => {
        if (props.hasRadioButton && isChecked.value) {
            toggleValue.value = val;
        }
    }
);

watch(
    () => toggleValue.value,
    (val) => {
        if (props.hasRadioButton && isChecked.value) {
            isOpen.value = val;
        }

        if (isChecked.value && props.node && props.checkBoxKey && props.radioButtonKey) {
            updateToggleValue(props.checkBoxKey, props.node.id, props.radioButtonKey, val);
        }

        if (val && isChecked.value && props.node) {
            emit('expand', props.node);
        }
    }
);

watch(
    () => isChecked.value,
    (val) => {
        if (!val) {
            toggleValue.value = false;
            isOpen.value = false;
            if (props.node && props.checkBoxKey) {
                removeFromSelected(props.node, props.checkBoxKey);
            }
        } else {
            if (props.node && props.checkBoxKey && props.radioButtonKey) {
                addToSelected(props.node, props.checkBoxKey, props.radioButtonKey, toggleValue.value);
            }
        }
    }
);

const toggle = () => {
    if (props.hasCheckBox) return;

    isOpen.value = !isOpen.value;
    emit('update:modelValue', isOpen.value);

    if (!hasChildren.value) {
        emit('leafClicked', props.node);
    } else {
        emit('nodeClicked', props.node);
    }

    if (isOpen.value && props.node && props.node.has_descendants && !props.node.children && !props.node.descendents) {
        emit('expand', props.node);
    }
};

const countChildren = (node: TreeNode): number => {
    const children = node.children || node.descendents;
    if (!children?.length) return 0;
    return children.length + children.reduce((acc, child) => acc + countChildren(child), 0);
};

const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query.trim()) {
        return nodes;
    }

    const lowerQuery = query.toLowerCase();

    return nodes
        .map((node) => {
            const children = node.children || node.descendents || [];
            const filteredChildren = filterTree(children, query);
            const matchesSelf = node.name?.toLowerCase().includes(lowerQuery);

            if (matchesSelf || filteredChildren.length) {
                return {
                    ...node,

                    children: node.children ? filteredChildren : undefined,

                    descendents: node.descendents ? filteredChildren : undefined
                };
            }

            return null;
        })
        .filter(Boolean) as TreeNode[];
};

const filteredNodes = computed(() => {
    if (!props.nodes) return [];

    return filterTree(props.nodes, internalSearch.value);
});

const filteredChildren = computed(() => {
    if (!props.node) return [];

    const children = props.node.children || props.node.descendents || [];

    return filterTree(children, internalSearch.value);
});

const highlightText = (text?: string) => {
    if (!text) return '';

    if (!internalSearch.value.trim()) {
        return text;
    }

    const escaped = internalSearch.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');

    return text.replace(regex, '<mark class="rounded bg-yellow-200 px-1 dark:bg-yellow-600">$1</mark>');
};
</script>

<template>
    <div :class="props.class">
        <template v-if="nodes?.length">
            <div class="space-y-2 p-2">
                <Collapsible
                    v-for="child in filteredNodes"
                    :key="child.id"
                    :node="child"
                    :class="props.class"
                    :chevronPosition="chevronPosition"
                    :countBadgePosition="countBadgePosition"
                    :needCountBadge="needCountBadge"
                    :parentIcon="parentIcon"
                    :parentOpenIcon="parentOpenIcon"
                    :childIcon="childIcon"
                    :iconPosition="iconPosition"
                    :needChevronIconOnLeafNode="needChevronIconOnLeafNode"
                    :hasCheckBox="hasCheckBox"
                    :checkBoxKey="checkBoxKey"
                    :hasRadioButton="hasRadioButton"
                    :radioLabel="radioLabel"
                    :radioButtonKey="radioButtonKey"
                    :activeNodeId="activeNodeId"
                    :needActiveColor="needActiveColor"
                    :searchQuery="internalSearch"
                    :hideChevron="hideChevron"
                    :activeClass="activeClass"
                    :isRoot="true"
                    @expand="$emit('expand', $event)"
                    @leafClicked="$emit('leafClicked', $event)"
                    @nodeClicked="$emit('nodeClicked', $event)" />
            </div>
        </template>

        <template v-else-if="node">
            <div
                class="dark:hover:bg-surface-hover flex cursor-pointer items-center rounded-xl px-3 py-2 select-none hover:bg-gray-50"
                :class="[
                    { 'justify-between': chevronPosition === 'end' || countBadgePosition === 'end' },
                    isActiveNode ? resolvedActiveClass : ''
                ]"
                @click="toggle">
                <div class="flex items-center gap-2">
                    <template v-if="!hideChevron && !hasChildren && !needChevronIconOnLeafNode">
                        <div class="p-4"></div>
                    </template>

                    <template
                        v-if="!hideChevron && chevronPosition === 'left' && (hasChildren || needChevronIconOnLeafNode)">
                        <RightChevronIcon
                            class="h-8 w-8 transition-transform"
                            :class="{ 'rotate-90': isOpen }" />
                    </template>

                    <template v-if="needCountBadge && countBadgePosition === 'left' && showCountBadge">
                        <span
                            class="dark:bg-surface-subtle dark:text-text-secondary rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                            {{ countBadgeValue }}
                        </span>
                    </template>

                    <template v-if="iconPosition === 'left' && currentIcon">
                        <component
                            :is="currentIcon"
                            class="h-5 w-5" />
                    </template>

                    <template v-if="hasCheckBox">
                        <CheckBox
                            v-model="isChecked"
                            :label="node?.name ?? ($lang.toggle || 'Toggle')"
                            binary
                            @click.stop />
                    </template>

                    <template v-else>
                        <slot name="label">
                            <span v-html="highlightText(node?.name)"></span>
                        </slot>
                    </template>

                    <template
                        v-if="
                            !hideChevron && chevronPosition === 'right' && (hasChildren || needChevronIconOnLeafNode)
                        ">
                        <RightChevronIcon
                            class="h-8 w-8 transition-transform"
                            :class="{ 'rotate-90': isOpen }" />
                    </template>

                    <template v-if="needCountBadge && countBadgePosition === 'right' && showCountBadge">
                        <span
                            class="dark:bg-surface-subtle dark:text-text-secondary rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                            {{ countBadgeValue }}
                        </span>
                    </template>

                    <template v-if="iconPosition === 'right' && currentIcon">
                        <component
                            :is="currentIcon"
                            class="h-5 w-5" />
                    </template>
                </div>

                <div class="flex items-center gap-2">
                    <template v-if="hasRadioButton && isChecked">
                        <ToggleSwitch
                            v-model="toggleValue"
                            :label="radioLabel"
                            :size="'small'"
                            :variant="'primary'"
                            @click.stop />
                    </template>

                    <template v-if="needCountBadge && countBadgePosition === 'end' && showCountBadge">
                        <span
                            class="dark:bg-surface-subtle dark:text-text-secondary rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                            {{ countBadgeValue }}
                        </span>
                    </template>

                    <template v-if="iconPosition === 'end' && currentIcon">
                        <component
                            :is="currentIcon"
                            class="h-5 w-5" />
                    </template>

                    <template
                        v-if="!hideChevron && chevronPosition === 'end' && (hasChildren || needChevronIconOnLeafNode)">
                        <RightChevronIcon
                            class="h-8 w-8 transition-transform"
                            :class="{ 'rotate-90': isOpen }" />
                    </template>
                </div>
            </div>

            <div
                v-if="isOpen"
                class="mb-2 ml-4">
                <slot />

                <div
                    v-if="filteredChildren.length"
                    class="space-y-1">
                    <Collapsible
                        v-for="child in filteredChildren"
                        :key="child.id"
                        :node="child"
                        :class="props.class"
                        :chevronPosition="chevronPosition"
                        :countBadgePosition="countBadgePosition"
                        :needCountBadge="needCountBadge"
                        :parentIcon="parentIcon"
                        :parentOpenIcon="parentOpenIcon"
                        :childIcon="childIcon"
                        :iconPosition="iconPosition"
                        :needChevronIconOnLeafNode="needChevronIconOnLeafNode"
                        :hasCheckBox="hasCheckBox"
                        :checkBoxKey="checkBoxKey"
                        :hasRadioButton="hasRadioButton"
                        :radioLabel="radioLabel"
                        :radioButtonKey="radioButtonKey"
                        :activeNodeId="activeNodeId"
                        :needActiveColor="needActiveColor"
                        :searchQuery="internalSearch"
                        :hideChevron="hideChevron"
                        :activeClass="activeClass"
                        @expand="$emit('expand', $event)"
                        @leafClicked="$emit('leafClicked', $event)"
                        @nodeClicked="$emit('nodeClicked', $event)">
                        <template #label>
                            <span v-html="highlightText(child.name)"></span>
                        </template>
                    </Collapsible>
                </div>
            </div>
        </template>

        <template v-else>
            <div
                class="dark:hover:bg-surface-hover flex cursor-pointer items-center rounded-xl px-3 py-2 select-none hover:bg-gray-50"
                @click="toggle">
                <div class="flex items-center gap-2">
                    <template v-if="chevronPosition === 'left'">
                        <RightChevronIcon
                            class="h-8 w-8 transition-transform"
                            :class="{ 'rotate-90': isOpen }" />
                    </template>

                    <template v-if="iconPosition === 'left' && currentIcon">
                        <component
                            :is="currentIcon"
                            class="h-5 w-5" />
                    </template>

                    <slot name="label">
                        <span>{{ $lang.toggle || 'Toggle' }}</span>
                    </slot>

                    <template v-if="chevronPosition === 'right'">
                        <RightChevronIcon
                            class="h-8 w-8 transition-transform"
                            :class="{ 'rotate-90': isOpen }" />
                    </template>

                    <template v-if="iconPosition === 'right' && currentIcon">
                        <component
                            :is="currentIcon"
                            class="h-5 w-5" />
                    </template>
                </div>
            </div>

            <div
                v-if="isOpen"
                class="mb-2 ml-4">
                <slot />
            </div>
        </template>
    </div>
</template>
