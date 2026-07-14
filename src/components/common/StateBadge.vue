<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import Badge from '@/components/common/Badge.vue';
import { useLanguageStore } from '@/stores/languageStore';
import { STATE_ACTIVE } from '@/constants/statusOptions';

/**
 * Single source of truth for the Active / Inactive state badge.
 * Pass a numeric/string `state`; renders the shared Badge (success when active,
 * light otherwise). Reuse everywhere instead of re-implementing per table.
 */
const props = withDefaults(
    defineProps<{
        state?: number | string | null;
    }>(),
    { state: null }
);

const { translations } = storeToRefs(useLanguageStore());

const isActive = computed(() => Number(props.state) === STATE_ACTIVE);
</script>

<template>
    <Badge
        outlined
        :variant="isActive ? 'success' : 'light'"
        :label="isActive ? translations.active || 'Active' : translations.inactive || 'Inactive'" />
</template>
