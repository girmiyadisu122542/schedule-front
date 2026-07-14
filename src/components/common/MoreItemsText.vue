<script setup lang="ts">
import { computed } from 'vue';

interface Item {
    id?: number | string;
    name: string;
}

const props = withDefaults(
    defineProps<{
        data: Item[];
        showNumber?: number;
        extraClass?: string;
        separator?: string;
        moreText?: string;
        textClass?: string;
    }>(),
    {
        extraClass: '',
        moreText: '',
        separator: ', ',
        showNumber: 2,
        textClass: ''
    }
);

const emits = defineEmits<{
    (e: 'on-more-click', items: Item[]): void;
}>();

function handleMoreClick() {
    emits('on-more-click', props.data);
}

const visibleItems = computed(() => {
    return props.data?.slice(0, props.showNumber);
});

const remainingCount = computed(() => {
    return Math.max(props.data?.length - props.showNumber, 0);
});

const visibleText = computed(() => {
    return visibleItems.value?.map((item) => item.name).join(props.separator);
});
</script>

<template>
    <div
        class="flex flex-wrap items-center text-sm leading-6 text-gray-600 dark:text-gray-300"
        :class="$slots.item ? 'gap-2' : 'justify-between'">
        <!-- Per-item slot (e.g. chips); falls back to joined text when not provided. -->
        <template
            v-for="entry in visibleItems"
            :key="entry.id ?? entry.name">
            <slot
                v-if="$slots.item"
                name="item"
                :item="entry" />
        </template>
        <span
            v-if="!$slots.item"
            class="cursor-pointer font-medium transition-opacity duration-150 hover:opacity-80"
            @click="handleMoreClick"
            :class="props.textClass || ''">
            {{ visibleText }}
        </span>

        <span
            v-if="remainingCount > 0"
            class="cursor-pointer font-medium transition-opacity duration-150 hover:opacity-80"
            :class="[$slots.item ? '' : 'ml-1', props.extraClass || 'text-schedule-brand-blue-primary']"
            @click="handleMoreClick">
            +{{ remainingCount }} {{ props.moreText || $lang.more || 'more' }}
        </span>
    </div>
</template>
