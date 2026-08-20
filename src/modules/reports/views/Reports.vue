<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { useLanguageStore } from '@/stores/languageStore';
import { useReports, type ReportTab } from '@/modules/reports/composables/useReports';
import { useClientTable } from '@/composables/useClientTable';
import ClientTableControls from '@/components/common/ClientTableControls.vue';
import type { DropdownOption } from '@/types/CommonTypes';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import PlacementSuggestions from '@/modules/scheduling/components/PlacementSuggestions.vue';
import FileText from '@/assets/icons/FileText.vue';

import {
    EXPORT_FORMAT_CSV,
    EXPORT_FORMAT_XLSX,
    STATUS_DANGER,
    STATUS_LIGHT,
    STATUS_WARNING
} from '@/config/appConfig';

/**
 * Reporting: exceptions, room utilisation, instructor workload, and a
 * term-on-term comparison.
 *
 * Exceptions is the default tab on purpose — it is the one that answers "what
 * do I have to fix today", which is why a registrar opens this screen at all.
 * The other three answer planning questions, which are asked less often.
 */
const { customizeLanguageData } = useLanguageStore();
const {
    activeTab,
    semesterId,
    compareSemesterId,
    isLoading,
    hasSemester,
    rooms,
    workload,
    exceptions,
    comparison,
    setup,
    setupLabels,
    exceptionGroups,
    semesterDropdown,
    selectTab,
    reload,
    isExporting,
    canExport,
    exportReport
} = useReports();

/**
 * Room utilisation and instructor workload are the two reports that grow with
 * the institution — every room, every teacher. Rendered whole they were a
 * thousand-row table with no way to find anything in it, so both are searched,
 * sorted and paged in the browser. The data is already loaded; only the DOM is
 * limited.
 */
const roomTable = useClientTable(
    () => rooms.value?.rows ?? [],
    ['room_code', 'room_name', 'building', 'campus'],
    { key: 'hours_per_week' }
);

const workloadTable = useClientTable(
    () => workload.value?.rows ?? [],
    ['employee_no', 'name', 'department'],
    { key: 'teaching_hours' }
);

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('reports', 'Reports') }]);

const tabs = computed<Array<{ key: ReportTab; label: string }>>(() => [
    { key: 'setup', label: customizeLanguageData('termSetup', 'Term setup') },
    { key: 'exceptions', label: customizeLanguageData('exceptions', 'Exceptions') },
    { key: 'rooms', label: customizeLanguageData('roomUtilisation', 'Room utilisation') },
    { key: 'workload', label: customizeLanguageData('instructorWorkload', 'Instructor workload') },
    { key: 'compare', label: customizeLanguageData('compareTerms', 'Compare terms') }
]);

/** A utilisation bar reads faster than a number in a column of numbers. */
const barWidth = (value: number | null) => `${Math.min(100, Math.max(0, value ?? 0))}%`;

