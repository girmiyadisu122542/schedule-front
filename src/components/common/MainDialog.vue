<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = withDefaults(
    defineProps<{
        noXPadding?: boolean;
        visible: boolean;
        header?: string;
        modal?: boolean;
        closable?: boolean;
        closeOnEscape?: boolean;
        closeOnBackdrop?: boolean;
        width?: string;
        maxWidth?: string;
        zIndex?: number;
        rounded?: boolean;
        padding?: string;
        shadow?: string;
        subtitle?: string;
        headerIcon?: string;
        headerStyle?: string;
        plainBackground?: boolean;
    }>(),
    {
        noXPadding: false,
        modal: true,
        closable: true,
        closeOnEscape: true,
        closeOnBackdrop: true,
        rounded: true,
        headerStyle: '',
        plainBackground: false
    }
);

const emits = defineEmits(['update:visible', 'close']);
const originalOverflow = ref<string | null>(null);

function lockBodyScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    originalOverflow.value = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
}

function unlockBodyScroll() {
    document.body.style.overflow = originalOverflow.value || '';
    document.body.style.paddingRight = '';
}

function closeDialog() {
    emits('update:visible', false);
    emits('close');
}

function onDialogLeave() {
    isRendered.value = false;
}

function onKeydown(e: KeyboardEvent) {
    if (props.closeOnEscape !== false && e.key === 'Escape' && props.visible) closeDialog();
}

const isRendered = ref(props.visible);
watch(
    () => props.visible,
    (val) => {
        if (val) {
            isRendered.value = true;
            lockBodyScroll();
        } else {
            unlockBodyScroll();
        }
    }
);

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    unlockBodyScroll();
});
</script>
<template>
    <div>
        <div
            v-if="isRendered"
            class="fixed inset-0 mx-0 flex items-center justify-center md:mx-0"
            :style="{ zIndex: props.zIndex ?? 99999 }">
            <div
                v-if="props.visible && props.modal !== false"
                class="fixed inset-0 bg-black/70 transition-opacity duration-300"
                @click="props.closeOnBackdrop !== false ? closeDialog() : null"
                aria-label="Dialog Backdrop"></div>

            <transition
                appear
                @after-leave="onDialogLeave"
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition-all duration-100 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95">
                <div
                    v-if="props.visible"
                    :class="[
                        props.plainBackground ? 'bg-surface-elevated' : 'bg-schedule-pattern-diamonds-elevated',
                        'border-border-default text-text-primary relative flex flex-col border',
                        props.width || 'w-full',
                        props.maxWidth || 'max-w-2xl',
                        props.rounded !== false ? 'rounded-2xl' : '',
                        props.shadow || 'shadow-2xl'
                    ]"
                    style="max-height: 90vh"
                    role="dialog"
                    aria-modal="true"
                    @click.stop>
                    <div
                        v-if="props.header || $slots.header || props.closable !== false"
                        class="bg-surface-elevated border-border-subtle sticky top-0 z-10 flex items-center justify-between overflow-hidden border-b px-6 py-4 text-lg font-medium select-none"
                        :class="props.rounded !== false ? 'rounded-t-2xl' : ''">
                        <span
                            class="from-schedule-brand-blue/18 via-schedule-brand-blue/5 pointer-events-none absolute inset-0 z-0 bg-gradient-to-r to-transparent"></span>
                        <div
                            class="relative z-10"
                            :class="props.subtitle ? 'flex flex-col gap-2' : 'flex-1'">
                            <i
                                v-if="props.headerIcon"
                                :class="`${props.headerIcon}`"></i>
                            <slot name="header">
                                <span
                                    class="text-text-primary text-xl font-semibold"
                                    :class="`${props.headerStyle}`">
                                    {{ props.header }}
                                </span>
                            </slot>
                            <p
                                v-if="props.subtitle"
                                class="text-text-tertiary text-sm">
                                {{ props.subtitle }}
                            </p>
                        </div>
                        <div
                            v-if="props.closable !== false"
                            @click="closeDialog"
                            class="text-text-tertiary hover:text-text-primary relative z-10 ml-4 cursor-pointer">
                            <i class="fa-solid fa-xmark text-sm"></i>
                        </div>
                    </div>
                    <div
                        class="flex-1 px-6 pt-5 pb-6"
                        style="overflow-y: auto; max-height: calc(80vh - 64px)">
                        <slot />
                    </div>
                    <!-- Footer band: solid `surface-subtle` fill + a subtle
                         dark-aware top divider so the action row reads as a clean,
                         distinct strip above the patterned body in both themes.
                         Light = gray-100, dark = slate-800. The divider is the
                         token `border-subtle`, not a stark white line. -->
                    <div
                        v-if="$slots.footer"
                        class="bg-surface-subtle border-border-subtle border-t px-6 py-3"
                        :class="props.rounded !== false ? 'rounded-b-2xl' : ''">
                        <slot name="footer" />
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>
