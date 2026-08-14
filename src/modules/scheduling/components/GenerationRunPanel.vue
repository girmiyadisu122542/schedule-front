<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { RouterLink } from 'vue-router';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import PlacementSuggestions from '@/modules/scheduling/components/PlacementSuggestions.vue';
import Badge from '@/components/common/Badge.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useGeneration, type GenerationMode } from '@/modules/scheduling/composables/useGeneration';
import { useLookupValues } from '@/composables/useLookupValues';
import { EXAM_TYPE_LOOKUP_TYPE } from '@/modules/scheduling/constants/classScheduleStatus';
import { DROPDOWN_PARAM_KEY, STATUS_SUCCESS, STATUS_WARNING } from '@/config/appConfig';
import type { DropdownOption } from '@/types/CommonTypes';

const props = withDefaults(defineProps<{ mode?: GenerationMode; title?: string; hint?: string }>(), {
    mode: 'class',
    title: '',
    hint: ''
});

const emit = defineEmits<{ (event: 'generated', semesterId: number): void }>();

// One state per mode, so a class run and an exam run never overwrite each other.
const { customizeLanguageData } = useLanguageStore();
const { isGenerating, run, isRunning, isDryRun, placed, unplaced, skipped, generate } = useGeneration(props.mode);

const semesterId = ref<number | null>(null);
const examTypeId = ref<number | null>(null);
const semesterDropdown = useDropdownOptions<DropdownOption>('/semesters', { [DROPDOWN_PARAM_KEY]: true });
const examTypes = useLookupValues(EXAM_TYPE_LOOKUP_TYPE);

const isExamMode = computed(() => props.mode === 'exam');
const canGenerate = computed(() => !!semesterId.value && !isGenerating.value);

/** What one placed entry produced: sessions for a class run, a date for an exam. */
/**
 * What a placed row shows: how many sessions were laid down for a class run,
 * or the date for an exam run.
 *
 * `meetings` is the summary jsonb's old name for `sessions`. Runs recorded
 * before the rename still carry it, so both are read — dropping the old name
 * would blank this column out for every historical run.
 */
const placedDetail = (item: { sessions?: number; meetings?: number; exam_date?: string }) =>
    item.sessions ?? item.meetings ?? item.exam_date ?? '';

/**
 * Run the generator, for real or as a rehearsal (C42).
 *
 * A rehearsal reports exactly what a real run would place and then leaves the
 * timetable untouched, so nothing needs refreshing afterwards — and emitting
 * `generated` would make the caller reload a list that has not changed.
 */
/**
 * A generation reason code in plain language (C38).
 *
 * The codes are precise and meaningless to a registrar: `cs_no_room_clash`
 * describes a database constraint, not a problem anyone can act on. Unknown
 * codes fall through unchanged rather than being hidden, so a new one is
 * visible instead of silently blank.
 */
const REASONS: Record<string, string> = {
    no_room_large_enough: 'No room is big enough for this section',
    no_free_slot_found: 'Every slot in the week is already taken',
    instructor_over_weekly_limit: 'The instructor would go over their weekly teaching hours',
    cross_listed_section_busy: 'A cross-listed section is already in class then',
    cohort_would_cross_campus: 'The section would have to cross campus between periods',
    cs_no_room_clash: 'The room is already booked at every time that would work',
    cs_no_instructor_clash: 'The instructor is already teaching at every time that would work',
    cs_no_section_clash: 'The section is already in class at every time that would work',
    no_exam_venue_large_enough: 'No hall — even several together — seats this section',
    cohort_has_too_many_exams_that_day: 'The section already has its limit of exams on every free day',
    exams_too_close_together: 'Every free window leaves too little rest between exams',
    semester_has_no_exam_period: 'This semester has no exam period set',
    no_free_exam_slot_found: 'Every hall is booked for the whole exam period',
    already_published: 'Already published — left alone'
};

// The backend catalogue wins where it has the key — the same reason codes are
// also 422 messages there, so the two never drift apart — then the local map,
// then the raw code so a new one is visible rather than blank.
const reasonText = (reason?: string | null) => (reason ? customizeLanguageData(reason, REASONS[reason] ?? reason) : '');

const runGeneration = async (dryRun = false) => {
    if (!semesterId.value) return;

    const finished = await generate(semesterId.value, isExamMode.value ? examTypeId.value : null, dryRun);
    if (finished && !dryRun) {
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
                <!--
                    Rehearse first, commit second — in that reading order,
                    because trying it is the safe option and should not be the
                    one users have to go looking for.
                -->
                <MainButton
                    outlined
                    :label="$lang.tryGeneration || 'Try it'"
                    :tooltip="$lang.tryGenerationHint || 'See what would be scheduled without changing anything'"
                    :loading="isGenerating"
                    :disabled="!canGenerate"
                    @click="runGeneration(true)" />
                <MainButton
                    severity="primary"
                    :label="$lang.runGeneration || 'Generate'"
                    :loading="isGenerating"
                    :disabled="!canGenerate"
                    @click="runGeneration(false)" />
            </div>
        </div>

        <!-- ---- what the last run produced ---- -->
        <div
            v-if="run"
            class="border-border-subtle space-y-4 border-t pt-4">
            <!--
                Without this banner a rehearsal reads exactly like a real run:
                same counts, same lists. The user would believe the timetable
                had changed when nothing was written.
            -->
            <p
                v-if="isDryRun"
                class="border-schedule-brand-blue text-schedule-icon-brand rounded-xl border border-dashed px-3 py-2 text-xs">
                {{
                    $lang.dryRunNotice ||
                    'This was a rehearsal — nothing was scheduled. These are the placements a real run would make now.'
                }}
            </p>
            <div class="flex flex-wrap items-center gap-3">
                <StatusBadge
                    :value="run.status"
                    :fallback="run.status_code" />
                <span class="text-text-secondary text-sm">
                    {{ run.scheduled_count }}
                    {{
                        isExamMode
                            ? $lang.sittingsPlaced || 'schedules placed'
                            : $lang.classSessionsPlaced || 'schedules placed'
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
                        class="border-border-subtle space-y-2 rounded-lg border px-3 py-2">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="text-text-secondary min-w-0 text-sm">{{ item.label }}</span>
                            <span class="flex items-center gap-2">
                                <Badge
                                    :variant="STATUS_WARNING"
                                    :label="`${item.placed}/${item.requested}`" />
                                <!-- The reason in plain language, not the raw key. -->
                                <span class="text-text-tertiary text-xs">{{ reasonText(item.reason) }}</span>
                            </span>
                        </div>

                        <!--
                            Saying what went wrong is not the same as saying
                            what to do. A rehearsal is excluded: its failures
                            describe a timetable that was never written, so
                            offering to place into it would be misleading.
                        -->
                        <PlacementSuggestions
                            v-if="!isExamMode && !isDryRun"
                            :course-offering-id="item.course_offering_id"
                            @placed="emit('generated', semesterId!)" />
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
