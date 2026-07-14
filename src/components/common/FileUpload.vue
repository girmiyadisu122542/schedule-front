<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';

import PlayIcon from '@/assets/icons/PlayIcon.vue';
import XmarkIcon from '@/assets/icons/XmarkIcon.vue';
import UploadIcon from '@/assets/icons/UploadIcon.vue';

interface Preview {
    url: string;
    type: 'image' | 'video';
    isBlob: boolean;
}

interface Props {
    modelValue: File | File[] | null;
    label?: string;
    accept?: string;
    maxSizeMB?: number;
    error?: string;
    filePreview?: boolean;
    multiple?: boolean;
    direction?: 'row' | 'col';
    hintText?: string;
}

const props = withDefaults(defineProps<Props>(), {
    label: undefined,
    accept: '.svg,.png,.jpg',
    maxSizeMB: 5,
    filePreview: false,
    multiple: false,
    direction: 'row',
    hintText: undefined
});

const languageStore = useLanguageStore();
const { translations } = storeToRefs(languageStore);

const resolvedFileUploaderLabel = computed(() => props.label || translations.value.uploadFile);
const resolvedHintText = computed(
    () =>
        props.hintText ||
        `${props.accept.replace(/\./g, '')} ${translations.value.filesUpto || 'files up to'} ${props.maxSizeMB}MB`
);
const emit = defineEmits(['update:modelValue', 'error']);

const VIDEO_EXTENSION = /\.(mp4|webm|ogg|ogv|mov|m4v|avi|mkv)$/i;

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const previews = ref<Preview[]>([]);
const activeIndex = ref(0);
const primaryVideoRef = ref<HTMLVideoElement | null>(null);
const isPrimaryPlaying = ref(false);

const activePreview = computed(() => previews.value[activeIndex.value] || null);

const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const oversized = fileArray.some((f) => f.size > props.maxSizeMB * 1024 * 1024);

    if (oversized) {
        emit('error', `One or more files are too large. Max ${props.maxSizeMB}MB allowed.`);
        return;
    }

    if (props.multiple) {
        emit('update:modelValue', fileArray);
    } else {
        emit('update:modelValue', fileArray[0]);
    }
    activeIndex.value = 0;
    emit('error', '');
};

const onFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) handleFiles(target.files);
    target.value = '';
};

const onDrop = (e: DragEvent) => {
    isDragging.value = false;
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
};

const removeFile = (index: number) => {
    if (Array.isArray(props.modelValue)) {
        const newValue = [...props.modelValue];
        newValue.splice(index, 1);
        emit('update:modelValue', newValue.length ? newValue : null);
        if (activeIndex.value >= newValue.length) {
            activeIndex.value = Math.max(0, newValue.length - 1);
        }
    } else {
        emit('update:modelValue', null);
    }
};

const selectPreview = (index: number) => {
    activeIndex.value = index;
};

const playPrimary = async () => {
    isPrimaryPlaying.value = true;
    await nextTick();
    primaryVideoRef.value?.play().catch(() => {});
};

const revokePreviews = () => {
    previews.value.forEach((preview) => {
        if (preview.isBlob) URL.revokeObjectURL(preview.url);
    });
};

watch(
    () => props.modelValue,
    (newVal) => {
        revokePreviews();
        previews.value = [];
        if (!newVal) return;

        const files = Array.isArray(newVal) ? newVal : [newVal];
        files.forEach((file) => {
            if (file instanceof File && props.filePreview) {
                if (file.type.startsWith('image/')) {
                    previews.value.push({ url: URL.createObjectURL(file), type: 'image', isBlob: true });
                } else if (file.type.startsWith('video/')) {
                    previews.value.push({ url: URL.createObjectURL(file), type: 'video', isBlob: true });
                }
            } else if (typeof file === 'string') {
                previews.value.push({
                    url: file,
                    type: VIDEO_EXTENSION.test(file) ? 'video' : 'image',
                    isBlob: false
                });
            }
        });
    },
    { immediate: true }
);

watch(activeIndex, () => {
    isPrimaryPlaying.value = false;
});

onUnmounted(revokePreviews);
</script>