onMounted(async () => {
    await semesterDropdown.fetchOptions();

    // Land on the current semester rather than an empty screen — it is what
    // the user wants nine times out of ten.
    const current = semesterDropdown.options.value.find((option: DropdownOption) => option.is_current);
    semesterId.value = (current ?? semesterDropdown.options.value[0])?.id ?? null;

    await reload();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="FileText" />
        </div>

        <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 class="text-text-primary text-xl font-semibold">{{ $lang.reports || 'Reports' }}</h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.reportsDesc ||
                        'What still needs fixing this term, how hard the rooms and staff are working, and how it compares with last term.'
                    }}
                </p>
            </div>

            <div class="flex flex-wrap items-end gap-3">
                <MainSelect
                    v-model="semesterId"
                    class="min-w-56"
                    :label-text="$lang.semester || 'Semester'"
                    :options="semesterDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.selectSemester || 'Select a semester'"
                    size="normal"
                    search
                    :loading="semesterDropdown.loading.value"
                    @change="reload" />
                <MainButton
                    outlined
                    :label="$lang.refresh || 'Refresh'"
                    :loading="isLoading"
                    :disabled="!hasSemester"
                    @click="reload" />
                <!--
                    Hidden rather than disabled on the compare tab: that report
                    is a paired diff, not a row list, so there is nothing a
                    spreadsheet of it would be good for.
                -->
                <MainButton
                    v-if="canExport"
                    :label="$lang.exportXlsx || 'Export Excel'"
                    severity="primary"
                    :loading="isExporting"
                    @click="exportReport(EXPORT_FORMAT_XLSX)" />
                <MainButton
                    v-if="canExport"
                    outlined
                    :label="$lang.exportCsv || 'Export CSV'"
                    :loading="isExporting"
                    @click="exportReport(EXPORT_FORMAT_CSV)" />
            </div>
        </div>

        <!-- Tabs -->
        <div class="border-border-default flex flex-wrap gap-1 border-b">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                class="cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors"
                :class="
                    activeTab === tab.key
                        ? 'border-schedule-brand-blue text-schedule-icon-brand'
                        : 'text-text-tertiary hover:text-text-secondary border-transparent'
                "
                @click="selectTab(tab.key)">
                {{ tab.label }}
            </button>
        </div>

        <!-- Every figure here is per term; without one there is nothing to show. -->
        <p
            v-if="!hasSemester"
            class="border-border-subtle text-text-tertiary rounded-2xl border border-dashed px-4 py-10 text-center text-sm">
            {{ $lang.chooseSemesterFirst || 'Choose a semester to see its figures.' }}
        </p>

        <Skeleton v-else-if="isLoading" />

        <!-- ---- Term setup checklist (C37) ---- -->
        <div
            v-else-if="activeTab === 'setup' && setup"
            class="space-y-4">
            <div
                class="rounded-2xl border p-5"
                :class="
                    setup.ready
                        ? 'border-schedule-success-500 schedule-card'
                        : 'border-schedule-warning-500 schedule-card'
                ">
                <p class="text-text-primary text-base font-semibold">
                    {{
                        setup.ready
                            ? $lang.termReady || 'This term is ready to schedule'
                            : $lang.termNotReady || 'This term is not ready to schedule yet'
                    }}
                </p>
                <p class="text-text-tertiary mt-1 text-sm">
                    {{ setup.complete }} {{ $lang.ofLabel || 'of' }} {{ setup.total }}
                    {{ $lang.stepsComplete || 'steps complete' }}
                </p>
                <div class="bg-surface-subtle mt-3 h-1.5 overflow-hidden rounded-full">
                    <div
                        class="h-full rounded-full"
                        :class="setup.ready ? 'bg-schedule-success-500' : 'bg-schedule-brand-blue'"
                        :style="{ width: `${(setup.complete / setup.total) * 100}%` }" />
                </div>
            </div>

            <ul class="border-border-default divide-border-subtle divide-y overflow-hidden rounded-2xl border">
                <li
                    v-for="step in setup.steps"
                    :key="step.key"
                    class="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                    <div class="flex min-w-0 items-start gap-3">
                        <!-- State as a shape, not only a colour. -->
                        <span
                            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs"
                            :class="
                                step.is_satisfied
                                    ? 'border-schedule-success-500 text-schedule-success-500'
                                    : step.is_optional
                                      ? 'border-border-strong text-text-tertiary'
                                      : 'border-schedule-warning-500 text-schedule-warning-500'
                            ">
                            {{ step.is_satisfied ? '✓' : '!' }}
                        </span>
                        <div class="min-w-0">
                            <p class="text-text-primary text-sm font-medium">
                                {{ setupLabels[step.key]?.label ?? step.key }}
                                <span
                                    v-if="step.is_optional"
                                    class="text-text-tertiary text-xs font-normal">
                                    · {{ $lang.optional || 'optional' }}
                                </span>
                            </p>
                            <p class="text-text-tertiary text-xs">{{ setupLabels[step.key]?.hint }}</p>
                            <!--
                                Naming the dependency is what turns a list into
                                an order — otherwise a blocked step looks
                                arbitrary rather than not-yet-reachable.
                            -->
                            <p
                                v-if="step.depends_on && !step.is_satisfied"
                                class="text-text-tertiary mt-0.5 text-xs">
                                {{ $lang.needsFirst || 'Needs' }}
                                {{ setupLabels[step.depends_on]?.label ?? step.depends_on }}
                                {{ $lang.firstLabel || 'first' }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <span class="text-text-secondary text-sm tabular-nums">{{ step.count }}</span>
                        <RouterLink
                            v-if="setupLabels[step.key]"
                            :to="setupLabels[step.key]!.path"
                            class="text-schedule-icon-brand text-xs font-medium hover:underline">
                            {{ step.is_satisfied ? $lang.review || 'Review' : $lang.setUp || 'Set up' }}
                        </RouterLink>
                    </div>
                </li>
            </ul>
        </div>

        <!-- ---- Exceptions ---- -->
        <div
            v-else-if="activeTab === 'exceptions'"
            class="space-y-4">
            <p
                v-if="exceptions && exceptions.total === 0"
                class="border-border-subtle text-text-secondary rounded-2xl border border-dashed px-4 py-10 text-center text-sm">
                {{
                    $lang.nothingOutstanding ||
                    'Nothing outstanding — every offering is scheduled and every exam is staffed.'
                }}
            </p>

            <section
                v-for="group in exceptionGroups"
                v-else
                :key="group.key"
                class="schedule-card border-border-default rounded-2xl border p-5">
                <div class="mb-1 flex flex-wrap items-center gap-3">
                    <h2 class="text-text-primary text-base font-semibold">{{ group.label }}</h2>
                    <Badge
                        :variant="(exceptions?.groups[group.key]?.length ?? 0) > 0 ? STATUS_WARNING : STATUS_LIGHT"
                        :label="String(exceptions?.groups[group.key]?.length ?? 0)" />
                </div>
                <p class="text-text-tertiary mb-3 text-xs">{{ group.hint }}</p>

                <p
                    v-if="!exceptions?.groups[group.key]?.length"
                    class="text-text-tertiary text-sm">
                    {{ $lang.noneHere || 'None.' }}
                </p>
                <ul
                    v-else
                    class="border-border-subtle divide-y rounded-xl border">
                    <li
                        v-for="row in exceptions?.groups[group.key]"
                        :key="row.id"
                        class="space-y-2 px-3 py-2">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="text-text-secondary text-sm">{{ row.label || '—' }}</span>
                            <span
                                v-if="row.detail"
                                class="text-text-tertiary text-xs tabular-nums">
                                {{ row.detail }}
                            </span>
                        </div>

                        <!--
                            Only for offerings with no timetable: that is the
                            one group where "here is where it would fit" is an
                            answer. The others need a different fix — a room, an
                            invigilator, a manual review — and offering a slot
                            would be the wrong advice.
                        -->
                        <PlacementSuggestions
                            v-if="group.key === 'unscheduled_offerings'"
                            :course-offering-id="row.id"
                            @placed="reload" />
                    </li>
                </ul>
            </section>
        </div>

        <!-- ---- Room utilisation ---- -->
        <div
            v-else-if="activeTab === 'rooms' && rooms"
            class="space-y-4">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div class="schedule-card border-border-default rounded-xl border p-4">
                    <p class="text-text-tertiary text-xs">{{ $lang.roomsInUse || 'Rooms in use' }}</p>
                    <p class="text-text-primary text-2xl font-semibold tabular-nums">
                        {{ rooms.totals.rooms_in_use }}
                        <span class="text-text-tertiary text-base">/{{ rooms.totals.room_count }}</span>
                    </p>
                </div>
                <div class="schedule-card border-border-default rounded-xl border p-4">
                    <p class="text-text-tertiary text-xs">{{ $lang.roomsUnused || 'Never used' }}</p>
                    <p class="text-text-primary text-2xl font-semibold tabular-nums">{{ rooms.totals.rooms_unused }}</p>
                </div>
                <div class="schedule-card border-border-default rounded-xl border p-4">
                    <p class="text-text-tertiary text-xs">{{ $lang.totalRoomHours || 'Booked hours / week' }}</p>
                    <p class="text-text-primary text-2xl font-semibold tabular-nums">{{ rooms.totals.total_hours }}</p>
                </div>
            </div>

            <ClientTableControls
                v-model:search="roomTable.search.value"
                v-model:per-page="roomTable.perPage.value"
                v-model:page="roomTable.page.value"
                :page-count="roomTable.pageCount.value"
                :total="roomTable.total.value"
                :range-start="roomTable.rangeStart.value"
                :range-end="roomTable.rangeEnd.value"
                :search-placeholder="$lang.searchRooms || 'Search by room, building or campus…'" />

            <div class="border-border-default overflow-x-auto rounded-2xl border">
                <table class="w-full min-w-[720px] text-sm">
                    <thead class="bg-surface-subtle text-text-tertiary">
                        <tr>
                            <th class="px-4 py-3 text-left font-medium">{{ $lang.room || 'Room' }}</th>
                            <th class="px-4 py-3 text-left font-medium">{{ $lang.building || 'Building' }}</th>
                            <th class="px-4 py-3 text-right font-medium">
                                {{ $lang.capacity || 'Teaching capacity (seats)' }}
                            </th>
                            <th class="px-4 py-3 text-right font-medium">{{ $lang.sessions || 'Sessions' }}</th>
                            <th class="px-4 py-3 text-right font-medium">{{ $lang.hoursPerWeek || 'Hours / week' }}</th>
                            <th class="px-4 py-3 text-left font-medium">
                                {{ $lang.seatOccupancy || 'Seat occupancy' }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-border-subtle divide-y">
                        <tr
                            v-for="row in roomTable.visible.value"
                            :key="row.room_id">
                            <td class="text-text-primary px-4 py-2.5 font-medium">{{ row.room_code }}</td>
                            <td class="text-text-secondary px-4 py-2.5">{{ row.building || '—' }}</td>
                            <td class="text-text-secondary px-4 py-2.5 text-right tabular-nums">{{ row.capacity }}</td>
                            <td class="text-text-secondary px-4 py-2.5 text-right tabular-nums">
                                {{ row.session_count }}
                            </td>
                            <td class="text-text-secondary px-4 py-2.5 text-right tabular-nums">
                                {{ row.hours_per_week }}
                            </td>
                            <td class="px-4 py-2.5">
                                <div class="flex items-center gap-2">
                                    <div class="bg-surface-subtle h-1.5 w-24 overflow-hidden rounded-full">
                                        <div
                                            class="bg-schedule-brand-blue h-full rounded-full"
                                            :style="{ width: barWidth(row.seat_occupancy) }" />
                                    </div>
                                    <span class="text-text-tertiary text-xs tabular-nums">
                                        {{ row.seat_occupancy }}%
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ---- Instructor workload ---- -->
        <div
            v-else-if="activeTab === 'workload' && workload"
            class="space-y-4">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div class="schedule-card border-border-default rounded-xl border p-4">
                    <p class="text-text-tertiary text-xs">{{ $lang.instructors || 'Instructors' }}</p>
                    <p class="text-text-primary text-2xl font-semibold tabular-nums">
                        {{ workload.totals.instructor_count }}
                    </p>
                </div>
                <div class="schedule-card border-border-default rounded-xl border p-4">
                    <p class="text-text-tertiary text-xs">{{ $lang.overLimit || 'Over their limit' }}</p>
                    <p
                        class="text-2xl font-semibold tabular-nums"
                        :class="workload.totals.over_limit > 0 ? 'text-schedule-error-500' : 'text-text-primary'">
                        {{ workload.totals.over_limit }}
                    </p>
                </div>
                <div class="schedule-card border-border-default rounded-xl border p-4">
                    <p class="text-text-tertiary text-xs">{{ $lang.noLimitSet || 'No ceiling set' }}</p>
                    <p class="text-text-primary text-2xl font-semibold tabular-nums">
                        {{ workload.totals.no_limit_set }}
                    </p>
                </div>
                <div class="schedule-card border-border-default rounded-xl border p-4">
                    <p class="text-text-tertiary text-xs">{{ $lang.teachingNothing || 'Teaching nothing' }}</p>
                    <p class="text-text-primary text-2xl font-semibold tabular-nums">
                        {{ workload.totals.unassigned }}
                    </p>
                </div>
            </div>

            <ClientTableControls
                v-model:search="workloadTable.search.value"
                v-model:per-page="workloadTable.perPage.value"
                v-model:page="workloadTable.page.value"
                :page-count="workloadTable.pageCount.value"
                :total="workloadTable.total.value"
                :range-start="workloadTable.rangeStart.value"
                :range-end="workloadTable.rangeEnd.value"
                :search-placeholder="$lang.searchInstructors || 'Search by name, employee number or department…'" />

            <div class="border-border-default overflow-x-auto rounded-2xl border">
                <table class="w-full min-w-[720px] text-sm">
                    <thead class="bg-surface-subtle text-text-tertiary">
                        <tr>
                            <th class="px-4 py-3 text-left font-medium">{{ $lang.instructor || 'Instructor' }}</th>
                            <th class="px-4 py-3 text-left font-medium">{{ $lang.department || 'Department' }}</th>
                            <th class="px-4 py-3 text-right font-medium">
                                {{ $lang.teachingHours || 'Teaching hours' }}
                            </th>
                            <th class="px-4 py-3 text-right font-medium">
                                {{ $lang.maxWeeklyHours || 'Max weekly hours' }}
                            </th>
                            <th class="px-4 py-3 text-left font-medium">{{ $lang.utilisation || 'Used' }}</th>
                            <th class="px-4 py-3 text-right font-medium">{{ $lang.invigilationDuties || 'Duties' }}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-border-subtle divide-y">
                        <tr
                            v-for="row in workloadTable.visible.value"
                            :key="row.instructor_id">
                            <td class="px-4 py-2.5">
                                <span class="text-text-primary block font-medium">{{ row.name }}</span>
                                <span class="text-text-tertiary block text-xs tabular-nums">{{ row.employee_no }}</span>
                            </td>
                            <td class="text-text-secondary px-4 py-2.5">{{ row.department || '—' }}</td>
                            <td class="text-text-secondary px-4 py-2.5 text-right tabular-nums">
                                {{ row.teaching_hours }}
                            </td>
                            <td class="text-text-secondary px-4 py-2.5 text-right tabular-nums">
                                <!-- No ceiling is not the same as a ceiling of nought. -->
                                <span v-if="row.max_weekly_hours !== null">{{ row.max_weekly_hours }}</span>
                                <span
                                    v-else
                                    class="text-text-tertiary text-xs">
                                    {{ $lang.notSet || 'not set' }}
                                </span>
                            </td>
                            <td class="px-4 py-2.5">
                                <div
                                    v-if="row.utilisation !== null"
                                    class="flex items-center gap-2">
                                    <div class="bg-surface-subtle h-1.5 w-24 overflow-hidden rounded-full">
                                        <div
                                            class="h-full rounded-full"
                                            :class="
                                                row.is_over_limit ? 'bg-schedule-error-500' : 'bg-schedule-brand-blue'
                                            "
                                            :style="{ width: barWidth(row.utilisation) }" />
                                    </div>
                                    <span class="text-text-tertiary text-xs tabular-nums">{{ row.utilisation }}%</span>
                                </div>
                                <Badge
                                    v-if="row.is_over_limit"
                                    :variant="STATUS_DANGER"
                                    :label="$lang.overLimit || 'Over limit'" />
                            </td>
                            <td class="text-text-secondary px-4 py-2.5 text-right tabular-nums">
                                {{ row.invigilation_duties }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ---- Term comparison ---- -->
        <div
            v-else-if="activeTab === 'compare'"
            class="space-y-4">
            <MainSelect
                v-model="compareSemesterId"
                class="max-w-sm"
                :label-text="$lang.compareWith || 'Compare with'"
                :options="semesterDropdown.options.value"
                option-label="name"
                option-value="id"
                :placeholder="$lang.selectSemester || 'Select a semester'"
                size="normal"
                search
                @change="reload" />

            <p
                v-if="!comparison"
                class="border-border-subtle text-text-tertiary rounded-2xl border border-dashed px-4 py-10 text-center text-sm">
                {{ $lang.pickTermToCompare || 'Pick a term to compare against.' }}
            </p>

            <div
                v-else
                class="border-border-default overflow-x-auto rounded-2xl border">
                <table class="w-full min-w-[520px] text-sm">
                    <thead class="bg-surface-subtle text-text-tertiary">
                        <tr>
                            <th class="px-4 py-3 text-left font-medium">{{ $lang.measure || 'Measure' }}</th>
                            <th class="px-4 py-3 text-right font-medium">{{ $lang.thisTerm || 'This term' }}</th>
                            <th class="px-4 py-3 text-right font-medium">
                                {{ $lang.comparedTerm || 'Compared term' }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-border-subtle divide-y">
                        <tr
                            v-for="row in [
                                {
                                    label: $lang.classSessions || 'Class sessions',
                                    a: comparison.current.sessions,
                                    b: comparison.previous.sessions
                                },
                                {
                                    label: $lang.exams || 'Exams',
                                    a: comparison.current.exams,
                                    b: comparison.previous.exams
                                },
                                {
                                    label: $lang.roomsInUse || 'Rooms in use',
                                    a: comparison.current.rooms_in_use,
                                    b: comparison.previous.rooms_in_use
                                },
                                {
                                    label: $lang.totalRoomHours || 'Booked hours / week',
                                    a: comparison.current.total_room_hours,
                                    b: comparison.previous.total_room_hours
                                },
                                {
                                    label: $lang.overLimit || 'Instructors over limit',
                                    a: comparison.current.instructors_over_limit,
                                    b: comparison.previous.instructors_over_limit
                                }
                            ]"
                            :key="row.label">
                            <td class="text-text-secondary px-4 py-2.5">{{ row.label }}</td>
                            <td class="text-text-primary px-4 py-2.5 text-right font-medium tabular-nums">
                                {{ row.a }}
                            </td>
                            <td class="text-text-secondary px-4 py-2.5 text-right tabular-nums">{{ row.b }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
