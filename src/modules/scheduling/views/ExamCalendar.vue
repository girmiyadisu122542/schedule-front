<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useExamCalendar } from '@/modules/scheduling/composables/useExamCalendar';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import PagePlaceholder from '@/components/common/PagePlaceholder.vue';

import TravelDatesCalendar from '@/assets/icons/TravelDatesCalendar.vue';
import { STATUS_LIGHT } from '@/config/appConfig';

const { customizeLanguageData } = useLanguageStore();
const { isLoading, days, isEmpty, currentSemester, load } = useExamCalendar();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('examCalendar', 'Exam Calendar') }]);

onMounted(() => {
    load();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="TravelDatesCalendar" />
        </div>

        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="text-text-primary text-xl font-semibold">{{ $lang.examCalendar || 'Exam Calendar' }}</h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.examCalendarDesc ||
                        'The published exam calendar for the current semester, day by day. Read-only.'
                    }}
                </p>
            </div>

            <Badge
                v-if="currentSemester.semester.value"
                outlined
                :variant="STATUS_LIGHT"
                :label="currentSemester.semester.value.name" />
        </div>

        <Skeleton v-if="isLoading && !days.length" />

        <PagePlaceholder
            v-else-if="isEmpty"
            :title="$lang.noPublishedExams || 'Nothing published yet'"
            :description="
                $lang.noPublishedExamsHint ||
                'Generate an exam timetable and publish its sittings — only published ones appear here.'
            " />

        <!-- One block per date; the backend already returns them in order. -->
        <div
            v-else
            class="space-y-4">
            <section
                v-for="day in days"
                :key="day.date"
                class="schedule-card border-border-default rounded-2xl border p-5">
                <header class="border-border-subtle mb-3 flex items-center justify-between border-b pb-2">
                    <h2 class="text-text-primary text-base font-semibold tabular-nums">{{ day.date }}</h2>
                    <span class="text-text-tertiary text-xs">
                        {{ day.sittings.length }} {{ $lang.sittingsLabel || 'sittings' }}
                    </span>
                </header>

                <ul class="space-y-3">
                    <li
                        v-for="sitting in day.sittings"
                        :key="sitting.id"
                        class="border-border-subtle flex flex-wrap items-start justify-between gap-3 rounded-xl border px-3 py-2">
                        <div class="min-w-0">
                            <p class="text-text-primary text-sm font-medium">
                                {{ sitting.course_offering?.name || '—' }}
                            </p>
                            <p class="text-text-tertiary mt-1 text-xs">
                                {{ sitting.room?.name || $lang.noRoom || 'No hall' }} ·
                                {{ sitting.required_invigilators }} {{ $lang.invigilators || 'Invigilators' }}
                            </p>
                        </div>

                        <div class="flex shrink-0 items-center gap-2">
                            <Badge
                                outlined
                                :variant="STATUS_LIGHT"
                                :style="{
                                    color: sitting.exam_type?.color ?? undefined,
                                    borderColor: sitting.exam_type?.color ?? undefined
                                }"
                                :label="sitting.exam_type?.name || sitting.exam_type_code || '—'" />
                            <span class="text-text-secondary text-xs tabular-nums">{{ sitting.time_range }}</span>
                        </div>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>