<template>
    <div class="w-full">
        <label class="text-text-secondary mb-2 block text-sm font-semibold">
            {{ resolvedFileUploaderLabel }}
        </label>

        <div
            :class="[
                'transition-all duration-300',
                filePreview ? 'bg-surface-card border-border-default rounded-2xl border p-4' : '',
                filePreview && direction === 'row' ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : 'flex flex-col gap-4'
            ]">
            <div
                v-if="filePreview"
                class="flex w-full flex-col gap-3">
                <div
                    class="border-border-default bg-surface-subtle relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border">
                    <template v-if="activePreview">
                        <img
                            v-if="activePreview.type === 'image'"
                            :src="activePreview.url"
                            class="h-full w-full object-contain p-2"
                            alt="Primary Preview" />

                        <template v-else>
                            <video
                                ref="primaryVideoRef"
                                :src="activePreview.url"
                                class="h-full w-full bg-black object-contain"
                                muted
                                playsinline
                                preload="metadata"
                                :controls="isPrimaryPlaying"></video>
                            <button
                                v-if="!isPrimaryPlaying"
                                type="button"
                                @click.stop="playPrimary"
                                class="absolute inset-0 flex items-center justify-center"
                                :aria-label="$lang.play">
                                <span
                                    class="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-gray-900 shadow-lg backdrop-blur-sm transition-transform hover:scale-105">
                                    <PlayIcon :size="28" />
                                </span>
                            </button>
                        </template>

                        <button
                            type="button"
                            @click.stop="removeFile(activeIndex)"
                            class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-red-500"
                            :aria-label="$lang.remove">
                            <XmarkIcon class="h-4 w-4" />
                        </button>
                    </template>

                    <div
                        v-else
                        class="text-text-muted flex flex-col items-center gap-2 text-xs font-medium">
                        {{ $lang?.logoPreviewSection || $lang?.noMediaSelected || 'No media selected' }}
                    </div>
                </div>

                <div
                    v-if="multiple && previews.length"
                    class="scrollbar-auto flex gap-2 overflow-x-auto pb-1">
                    <button
                        v-for="(preview, index) in previews"
                        :key="preview.url"
                        type="button"
                        @click="selectPreview(index)"
                        :class="[
                            'bg-surface-subtle relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all',
                            activeIndex === index
                                ? 'border-schedule-brand-blue'
                                : 'border-border-default opacity-70 hover:opacity-100'
                        ]">
                        <img
                            v-if="preview.type === 'image'"
                            :src="preview.url"
                            class="h-full w-full object-cover"
                            alt="" />
                        <template v-else>
                            <video
                                :src="preview.url"
                                class="h-full w-full bg-black object-cover"
                                muted
                                preload="metadata"></video>
                            <span class="absolute inset-0 flex items-center justify-center">
                                <span
                                    class="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-900 backdrop-blur-sm">
                                    <PlayIcon :size="16" />
                                </span>
                            </span>
                        </template>
                    </button>
                </div>
            </div>

            <div
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="onDrop"
                @click="fileInput?.click()"
                class="relative flex h-full min-h-40 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200"
                :class="[
                    isDragging
                        ? 'border-schedule-brand-blue bg-schedule-brand-blue-subtle/40'
                        : 'border-border-default bg-surface-card hover:bg-surface-hover',
                    error ? 'border-schedule-error-default' : ''
                ]">
                <input
                    ref="fileInput"
                    type="file"
                    class="hidden"
                    :multiple="multiple"
                    :accept="accept"
                    @change="onFileSelect" />

                <div class="mb-3">
                    <UploadIcon class="text-text-muted h-9 w-9" />
                </div>

                <div class="px-4 text-center">
                    <p class="text-sm">
                        <span class="text-schedule-brand-blue font-bold">{{ $lang.clickToUpload }}</span>
                        <span class="text-text-tertiary pl-1">{{ $lang.dragAndDropOr }}</span>
                    </p>
                    <p class="text-text-muted mt-1 text-[11px] tracking-tight">
                        {{ resolvedHintText }}
                    </p>
                </div>
            </div>
        </div>

        <p
            v-if="error"
            class="mt-2 text-xs font-medium text-red-500 italic">
            {{ error }}
        </p>
    </div>
</template>
