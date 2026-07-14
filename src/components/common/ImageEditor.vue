<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import RotateCw from '@/assets/icons/RotateCw.vue';
import RotateCcw from '@/assets/icons/RotateCcw.vue';
import TabList from '@/components/common/TabList.vue';
import MainButton from '@/components/common/MainButton.vue';
import type { TabOption } from '@/components/common/TabList.vue';

const props = defineProps<{
    imageFile?: File | null;
    cropShape?: 'circle' | 'rect' | 'free';
}>();

const emit = defineEmits(['apply', 'discard']);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

const image = new Image();

const zoom = ref(1);
const rotation = ref(0);
const cropShape = ref<'circle' | 'rect' | 'free'>(props.cropShape || 'circle');

const offsetX = ref(0);
const offsetY = ref(0);

const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);

const canvasSize = 320;

const shapeOptions: TabOption[] = [
    { label: 'Circle', value: 'circle' },
    { label: 'Rectangle', value: 'rect' }
];

watch(
    () => props.imageFile,
    (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    },
    { immediate: true }
);

watch(
    () => props.cropShape,
    (value) => {
        cropShape.value = value || 'circle';
    },
    { immediate: true }
);

image.onload = () => {
    offsetX.value = 0;
    offsetY.value = 0;
    draw();
};

function draw() {
    if (!ctx.value) return;

    const context = ctx.value;

    context.clearRect(0, 0, canvasSize, canvasSize);
    context.save();

    /* 🔥 CLIP BASED ON SHAPE */
    if (cropShape.value === 'circle') {
        context.beginPath();
        context.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
        context.clip();
    } else if (cropShape.value === 'rect') {
        context.beginPath();
        context.rect(0, 0, canvasSize, canvasSize);
        context.clip();
    }

    context.translate(canvasSize / 2 + offsetX.value, canvasSize / 2 + offsetY.value);
    context.rotate((rotation.value * Math.PI) / 180);

    const scale = zoom.value;
    const width = image.width * scale;
    const height = image.height * scale;

    context.drawImage(image, -width / 2, -height / 2, width, height);

    context.restore();
}

function onMouseDown(e: MouseEvent) {
    isDragging.value = true;
    startX.value = e.clientX;
    startY.value = e.clientY;
}

function onMouseMove(e: MouseEvent) {
    if (!isDragging.value) return;

    const dx = e.clientX - startX.value;
    const dy = e.clientY - startY.value;

    offsetX.value += dx;
    offsetY.value += dy;

    startX.value = e.clientX;
    startY.value = e.clientY;

    draw();
}

function onMouseUp() {
    isDragging.value = false;
}

watch([zoom, rotation, cropShape], draw);

function rotateLeft() {
    rotation.value -= 90;
}

function rotateRight() {
    rotation.value += 90;
}

function applyEdit() {
    if (!canvasRef.value) return;

    const dataUrl = canvasRef.value.toDataURL('image/png');
    emit('apply', dataUrl);
}

function discardEdit() {
    emit('discard');
}

onMounted(() => {
    if (canvasRef.value) {
        ctx.value = canvasRef.value.getContext('2d');
    }

    window.addEventListener('mouseup', onMouseUp);
});
</script>

<template>
    <div class="w-full max-w-4xl rounded-xl bg-white px-6 pb-6 shadow-lg dark:bg-gray-800">
        <!-- HEADER -->
        <div class="flex justify-between gap-x-28">
            <div>
                <TabList
                    v-model="cropShape"
                    :options="shapeOptions" />
            </div>

            <!-- ZOOM -->
            <div class="w-full">
                <div class="flex justify-between text-sm">
                    <span>{{ $lang.magnification || 'Magnification' }}</span>
                    <span>{{ Math.round(zoom * 100) }}%</span>
                </div>

                <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.01"
                    v-model="zoom"
                    class="w-full" />
            </div>
        </div>

        <div class="flex gap-8">
            <!-- LEFT -->
            <div class="relative mt-4">
                <canvas
                    ref="canvasRef"
                    :width="canvasSize"
                    :height="canvasSize"
                    class="cursor-grab rounded-lg active:cursor-grabbing"
                    @mousedown="onMouseDown"
                    @mousemove="onMouseMove" />

                <!-- SHAPE BORDER -->
                <div
                    v-if="cropShape === 'circle'"
                    class="border-primary-600 dark:border-primary-700 pointer-events-none absolute inset-0 rounded-full border-2" />
                <div
                    v-if="cropShape === 'rect'"
                    class="border-primary-600 dark:border-primary-700 pointer-events-none absolute inset-0 border-2" />
            </div>

            <!-- RIGHT -->
            <div class="flex flex-1 flex-col gap-6">
                <div class="text-schedule-text-tertiary mb-4">{{ $lang.zoomRange || '100% (Fit) to 200% (Zoomed)' }}</div>
                <!-- ROTATION -->
                <div>
                    <p class="mb-2 text-sm">{{ $lang.orientation || 'Orientation' }}</p>

                    <div class="flex gap-3">
                        <button
                            @click="rotateLeft"
                            class="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-8 py-2 text-sm hover:bg-gray-100 dark:border-gray-500 dark:hover:bg-gray-700">
                            <RotateCcw />
                            <span>{{ $lang.rotateL || 'Rotate L' }}</span>
                        </button>

                        <button
                            @click="rotateRight"
                            class="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-8 py-2 text-sm hover:bg-gray-100 dark:border-gray-500 dark:hover:bg-gray-700">
                            <RotateCw />
                            <span>{{ $lang.rotateR || 'Rotate R' }}</span>
                        </button>
                    </div>
                </div>

                <!-- ACTIONS -->
                <div class="flex w-full items-center justify-start gap-12">
                    <MainButton
                        severity="secondary"
                        width="full"
                        @click="discardEdit">
                        {{ $lang.discard || 'Discard' }}
                    </MainButton>

                    <MainButton
                        @click="applyEdit"
                        width="full">
                        {{ $lang.apply || 'Apply' }}
                    </MainButton>
                </div>
            </div>
        </div>
    </div>
</template>
