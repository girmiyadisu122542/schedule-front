<script lang="ts">
export default {
    inheritAttrs: false
};
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs } from 'vue';
import MainBadge from '@/components/common/MainBadge.vue';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface BadgeItem {
    name: string;
    [key: string]: any;
}

const props = withDefaults(
    defineProps<{
        placement?: Side;
        offset?: number;
        closeOnOutside?: boolean;
        ariaLabel?: string;
        items?: BadgeItem[];
        title?: string;
        badgeSeverity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
        showTotal?: boolean;
        maxWidth?: string;
        maxHeight?: string;
        zIndex?: number;
    }>(),
    {
        placement: 'bottom',
        offset: 8,
        closeOnOutside: true,
        ariaLabel: 'Popover',
        items: () => [],
        title: '',
        badgeSeverity: 'secondary',
        showTotal: false,
        maxWidth: '28rem',
        maxHeight: '24rem',
        zIndex: 100000
    }
);

const emit = defineEmits<{
    (e: 'show'): void;
    (e: 'hide'): void;
}>();

const popoverRef = ref<HTMLElement | null>(null);
const anchorElement = ref<HTMLElement | null>(null);
const visible = ref(false);
const actualPlacement = ref<Side>(props.placement);
const attrs = useAttrs();

const popoverStyle = computed(() => {
    if (!anchorElement.value) return {};

    // Get fresh position on every render (accounts for scrolling)
    const rect = anchorElement.value.getBoundingClientRect();
    const { top, left, width, height } = rect;

    const base: Record<string, string> = {
        position: 'fixed',
        zIndex: props.zIndex.toString()
    };

    switch (actualPlacement.value) {
        case 'top':
            base.left = `${left + width / 2}px`;
            base.top = `${top - props.offset}px`;
            base.transform = 'translate(-50%, -100%)';
            break;
        case 'left':
            base.left = `${left - props.offset}px`;
            base.top = `${top + height / 2}px`;
            base.transform = 'translate(-100%, -50%)';
            break;
        case 'right':
            base.left = `${left + width + props.offset}px`;
            base.top = `${top + height / 2}px`;
            base.transform = 'translateY(-50%)';
            break;
        default: // bottom
            base.left = `${left + width / 2}px`;
            base.top = `${top + height + props.offset}px`;
            base.transform = 'translate(-50%, 0)';
    }

    base.maxWidth = props.maxWidth;
    base.maxHeight = props.maxHeight;
    return base;
});

const placementClass = computed(() => `main-popover--${actualPlacement.value}`);

function calculateBestPlacement() {
    if (!anchorElement.value || !popoverRef.value) return props.placement;

    const anchorRect = anchorElement.value.getBoundingClientRect();
    const popoverRect = popoverRef.value.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceAbove = anchorRect.top;
    const spaceBelow = viewportHeight - anchorRect.bottom;
    const spaceLeft = anchorRect.left;
    const spaceRight = viewportWidth - anchorRect.right;

    const popoverHeight = popoverRect.height || 200; // fallback estimate
    const popoverWidth = popoverRect.width || 200; // fallback estimate

    // Check preferred placement first
    switch (props.placement) {
        case 'bottom':
            if (spaceBelow >= popoverHeight + props.offset) return 'bottom';
            if (spaceAbove >= popoverHeight + props.offset) return 'top';
            if (spaceRight >= popoverWidth + props.offset) return 'right';
            if (spaceLeft >= popoverWidth + props.offset) return 'left';
            break;
        case 'top':
            if (spaceAbove >= popoverHeight + props.offset) return 'top';
            if (spaceBelow >= popoverHeight + props.offset) return 'bottom';
            if (spaceRight >= popoverWidth + props.offset) return 'right';
            if (spaceLeft >= popoverWidth + props.offset) return 'left';
            break;
        case 'left':
            if (spaceLeft >= popoverWidth + props.offset) return 'left';
            if (spaceRight >= popoverWidth + props.offset) return 'right';
            if (spaceBelow >= popoverHeight + props.offset) return 'bottom';
            if (spaceAbove >= popoverHeight + props.offset) return 'top';
            break;
        case 'right':
            if (spaceRight >= popoverWidth + props.offset) return 'right';
            if (spaceLeft >= popoverWidth + props.offset) return 'left';
            if (spaceBelow >= popoverHeight + props.offset) return 'bottom';
            if (spaceAbove >= popoverHeight + props.offset) return 'top';
            break;
    }

    // Default fallback: use the side with most space
    const maxSpace = Math.max(spaceAbove, spaceBelow, spaceLeft, spaceRight);
    if (maxSpace === spaceBelow) return 'bottom';
    if (maxSpace === spaceAbove) return 'top';
    if (maxSpace === spaceRight) return 'right';
    return 'left';
}

