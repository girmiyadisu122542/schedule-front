<script setup lang="ts">
import Skeleton from '@/components/common/Skeleton.vue';
import type { MasterColumn, MasterGroup, ScheduleEvent } from '@/modules/scheduling/types/calendar';

/**
 * The registrar's master timetable: every cohort on one sheet.
 *
 * Rows are sections, banded by department › programme. Columns are periods,
 * banded by weekday. A cell holds whatever that cohort is doing then — usually
 * one class, occasionally two, which is exactly the kind of thing this view
 * exists to make visible.
 *
 * The per-cohort week grid answers "what does this section do"; this answers
 * "is every section covered, and where are the gaps".
 */
defineProps<{
    columns: MasterColumn[];
    dayBands: { key: string; label: string; span: number }[];
    groups: MasterGroup[];
    loading?: boolean;
    selectable?: boolean;
    emptyLabel?: string;
}>();

const emit = defineEmits<{ (e: 'select', event: ScheduleEvent): void }>();
</script>

<template>
    <div class="schedule-card border-border-default overflow-hidden rounded-2xl border">
        <Skeleton
            v-if="loading && !groups.length"
            height="24rem" />

        <p
            v-else-if="!groups.length"
            class="text-text-tertiary p-10 text-center text-sm">
            {{ emptyLabel || 'Nothing scheduled' }}
        </p>

        <!-- A master timetable is wide by nature; it scrolls rather than wraps. -->
        <div
            v-else
            class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
                <!--
                    Two header rows when the columns band under something (a
                    weekday spanning its periods); one when a column IS the
                    heading, as an exam date is.
                -->
                <thead class="bg-surface-elevated">
                    <tr v-if="dayBands.length">
                        <th
                            rowspan="2"
                            class="border-border-default bg-surface-elevated text-text-secondary sticky left-0 z-10 min-w-52 border-r border-b px-3 py-2 text-xs font-semibold">
                            {{ $lang.section || 'Section' }}
                        </th>
                        <th
                            v-for="band in dayBands"
                            :key="band.key"
                            :colspan="band.span"
                            class="border-border-default text-text-primary border-r border-b px-2 py-2 text-center text-xs font-semibold last:border-r-0">
                            {{ band.label }}
                        </th>
                    </tr>

                    <tr>
                        <th
                            v-if="!dayBands.length"
                            class="border-border-default bg-surface-elevated text-text-secondary sticky left-0 z-10 min-w-52 border-r border-b px-3 py-2 text-xs font-semibold">
                            {{ $lang.section || 'Section' }}
                        </th>
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            class="border-border-subtle text-text-tertiary min-w-28 border-r border-b px-2 py-1.5 text-center text-[0.65rem] font-medium tabular-nums">
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <template
                        v-for="group in groups"
                        :key="group.key">
                        <!-- department › programme band -->
                        <tr>
                            <td
                                :colspan="columns.length + 1"
                                class="border-border-default bg-surface-subtle text-text-secondary border-y px-3 py-1.5 text-xs font-semibold">
                                {{ group.label }}
                            </td>
                        </tr>

                        <tr
                            v-for="row in group.rows"
                            :key="`${group.key}-${row.key}`"
                            class="schedule-row-hover">
                            <th
                                scope="row"
                                class="border-border-subtle bg-surface-card text-text-primary sticky left-0 z-10 border-r border-b px-3 py-2 text-xs font-medium">
                                {{ row.label }}
                                <span class="text-text-tertiary ml-1 font-normal">({{ row.total }})</span>
                            </th>

                            <td
                                v-for="column in columns"
                                :key="column.key"
                                class="border-border-subtle border-r border-b p-1 align-top">
                                <button
                                    v-for="event in row.cells[column.key] ?? []"
                                    :key="event.id"
                                    type="button"
                                    class="master-cell"
                                    :class="[
                                        event.isMuted ? 'master-cell--muted' : '',
                                        event.isTentative ? 'master-cell--tentative' : '',
                                        selectable ? 'cursor-pointer' : 'cursor-default'
                                    ]"
                                    :style="{ '--event-color': event.color || 'var(--color-schedule-brand-blue)' }"
                                    :title="`${event.tooltip || event.title} · ${event.start}–${event.end}${
                                        event.subtitle ? ' · ' + event.subtitle : ''
                                    }`"
                                    @click="selectable && emit('select', event)">
                                    <span class="master-cell__title">{{ event.title }}</span>
                                    <span
                                        v-if="event.subtitle"
                                        class="master-cell__meta">
                                        {{ event.subtitle }}
                                    </span>
                                </button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.master-cell {
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 0.05rem;
    overflow: hidden;
    border-radius: 0.375rem;
    border-left: 3px solid var(--event-color);
    background-color: color-mix(in srgb, var(--event-color) 13%, transparent);
    padding: 0.2rem 0.35rem;
    text-align: left;
}

.master-cell + .master-cell {
    margin-top: 0.2rem;
}

.master-cell__title {
    font-size: 0.65rem;
    font-weight: 600;
    line-height: 0.9rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.master-cell__meta {
    font-size: 0.6rem;
    line-height: 0.85rem;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.master-cell--tentative {
    border: 1px dashed color-mix(in srgb, var(--event-color) 55%, transparent);
    border-left: 3px solid var(--event-color);
    background-color: transparent;
}

.master-cell--muted {
    opacity: 0.55;
}

.master-cell--muted .master-cell__title {
    text-decoration: line-through;
}
</style>
