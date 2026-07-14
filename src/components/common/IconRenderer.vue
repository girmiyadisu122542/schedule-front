<script setup lang="ts">
import { computed } from 'vue';

/**
 * Cross-module renderer that materialises an Icon row from the API
 * into a visual element. The renderStrategy is selected at runtime
 * from the source_type discriminator (svg | image | url):
 *   - svg   -> inline <svg> via v-html (svg is sanitised on the server)
 *   - image -> <img> with the stored data URL or storage path
 *   - url   -> <img> with the remote URL + onerror fallback
 *
 * This component is intentionally not Icon-shape aware; pass the bare
 * fields so it can be reused outside Pinia.
 */
const props = withDefaults(
    defineProps<{
        sourceType: 'svg' | 'image' | 'url' | null | undefined;
        svgContent?: string | null;
        image?: string | null;
        url?: string | null;
        viewBox?: string | null;
        size?: number | string;
        ariaLabel?: string;
    }>(),
    {
        size: 24,
        ariaLabel: 'icon'
    }
);

const dimension = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size));
const broken = computed(() => !props.sourceType);

function onImgError(e: Event) {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    target.parentElement?.classList.add('icon-broken');
}
</script>

<template>
    <span
        class="inline-flex items-center justify-center"
        :style="{ width: dimension, height: dimension }"
        :aria-label="ariaLabel"
        role="img">
        <template v-if="broken">
            <span class="text-xs text-gray-400">?</span>
        </template>

        <template v-else-if="sourceType === 'svg' && svgContent">
            <span
                class="icon-svg block h-full w-full [&_svg]:h-full [&_svg]:w-full"
                v-html="svgContent" />
        </template>

        <template v-else-if="sourceType === 'image' && image">
            <img
                :src="image"
                :alt="ariaLabel"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-contain"
                @error="onImgError" />
        </template>

        <template v-else-if="sourceType === 'url' && url">
            <img
                :src="url"
                :alt="ariaLabel"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                class="h-full w-full object-contain"
                @error="onImgError" />
        </template>

        <template v-else>
            <span class="text-xs text-gray-400">?</span>
        </template>
    </span>
</template>

<style scoped>
.icon-broken {
    background: #f3f4f6;
    border-radius: 4px;
}
</style>
