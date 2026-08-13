<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { RouterLink } from 'vue-router';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import Badge from '@/components/common/Badge.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useGeneration, type GenerationMode } from '@/modules/scheduling/composables/useGeneration';
import { useLookupValues } from '@/composables/useLookupValues';
import { EXAM_TYPE_LOOKUP_TYPE } from '@/modules/scheduling/constants/classScheduleStatus';
import { DROPDOWN_PARAM_KEY, STATUS_SUCCESS, STATUS_WARNING, STATUS_LIGHT } from '@/config/appConfig';
import type { DropdownOption } from '@/types/CommonTypes';

const props = withDefaults(defineProps<{ mode?: GenerationMode; title?: string; hint?: string }>(), {
    mode: 'class',
    title: '',
    hint: ''
});

const emit = defineEmits<{ (event: 'generated', semesterId: number): void }>();

// One state per mode, so a class run and an exam run never overwrite each other.
const { isGenerating, run, isRunning, placed, unplaced, skipped, generate } = useGeneration(props.mode);

const semesterId = ref<number | null>(null);
const examTypeId = ref<number | null>(null);
const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });
const examTypes = useLookupValues(EXAM_TYPE_LOOKUP_TYPE);

const isExamMode = computed(() => props.mode === 'exam');
const canGenerate = computed(() => !!semesterId.value && !isGenerating.value);

/** What one placed entry produced: meetings for a class run, a date for an exam. */
const placedDetail = (item: { meetings?: number; exam_date?: string }) => item.meetings ?? item.exam_date ?? '';

const runGeneration = async () => {
    if (!semesterId.value) return;

    const finished = await generate(semesterId.value, isExamMode.value ? examTypeId.value : null);
    if (finished) {
        emit('generated', semesterId.value);
    }
};

onMounted(() => {
    semesterDropdown.fetchOptions();
    if (isExamMode.value) {
        examTypes.refetch();
    }
});
</script>

<template>
    <section class="schedule-card border-border-default space-y-4 rounded-2xl border p-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
            <div class="min-w-0">
                <h2 class="text-text-primary text-base font-semibold">
                    {{ title || $lang.generateTimetable || 'Generate the class timetable' }}
                </h2>
                <p class="text-text-tertiary mt-1 text-sm">
                    {{
                        hint ||
                        $lang.generateTimetableHint ||
                        'Every registrar-approved offering is placed into a free room and slot. Clashes are refused by the database, so nothing double-books.'
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
                    show-refresh
                    :loading="semesterDropdown.loading.value"
                    @refresh="semesterDropdown.fetchOptions(true)" />
                <!-- Exam runs default to finals; the picker is the exception. -->
                <MainSelect
                    v-if="isExamMode"
                    v-model="examTypeId"
                    class="min-w-48"
                    :label-text="$lang.examType || 'Exam type'"
                    :options="examTypes.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.finalsByDefault || 'Finals'"
                    size="normal"
                    show-clear
                    :loading="examTypes.loading.value" />
                <MainButton
                    severity="primary"
                    :label="$lang.runGeneration || 'Generate'"
                    :loading="isGenerating"
                    :disabled="!canGenerate"
                    @click="runGeneration" />
            </div>
        </div>

        <!-- ---- what the last run produced ---- -->
        <div
            v-if="run"
            class="border-border-subtle space-y-4 border-t pt-4">
            <div class="flex flex-wrap items-center gap-3">
                <Badge
                    outlined
                    :variant="STATUS_LIGHT"
                    :style="{
                        color: run.status?.color ?? undefined,
                        borderColor: run.status?.color ?? undefined
                    }"
                    :label="run.status?.name || run.status_code || '—'" />
                <span class="text-text-secondary text-sm">
                    {{ run.scheduled_count }}
                    {{
                        isExamMode
                            ? $lang.sittingsPlaced || 'schedules placed'
                            : $lang.meetingsPlaced || 'schedules placed'
                    }}
                </span>
                <span
                    v-if="run.unplaced_count"
                    class="text-text-secondary text-sm">
                    · {{ run.unplaced_count }} {{ $lang.offeringsUnplaced || 'offerings unplaced' }}
                </span>
                <span
                    v-if="isRunning"
                    class="text-text-tertiary text-sm">
                    {{ $lang.generationInProgress || 'Still running…' }}
                </span>
                <span
                    v-else-if="run.duration_seconds !== null"
                    class="text-text-tertiary text-sm">
                    · {{ run.duration_seconds }}s
                </span>

                <!-- The run row keeps the full per-offering breakdown. -->
                <RouterLink
                    :to="`/scheduling/generation-runs/${run.uuid}`"
                    class="text-schedule-icon-brand ml-auto text-sm font-medium hover:underline">
                    {{ $lang.viewDetails || 'View details' }}
                </RouterLink>
            </div>

            <!--
                Unplaced offerings are the point of the run row: they are the
                work a human still has to do, so they get their own list rather
                than being buried in the timetable.
            -->
            <div
                v-if="unplaced.length"
                class="space-y-2">
                <h3 class="text-text-primary text-sm font-semibold">
                    {{ $lang.unplacedOfferings || 'Could not be placed' }}
                </h3>
                <ul class="space-y-1">
                    <li
                        v-for="item in unplaced"
                        :key="item.course_offering_id"
                        class="border-border-subtle flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                        <span class="text-text-secondary min-w-0 text-sm">{{ item.label }}</span>
                        <span class="flex items-center gap-2">
                            <Badge
                                :variant="STATUS_WARNING"
                                :label="`${item.placed}/${item.requested}`" />
                            <span class="text-text-tertiary text-xs">{{ item.reason }}</span>
                        </span>
                    </li>
                </ul>
            </div>

            <div
                v-if="skipped.length"
                class="space-y-2">
                <h3 class="text-text-primary text-sm font-semibold">
                    {{ $lang.skippedOfferings || 'Already on the timetable' }}
                </h3>
                <ul class="text-text-tertiary space-y-1 text-sm">
                    <li
                        v-for="item in skipped"
                        :key="item.course_offering_id">
                        {{ item.label }}
                    </li>
                </ul>
            </div>

            <div
                v-if="placed.length"
                class="flex flex-wrap gap-2">
                <Badge
                    v-for="item in placed"
                    :key="item.course_offering_id"
                    :variant="STATUS_SUCCESS"
                    :label="`${item.label} · ${placedDetail(item)}`" />
            </div>
        </div>
    </section>
</template>