function show(event?: MouseEvent) {
    captureAnchor(event);
    visible.value = true;
    emit('show');

    nextTick(() => {
        actualPlacement.value = calculateBestPlacement();
        popoverRef.value?.focus?.();
    });
}

function hide() {
    visible.value = false;
    anchorElement.value = null;
    actualPlacement.value = props.placement;
    emit('hide');
}

function toggle(event?: MouseEvent) {
    visible.value ? hide() : show(event);
}

function captureAnchor(event?: MouseEvent) {
    const target = (event?.currentTarget as HTMLElement) ?? (event?.target as HTMLElement);
    anchorElement.value = target;
}

function handleDocumentClick(event: MouseEvent) {
    if (!props.closeOnOutside || !visible.value) return;
    const target = event.target as Node;
    if (!popoverRef.value?.contains(target) && !anchorElement.value?.contains(target)) {
        // Ignore clicks inside elements with role="listbox" (e.g. MainSelect dropdowns teleported to body)
        if ((target as HTMLElement).closest('[role="listbox"]')) {
            return;
        }
        hide();
    }
}

function handleEscape() {
    hide();
}

defineExpose({ show, hide, toggle });

onMounted(() => document.addEventListener('mousedown', handleDocumentClick));
onBeforeUnmount(() => document.removeEventListener('mousedown', handleDocumentClick));
</script>

<template>
    <Teleport to="body">
        <Transition name="fade-slide">
            <div
                v-if="visible"
                ref="popoverRef"
                v-bind="attrs"
                class="main-popover bg-white dark:bg-gray-900"
                :class="placementClass"
                :style="popoverStyle"
                role="dialog"
                :aria-label="ariaLabel"
                @keydown.escape.prevent="handleEscape">
                <slot>
                    <div class="flex flex-col gap-4">
                        <div
                            v-if="title"
                            class="font- text-sm">
                            {{ title }}
                        </div>
                        <div class="flex max-h-96 flex-wrap gap-2 overflow-y-auto">
                            <MainBadge
                                v-for="(item, index) in items"
                                :key="`popover-item-${index}`"
                                :value="item.name"
                                :severity="badgeSeverity" />
                        </div>
                        <div
                            v-if="showTotal && items.length"
                            class="border-t border-slate-200 pt-3 text-sm text-slate-500">
                            Total: {{ items.length }}
                        </div>
                    </div>
                </slot>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.main-popover {
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow:
        0 30px 40px -20px rgba(15, 23, 42, 0.45),
        0 15px 25px -15px rgba(15, 23, 42, 0.35);
    transform-origin: center;
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;
}

.main-popover::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    background: inherit;
    border-left: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    transform: rotate(45deg);
    z-index: -1;
}

/* Bottom placement - arrow on top */
.main-popover--bottom::after {
    top: -7px;
    left: calc(50% - 7px);
    border-left: none;
    border-bottom: none;
    border-right: 1px solid #e2e8f0;
    border-top: 1px solid #e2e8f0;
}

/* Top placement - arrow on bottom */
.main-popover--top::after {
    bottom: -7px;
    left: calc(50% - 7px);
    border-left: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    border-right: none;
    border-top: none;
}

/* Left placement - arrow on right */
.main-popover--left::after {
    right: -7px;
    top: calc(50% - 7px);
    border-right: 1px solid #e2e8f0;
    border-top: 1px solid #e2e8f0;
    border-left: none;
    border-bottom: none;
}

/* Right placement - arrow on left */
.main-popover--right::after {
    left: -7px;
    top: calc(50% - 7px);
    border-left: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    border-right: none;
    border-top: none;
}

.main-popover--top {
    transform-origin: bottom center;
}

.main-popover--bottom {
    transform-origin: top center;
}

.main-popover--left {
    transform-origin: right center;
}

.main-popover--right {
    transform-origin: left center;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition:
        opacity 500ms ease,
        transform 500ms ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
}

.main-popover--bottom.fade-slide-enter-from,
.main-popover--bottom.fade-slide-leave-to {
    transform: translate(-50%, -8px);
}

.main-popover--top.fade-slide-enter-from,
.main-popover--top.fade-slide-leave-to {
    transform: translate(-50%, calc(-100% + 8px));
}

.main-popover--left.fade-slide-enter-from,
.main-popover--left.fade-slide-leave-to {
    transform: translate(calc(-100% + 8px), -50%);
}

.main-popover--right.fade-slide-enter-from,
.main-popover--right.fade-slide-leave-to {
    transform: translate(-8px, -50%);
}
</style>
