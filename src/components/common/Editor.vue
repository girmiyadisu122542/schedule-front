<script setup lang="ts">
import { onBeforeUnmount, watch, computed, ref } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import type { AnyExtension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Heading } from '@tiptap/extension-heading';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { FontSize } from 'tiptap-extension-font-size';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

const FONT_SIZES: string[] = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '60px'];

interface TiptapEditorProps {
    modelValue?: string;
    minHeight?: string;
    maxHeight?: string;
    placeholder?: string;
    showToolbar?: boolean;
}

const props = withDefaults(defineProps<TiptapEditorProps>(), {
    modelValue: '',
    placeholder: 'Start typing...',
    minHeight: '100px',
    maxHeight: 'none',
    showToolbar: true
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const editor = useEditor({
    extensions: [
        StarterKit.configure({ heading: false, underline: false, link: false }),
        Underline,
        Heading.configure({ levels: [1, 2, 3] }),
        Link.configure({ openOnClick: false, autolink: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TextStyle,
        FontFamily,
        Color,
        Highlight.configure({ multicolor: true }),
        // tiptap-extension-font-size bundles its own @tiptap/core types, so its
        // Extension generic is structurally distinct from the one StarterKit uses.
        FontSize as unknown as AnyExtension,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell
    ],
    content: props.modelValue,
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert max-w-none focus:outline-none'
        }
    },
    onUpdate: ({ editor }) => {
        emit('update:modelValue', editor.getHTML());
    }
});

const convertToHex = (color: string | undefined): string => {
    if (!color) return '#000000';
    if (color.startsWith('#')) return color;
    const rgba = color.match(/\d+/g);
    if (rgba) {
        return '#' + [0, 1, 2].map((index) => parseInt(rgba[index] ?? '0').toString(16).padStart(2, '0')).join('');
    }
    return '#000000';
};

const getTextColorHex = computed<string>(() => convertToHex(editor.value?.getAttributes('textStyle')?.color));

const getHighlightColorHex = computed<string>(() => convertToHex(editor.value?.getAttributes('highlight')?.color));

const setLink = (): void => {
    const previousUrl = editor.value?.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
        editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
    }
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
};

const setFontSize = (event: Event): void => {
    const size = (event.target as HTMLSelectElement).value;
    if (!size) {
        editor.value?.chain().focus().unsetFontSize().run();
    } else {
        editor.value?.chain().focus().setFontSize(size).run();
    }
};

watch(
    () => props.modelValue,
    (newValue: string | undefined) => {
        if (editor.value?.getHTML() === newValue) return;
        editor.value?.commands.setContent(newValue ?? '', { emitUpdate: false });
    }
);

onBeforeUnmount(() => editor.value?.destroy());

const editorHeight = ref(100);
const MIN_HEIGHT = props.minHeight ? parseInt(props.minHeight) : 50;
const MAX_HEIGHT = props.maxHeight ? parseInt(props.maxHeight) : 500;

const startResize = (e: MouseEvent): void => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = editorHeight.value;

    const onMove = (ev: MouseEvent) => {
        const delta = ev.clientY - startY;
        editorHeight.value = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + delta));
    };

    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
};
</script>

