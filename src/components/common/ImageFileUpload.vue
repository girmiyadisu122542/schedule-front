<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCommonData } from '@/composables/common/useCommonData';
import { useLanguageStore} from '@/stores/languageStore';

const props = withDefaults(
    defineProps<{
        modelValue?: File | File[] | null;
        multiple?: boolean;
        accept?: string;
        maxSizeMB?: number;
        actionLabel?: string;
        title?: string;
        subtitle?: string;
    }>(),
    {
        multiple: false,
        accept: '.pdf,.doc,.docx',
        maxSizeMB: 10
    }
);

const emit = defineEmits(['update:modelValue', 'error']);

const { customizeLanguageData } = useLanguageStore();

const resolvedActionLabel = computed(() => props.actionLabel || customizeLanguageData('clickToUpload', 'Click to upload'));
const resolvedTitle = computed(() => props.title || customizeLanguageData('orDragAndDrop', 'or drag and drop'));
const resolvedSubtitle = computed(
    () =>
        props.subtitle ||
        customizeLanguageData('fileUploadSubtitle', `PDF, DOC, DOCX files up to ${props.maxSizeMB}MB`, { fileTypes: 'PDF, DOC, DOCX', maxSize: `${props.maxSizeMB}MB` }) ||
        `PDF, DOC, DOCX files up to ${props.maxSizeMB}MB`
);

const isDragging = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

function openFileDialog() {
    inputRef.value?.click();
}

function validateFiles(files: FileList | File[]) {
    const validFiles: File[] = [];

    for (const file of files) {
        const sizeMB = file.size / (1024 * 1024);

        if (sizeMB > props.maxSizeMB) {
            emit('error', `File "${file.name}" exceeds ${props.maxSizeMB}MB`);
            continue;
        }

        validFiles.push(file);
    }

    return validFiles;
}

function handleFiles(files: FileList | null) {
    if (!files) return;

    const validFiles = validateFiles(files);

    if (!validFiles.length) return;

    emit('update:modelValue', props.multiple ? validFiles : validFiles[0]);
}

function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragging.value = false;
    handleFiles(e.dataTransfer?.files || null);
}

function onDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging.value = true;
}

function onDragLeave() {
    isDragging.value = false;
}

function onFileChange(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    handleFiles(files);
    if (inputRef.value) {
        inputRef.value.value = '';
    }
}
</script>

<template>
    <div
        class="w-full cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition"
        :class="[isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400']"
        @click="openFileDialog"
        @drop="onDrop"
        @dragover="onDragOver"
        @dragleave="onDragLeave">
        <div class="mb-3 flex justify-center">
            <svg
                class="text-schedule-text-disabled h-8 w-8"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24">
                <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
        </div>

        <p class="text-sm font-medium">
            <span class="text-schedule-brand-blue">{{ resolvedActionLabel }}</span>
            <span class="text-schedule-text-disabled">{{ ' ' + resolvedTitle }}</span>
        </p>

        <p class="text-schedule-text-disabled mt-1 text-xs">
            {{ resolvedSubtitle }}
        </p>

        <input
            ref="inputRef"
            type="file"
            class="hidden"
            :multiple="multiple"
            :accept="accept"
            @change="onFileChange" />
    </div>
</template>
