<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    name?: string;
    photo?: string | null;
    size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
    name: '',
    photo: null,
    size: 'md'
});

const getNameShorten = (name: string) => {
    if (!name) return '';

    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .map((n: any) => n[0].toUpperCase())
        .join('');
};

const shortenedName = computed(() => getNameShorten(props.name));

const sizeClasses = computed(() => (props.size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm'));
</script>
<template>
    <div
        class="bg-schedule-brand-blue relative flex shrink-0 items-center justify-center rounded-full text-white"
        :class="sizeClasses">
        <img
            v-if="photo"
            :src="photo"
            class="aspect-square h-full w-full object-cover" />
        <span
            v-else
            class="self-center font-medium">
            {{ shortenedName }}
        </span>
    </div>
</template>