<template>
    <div
        v-if="editor"
        class="editor-wrapper">
        <!-- Main toolbar -->
        <div class="toolbar">
            <button
                @click="editor.chain().focus().undo().run()"
                :disabled="!editor.can().undo()"
                title="Undo">
                <i class="fas fa-undo"></i>
            </button>
            <button
                @click="editor.chain().focus().redo().run()"
                :disabled="!editor.can().redo()"
                title="Redo">
                <i class="fas fa-redo"></i>
            </button>

            <div class="divider"></div>

            <select
                @change="
                    (e) => {
                        const level = (e.target as HTMLSelectElement).value;
                        if (level === '0') editor?.chain().focus().setParagraph().run();
                        else
                            editor
                                ?.chain()
                                .focus()
                                .toggleHeading({ level: parseInt(level) as 1 | 2 | 3 })
                                .run();
                    }
                ">
                <option
                    value="0"
                    :selected="editor.isActive('paragraph')">
                    Paragraph
                </option>
                <option
                    value="1"
                    :selected="editor.isActive('heading', { level: 1 })">
                    Heading 1
                </option>
                <option
                    value="2"
                    :selected="editor.isActive('heading', { level: 2 })">
                    Heading 2
                </option>
                <option
                    value="3"
                    :selected="editor.isActive('heading', { level: 3 })">
                    Heading 3
                </option>
            </select>

            <div class="divider"></div>

            <select
                @change="
                    editor
                        .chain()
                        .focus()
                        .setFontFamily(($event.target as HTMLSelectElement).value)
                        .run()
                ">
                <option value="">Font</option>
                <option
                    value="Inter"
                    :selected="editor.isActive('textStyle', { fontFamily: 'Inter' })">
                    Inter
                </option>
                <option
                    value="Arial"
                    :selected="editor.isActive('textStyle', { fontFamily: 'Arial' })">
                    Arial
                </option>
                <option
                    value="Times New Roman"
                    :selected="editor.isActive('textStyle', { fontFamily: 'Times New Roman' })">
                    Times New Roman
                </option>
            </select>

            <select @change="setFontSize">
                <option value="">Size</option>
                <option
                    v-for="size in FONT_SIZES"
                    :key="size"
                    :value="size"
                    :selected="editor.isActive('textStyle', { fontSize: size })">
                    {{ size }}
                </option>
            </select>

            <div class="divider"></div>

            <button
                @click="editor.chain().focus().toggleBold().run()"
                :class="{ 'is-active': editor.isActive('bold') }"
                title="Bold">
                <i class="fas fa-bold"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleItalic().run()"
                :class="{ 'is-active': editor.isActive('italic') }"
                title="Italic">
                <i class="fas fa-italic"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleUnderline().run()"
                :class="{ 'is-active': editor.isActive('underline') }"
                title="Underline">
                <i class="fas fa-underline"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleStrike().run()"
                :class="{ 'is-active': editor.isActive('strike') }"
                title="Strikethrough">
                <i class="fas fa-strikethrough"></i>
            </button>

            <div class="divider"></div>

            <label title="Text Color">
                <input
                    type="color"
                    @input="
                        editor
                            .chain()
                            .focus()
                            .setColor(($event.target as HTMLInputElement).value)
                            .run()
                    "
                    :value="getTextColorHex" />
            </label>
            <label title="Highlight Color">
                <input
                    type="color"
                    @input="
                        editor
                            .chain()
                            .focus()
                            .toggleHighlight({ color: ($event.target as HTMLInputElement).value })
                            .run()
                    "
                    :value="getHighlightColorHex" />
            </label>

            <div class="divider"></div>

            <button
                @click="editor.chain().focus().setTextAlign('left').run()"
                :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
                title="Align Left">
                <i class="fas fa-align-left"></i>
            </button>
            <button
                @click="editor.chain().focus().setTextAlign('center').run()"
                :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
                title="Align Center">
                <i class="fas fa-align-center"></i>
            </button>
            <button
                @click="editor.chain().focus().setTextAlign('right').run()"
                :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
                title="Align Right">
                <i class="fas fa-align-right"></i>
            </button>
            <button
                @click="editor.chain().focus().setTextAlign('justify').run()"
                :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
                title="Justify">
                <i class="fas fa-align-justify"></i>
            </button>

            <div class="divider"></div>

            <button
                @click="editor.chain().focus().toggleBulletList().run()"
                :class="{ 'is-active': editor.isActive('bulletList') }"
                title="Bullet List">
                <i class="fas fa-list-ul"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleOrderedList().run()"
                :class="{ 'is-active': editor.isActive('orderedList') }"
                title="Ordered List">
                <i class="fas fa-list-ol"></i>
            </button>

            <div class="divider"></div>

            <button
                @click="setLink"
                :class="{ 'is-active': editor.isActive('link') }"
                title="Set Link">
                <i class="fas fa-link"></i>
            </button>
            <button
                @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
                title="Insert Table">
                <i class="fas fa-table-cells"></i>
            </button>
        </div>

        <div
            v-if="editor.isActive('table')"
            class="toolbar toolbar--table">
            <span class="toolbar__label">Table:</span>
            <button
                @click="editor.chain().focus().addColumnBefore().run()"
                title="Add Column Before">
                <i class="fas fa-table-columns"></i>
                -
            </button>
            <button
                @click="editor.chain().focus().addColumnAfter().run()"
                title="Add Column After">
                +
                <i class="fas fa-table-columns"></i>
            </button>
            <button
                @click="editor.chain().focus().addRowBefore().run()"
                title="Add Row Before">
                <i class="fas fa-table-rows"></i>
                -
            </button>
            <button
                @click="editor.chain().focus().addRowAfter().run()"
                title="Add Row After">
                +
                <i class="fas fa-table-rows"></i>
            </button>
            <button
                @click="editor.chain().focus().deleteColumn().run()"
                class="toolbar__btn--danger"
                title="Delete Column">
                <i class="fas fa-trash-can"></i>
                Col
            </button>
            <button
                @click="editor.chain().focus().deleteRow().run()"
                class="toolbar__btn--danger"
                title="Delete Row">
                <i class="fas fa-trash-can"></i>
                Row
            </button>
            <button
                @click="editor.chain().focus().deleteTable().run()"
                class="toolbar__btn--danger"
                title="Delete Table">
                <i class="fas fa-trash-can"></i>
                Table
            </button>
        </div>

        <EditorContent
            :editor="editor"
            class="editor-content"
            :style="{ height: editorHeight + 'px' }" />

        <div
            class="resize-handle"
            @mousedown="startResize"
            title="Drag to resize">
            <div class="resize-handle__dots"></div>
        </div>
    </div>
</template>

<style scoped>
.editor-wrapper {
    border: 1px solid var(--color-schedule-border-primary);
    border-radius: 0.5rem;
    overflow: hidden;
}

.dark .editor-wrapper {
    border-color: var(--color-schedule-neutral-700);
}

.toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-schedule-border-subtle);
    background-color: var(--color-schedule-neutral-100);
}

.dark .toolbar {
    border-bottom-color: var(--color-schedule-neutral-700);
    background-color: var(--color-schedule-neutral-900);
}

.toolbar--table {
    background-color: var(--color-schedule-neutral-100);
}

.dark .toolbar--table {
    background-color: var(--color-schedule-neutral-800);
}

.toolbar__label {
    font-size: 0.875rem;
    font-weight: 600;
    margin-right: 0.5rem;
    color: var(--color-schedule-text-secondary);
}

.dark .toolbar__label {
    color: var(--color-schedule-text-inverse);
}

.toolbar button,
.toolbar select {
    height: 2rem;
    min-width: 2rem;
    padding: 0 0.5rem;
    border-radius: 0.375rem;
    border: none;
    background: transparent;
    cursor: pointer;
    transition:
        background-color 0.2s,
        color 0.2s;
    color: var(--color-schedule-text-primary);
}

.dark .toolbar button,
.dark .toolbar select {
    color: var(--color-schedule-text-inverse);
}

.toolbar button:hover,
.toolbar select:hover {
    background-color: var(--color-schedule-neutral-200);
}

.dark .toolbar button:hover,
.dark .toolbar select:hover {
    background-color: var(--color-schedule-neutral-700);
}

.toolbar button.is-active {
    background-color: var(--color-schedule-brand-blue);
    color: #ffffff;
}

.dark .toolbar button.is-active {
    background-color: var(--color-schedule-brand-blue-hover);
}

.toolbar button:disabled {
    color: var(--color-schedule-text-disabled);
    cursor: not-allowed;
}

.toolbar button:disabled:hover {
    background: transparent;
}

.toolbar .divider {
    width: 1px;
    height: 1.5rem;
    background-color: var(--color-schedule-border-subtle);
    margin: 0 0.25rem;
}

.dark .toolbar .divider {
    background-color: var(--color-schedule-neutral-700);
}

.toolbar select {
    font-size: 0.875rem;
    font-weight: 500;
}

.toolbar input[type='color'] {
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
}

.toolbar__btn--danger {
    color: var(--color-schedule-error-default) !important;
}

.editor-content {
    padding: 1rem;
    overflow-y: auto;
}

:deep(.ProseMirror) {
    color: var(--color-schedule-text-primary);
    min-height: 100%;
    outline: none;
}
:deep(.ProseMirror h1),
:deep(.ProseMirror h2),
:deep(.ProseMirror h3) {
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
}

:deep(.ProseMirror ul) {
    padding-left: 1.75rem;
    list-style-type: square;
}
:deep(.ProseMirror ol) {
    padding-left: 1.75rem;
    list-style-type: decimal;
}

:deep(.ProseMirror table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
}

:deep(.ProseMirror table td),
:deep(.ProseMirror table th) {
    border: 1px solid var(--color-schedule-border-primary);
    padding: 0.5rem;
    min-width: 60px;
    vertical-align: top;
}

.dark :deep(.ProseMirror table td),
.dark :deep(.ProseMirror table th) {
    border-color: var(--color-schedule-neutral-700);
}

:deep(.ProseMirror table th) {
    background-color: var(--color-schedule-neutral-100);
    font-weight: bold;
    color: var(--color-schedule-text-primary);
}

.dark :deep(.ProseMirror table th) {
    background-color: var(--color-schedule-neutral-800);
    color: var(--color-schedule-text-inverse);
}

:deep(.ProseMirror .selectedCell:after) {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(11, 82, 156, 0.15);
    pointer-events: none;
}

.resize-handle {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 12px;
    cursor: ns-resize;
    background-color: var(--color-schedule-neutral-100);
    border-top: 1px solid var(--color-schedule-border-subtle);
    user-select: none;
}

.dark .resize-handle {
    background-color: var(--color-schedule-neutral-900);
    border-top-color: var(--color-schedule-neutral-700);
}

.resize-handle:hover {
    background-color: var(--color-schedule-neutral-200);
}

.dark .resize-handle:hover {
    background-color: var(--color-schedule-neutral-800);
}

.resize-handle__dots {
    width: 2rem;
    height: 3px;
    border-radius: 9999px;
    background-color: var(--color-schedule-neutral-400);
}
</style>

<style>
.dark .ProseMirror {
    color: var(--color-schedule-text-inverse) !important;
}

.dark .ProseMirror h1,
.dark .ProseMirror h2,
.dark .ProseMirror h3 {
    color: var(--color-schedule-text-inverse) !important;
}

.dark .ProseMirror p,
.dark .ProseMirror li,
.dark .ProseMirror td,
.dark .ProseMirror th {
    color: var(--color-schedule-text-inverse) !important;
}

.dark .ProseMirror table th {
    background-color: var(--color-schedule-neutral-800) !important;
}

.dark .ProseMirror table td,
.dark .ProseMirror table th {
    border-color: var(--color-schedule-neutral-700) !important;
}
</style>
