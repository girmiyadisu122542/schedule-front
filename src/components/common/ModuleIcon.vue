<script setup lang="ts">
import { computed } from 'vue';

import {SCREEN_SM,SCREEN_MD,SCREEN_LG,SCREEN_XL} from '@/config/appConfig';
import { useModuleIconRegistry } from '@/composables/useModuleIconRegistry';

type IconSize =
    | typeof SCREEN_SM
    | typeof SCREEN_MD
    | typeof SCREEN_LG
    | typeof SCREEN_XL;

const props = withDefaults(
    defineProps<{
        icon?: string | null;
        size?: IconSize;
        iconClass?: string;
    }>(),
    {
        icon: null,
        size: SCREEN_MD,
        iconClass: ''
    }
);

const isIconUrl = (icon: unknown) => {
    if (typeof icon !== 'string') return false;

    return (
        icon.startsWith('http://') ||
        icon.startsWith('https://') ||
        icon.startsWith('/storage/') ||
        icon.includes('/module-icon/')
    );
};

const iconComponent = computed(() => {
    if (!props.icon) return null;

    return useModuleIconRegistry[props.icon] ?? null;
});

const sizeClass = computed(() => {
    switch (props.size) {
        case SCREEN_SM:
            return 'w-4 h-4';

        case SCREEN_LG:
            return 'w-8 h-8';

        case SCREEN_XL:
            return 'w-10 h-10';

        default: // SCREEN_MD
            return 'w-6 h-6';
    }
});
</script>

<template>
    <component
        v-if="iconComponent"
        :is="iconComponent"
        :class="[sizeClass, iconClass]" />
    <img
        v-else-if="isIconUrl(icon)"
        :src="icon as string"
        class="object-contain"
        :class="[sizeClass, iconClass]" />
    <i
        v-else-if="icon"
        :class="[String(icon), sizeClass, iconClass]" />
    <slot v-else />
</template>
