<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const props = withDefaults(
    defineProps<{
        text: string;
        direction?: 'top' | 'bottom' | 'left' | 'right';
        delay?: number;
    }>(),
    {
        direction: 'right',
        delay: 200
    }
);

const triggerRef = ref<HTMLElement | null>(null);
const visible = ref(false);
const position = ref({ top: 0, left: 0 });

let timeout: any = null;

const show = async () => {
    timeout = setTimeout(async () => {
        visible.value = true;
        await nextTick();
        updatePosition();
    }, props.delay);
};

const hide = () => {
    clearTimeout(timeout);
    visible.value = false;
};

const updatePosition = () => {
    if (!triggerRef.value) return;

    const rect = triggerRef.value.getBoundingClientRect();
    const gap = 10;

    switch (props.direction) {
        case 'left':
            position.value = {
                top: rect.top + rect.height / 2,
                left: rect.left - gap
            };
            break;
        case 'right':
            position.value = {
                top: rect.top + rect.height / 2,
                left: rect.right + gap
            };
            break;
        case 'top':
            position.value = {
                top: rect.top - gap,
                left: rect.left + rect.width / 2
            };
            break;
        case 'bottom':
            position.value = {
                top: rect.bottom + gap,
                left: rect.left + rect.width / 2
            };
            break;
    }
};

onMounted(() => {
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
});

onUnmounted(() => {
    window.removeEventListener('scroll', updatePosition);
    window.removeEventListener('resize', updatePosition);
});
</script>

<template>
    <!-- Trigger -->
    <div
        ref="triggerRef"
        class="inline-block"
        @mouseenter="show"
        @mouseleave="hide">
        <slot />
    </div>

    <!-- Tooltip -->
    <teleport to="body">
        <div
            v-if="visible"
            class="bg-surface-elevated border-border-default text-text-primary fixed z-9999 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-xl"
            :style="{
                top: position.top + 'px',
                left: position.left + 'px',
                transform:
                    direction === 'left'
                        ? 'translate(-100%, -50%)'
                        : direction === 'right'
                          ? 'translate(0, -50%)'
                          : direction === 'top'
                            ? 'translate(-50%, -100%)'
                            : 'translate(-50%, 0)'
            }">
            {{ text }}

            <!-- Arrow -->
            <span
                class="bg-surface-elevated border-border-default absolute h-2 w-2 rotate-45 border"
                :class="{
                    // Arrow on right tooltip (pointing left)
                    'top-1/2 -left-1 -translate-y-1/2': direction === 'right',

                    // Arrow on left tooltip (pointing right)
                    'top-1/2 -right-1 -translate-y-1/2': direction === 'left',

                    // Arrow on top tooltip (pointing down)
                    '-bottom-1 left-1/2 -translate-x-1/2': direction === 'top',

                    // Arrow on bottom tooltip (pointing up)
                    '-top-1 left-1/2 -translate-x-1/2': direction === 'bottom'
                }"></span>
        </div>
    </teleport>
</template>
