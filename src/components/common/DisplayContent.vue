<script setup lang="ts">
defineProps<{
    content: string
}>()
</script>

<template>
    <div class="display-content prose max-w-none" v-html="content" />
</template>

<style scoped>
.display-content :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    border: 1px solid var(--color-schedule-border-primary);
}

.dark .display-content :deep(table) {
    border-color: var(--color-schedule-neutral-700);
}

.display-content :deep(th),
.display-content :deep(td) {
    border: 1px solid var(--color-schedule-border-primary);
    padding: 0.5rem;
    vertical-align: top;
}

.dark .display-content :deep(th),
.dark .display-content :deep(td) {
    border-color: var(--color-schedule-neutral-700);
}

.display-content :deep(th) {
    background-color: var(--color-schedule-neutral-100);
    font-weight: bold;
    text-align: left;
    color: var(--color-schedule-text-primary);
}

.dark .display-content :deep(th) {
    background-color: var(--color-schedule-neutral-800);
    color: var(--color-schedule-text-inverse);
}

.display-content :deep(hr) {
    display: none;
}

.display-content :deep(h1),
.display-content :deep(h2),
.display-content :deep(h3) {
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    color: var(--color-schedule-text-primary);
}

.dark .display-content :deep(h1),
.dark .display-content :deep(h2),
.dark .display-content :deep(h3) {
    color: var(--color-schedule-text-inverse);
}

.display-content :deep(p) {
    color: var(--color-schedule-text-primary);
}

.dark .display-content :deep(p) {
    color: var(--color-schedule-text-inverse);
}

.display-content :deep(ul),
.display-content :deep(ol) {
    padding-left: 1.75rem;
}

.display-content :deep(ul) { list-style-type: square; }
.display-content :deep(ol) { list-style-type: decimal; }

.display-content :deep(a) {
    color: var(--color-schedule-brand-blue);
    text-decoration: underline;
}

.dark .display-content :deep(a) {
    color: var(--color-schedule-text-brand-secondary);
}
</style>
