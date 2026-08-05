<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useTimetable } from '@/modules/scheduling/composables/useTimetable';
import { useDropdownOptions } from '@/composables/useDropdownOptions';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import PagePlaceholder from '@/components/common/PagePlaceholder.vue';

import GridIcon from '@/assets/icons/GridIcon.vue';
import { DROPDOWN_PARAM_KEY, STATUS_LIGHT } from '@/config/appConfig';
import type { DropdownOption } from '@/types/CommonTypes';

const { customizeLanguageData } = useLanguageStore();
const { isLoading, days, isEmpty, sectionId, instructorId, currentSemester, load, applyFilters, clearFilters } =
    useTimetable();

const sectionDropdown = useDropdownOptions<DropdownOption>('/sections', { [DROPDOWN_PARAM_KEY]: true });
const instructorDropdown = useDropdownOptions<DropdownOption>('/instructors', { [DROPDOWN_PARAM_KEY]: true });

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('timetable', 'Timetable') }]);

const hasFilters = computed(() => sectionId.value !== null || instructorId.value !== null);

onMounted(() => {
    load();
    sectionDropdown.fetchOptions();
    instructorDropdown.fetchOptions();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="GridIcon" />
        </div>

        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="text-text-primary text-xl font-semibold">{{ $lang.timetable || 'Timetable' }}</h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.timetableDesc ||
                        'The published weekly timetable for the current semester. Read-only — adjustments are made on the scheduling screen.'
                    }}
                </p>
            </div>

            <Badge
                v-if="currentSemester.semester.value"
                outlined
                :variant="STATUS_LIGHT"
                :label="currentSemester.semester.value.name" />
        </div>

        <!-- ---- narrow it to one cohort or one teacher ---- -->
        <section class="schedule-card border-border-default rounded-2xl border p-6">
            <div class="flex flex-wrap items-end gap-3">
                <MainSelect
                    v-model="sectionId"
                    class="min-w-56"
                    :label-text="$lang.section || 'Section'"
                    :options="sectionDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.allSections || 'All sections'"
                    size="normal"
                    search
                    show-clear
                    :loading="sectionDropdown.loading.value" />
                <MainSelect
                    v-model="instructorId"
                    class="min-w-56"
                    :label-text="$lang.instructor || 'Instructor'"
                    :options="instructorDropdown.options.value"
                    option-label="name"
                    option-value="id"
                    :placeholder="$lang.allInstructors || 'All instructors'"
                    size="normal"
                    search
                    show-clear
                    :loading="instructorDropdown.loading.value" />
                <MainButton
                    severity="primary"
                    :label="$lang.applyFilter || 'Apply'"
                    :loading="isLoading"
                    @click="applyFilters" />
                <MainButton
                    v-if="hasFilters"
                    outlined
                    :label="$lang.clearFilter || 'Clear'"
                    @click="clearFilters" />
            </div>
        </section>

        <Skeleton v-if="isLoading && !days.length" />

        <PagePlaceholder
            v-else-if="isEmpty"
            :title="$lang.noPublishedMeetings || 'Nothing published yet'"
            :description="
                $lang.noPublishedMeetingsHint ||
                'Generate a timetable and publish its meetings — only published ones appear here.'
            " />

        <!--
            One column per weekday that actually has something on it. A day with
            no meetings is dropped rather than rendered empty.
        -->
        <div
            v-else
            class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <section
                v-for="day in days"
                :key="day.id"
                class="schedule-card border-border-default rounded-2xl border p-5">
                <header class="border-border-subtle mb-3 flex items-center justify-between border-b pb-2">
                    <h2 class="text-text-primary text-base font-semibold">{{ day.name }}</h2>
                    <span class="text-text-tertiary text-xs">
                        {{ day.meetings.length }} {{ $lang.meetingsLabel || 'meetings' }}
                    </span>
                </header>

                <ul class="space-y-3">
                    <li
                        v-for="meeting in day.meetings"
                        :key="meeting.id"
                        class="border-border-subtle rounded-xl border px-3 py-2">
                        <div class="flex items-start justify-between gap-2">
                            <span class="text-text-primary min-w-0 text-sm font-medium">
                                {{ meeting.course_offering?.name || '—' }}
                            </span>
                            <span class="text-text-secondary shrink-0 text-xs tabular-nums">
                                {{ meeting.time_range }}
                            </span>
                        </div>
                        <p class="text-text-tertiary mt-1 text-xs">
                            {{ meeting.room?.name || $lang.noRoom || 'No room' }} ·
                            {{ meeting.instructor?.name || $lang.noInstructorYet || 'No instructor yet' }}
                            <template v-if="meeting.session_type">· {{ meeting.session_type.name }}</template>
                        </p>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>
