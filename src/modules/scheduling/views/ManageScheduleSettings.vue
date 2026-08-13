<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useScheduleSetting } from '@/modules/scheduling/composables/useScheduleSetting';

import Badge from '@/components/common/Badge.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainButton from '@/components/common/MainButton.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import ScheduleSettingFormDialog from '@/modules/scheduling/components/ScheduleSettingFormDialog.vue';

import ClockTimeTimerArrow from '@/assets/icons/ClockTimeTimerArrow.vue';
import EditIcon from '@/assets/icons/EditIcon.vue';
import { STATUS_LIGHT, STATUS_SUCCESS } from '@/config/appConfig';
import type { ScheduleSetting } from '@/modules/scheduling/types/scheduleSetting';

const { customizeLanguageData } = useLanguageStore();
const {
    isLoading,
    settings,
    studyModes,
    schedulingConstants,
    unconfiguredModes,
    dialogVisible,
    load,
    openCreateDialog,
    openEditDialog
} = useScheduleSetting();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('scheduleSettings', 'Schedule Settings') }]);

/** Weekday names for a setting's teaching days, in week order. */
const dayNames = (setting: ScheduleSetting) =>
    (setting.teaching_days ?? []).map((day) => schedulingConstants.dayName(day)).join(' · ');

/** The same for its exam days, which are commonly wider. */
const examDayNames = (setting: ScheduleSetting) =>
    (setting.exam_days ?? []).map((day) => schedulingConstants.dayName(day)).join(' · ');

onMounted(() => {
    load();
    // Both catalogues live inside shared composables, whose auto-fetch never
    // fires — pull them explicitly.
    studyModes.refetch();
    schedulingConstants.load();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="ClockTimeTimerArrow" />
        </div>

        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.scheduleSettings || 'Schedule Settings' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.scheduleSettingsDesc ||
                        'The grid automatic scheduling places into — teaching days, the day window, how long a period runs and when lunch is. One per study mode, so extension students can sit at the weekend while regular students sit on weekdays.'
                    }}
                </p>
            </div>

            <MainButton
                v-if="$can('createScheduleSetting') && unconfiguredModes.length"
                severity="primary"
                :label="$lang.createScheduleSetting || 'Create Schedule Setting'"
                @click="openCreateDialog" />
        </div>

        <Skeleton
            v-if="isLoading && !settings.length"
            height="16rem" />

        <p
            v-else-if="!settings.length"
            class="schedule-card border-border-default text-text-tertiary rounded-2xl border border-dashed p-10 text-center text-sm">
            {{
                $lang.noScheduleSettings ||
                'No grids configured yet — scheduling falls back to the built-in weekday timetable.'
            }}
        </p>

        <!-- One card per study mode: the inputs, then the grid they produce. -->
        <div
            v-else
            class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section
                v-for="setting in settings"
                :key="setting.id"
                class="schedule-card border-border-default rounded-2xl border p-5">
                <header
                    class="border-border-subtle mb-4 flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="text-text-primary text-base font-semibold">
                                {{ setting.study_mode?.name || setting.study_mode_code || '—' }}
                            </h2>
                            <Badge
                                outlined
                                :variant="setting.is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                                :label="setting.is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'" />
                        </div>
                        <p class="text-text-tertiary mt-1 text-xs">{{ dayNames(setting) }}</p>
                    </div>

                    <MainButton
                        v-if="$can('updateScheduleSetting')"
                        outlined
                        size="small"
                        :icon="EditIcon"
                        :label="$lang.edit || 'Edit'"
                        @click="openEditDialog(setting)" />
                </header>

                <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                        <dt class="text-text-tertiary text-xs">{{ $lang.dayStart || 'Day starts' }}</dt>
                        <dd class="text-text-primary text-sm font-medium tabular-nums">{{ setting.day_start }}</dd>
                    </div>
                    <div>
                        <dt class="text-text-tertiary text-xs">{{ $lang.dayEnd || 'Day ends' }}</dt>
                        <dd class="text-text-primary text-sm font-medium tabular-nums">{{ setting.day_end }}</dd>
                    </div>
                    <div>
                        <dt class="text-text-tertiary text-xs">{{ $lang.periodMinutes || 'Period' }}</dt>
                        <dd class="text-text-primary text-sm font-medium tabular-nums">
                            {{ setting.period_minutes }}′ / {{ setting.break_minutes }}′
                        </dd>
                    </div>
                    <div>
                        <dt class="text-text-tertiary text-xs">{{ $lang.lunch || 'Lunch' }}</dt>
                        <dd class="text-text-primary text-sm font-medium tabular-nums">
                            {{ setting.lunch_start ? `${setting.lunch_start}–${setting.lunch_end}` : '—' }}
                        </dd>
                    </div>
                </dl>

                <!-- The grids themselves — what the generators will place into. -->
                <div class="border-border-subtle mt-4 border-t pt-3">
                    <p class="text-text-tertiary mb-2 text-xs">
                        {{ $lang.periodsPreview || 'Periods this produces' }}
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                        <span
                            v-for="period in setting.periods"
                            :key="period.start"
                            class="bg-surface-subtle text-text-secondary rounded-md px-2 py-1 text-xs tabular-nums">
                            {{ period.start }}–{{ period.end }}
                        </span>
                        <span
                            v-if="!setting.periods?.length"
                            class="text-text-tertiary text-xs">
                            {{ $lang.noPeriodsProduced || 'These settings produce no periods.' }}
                        </span>
                    </div>
                </div>

                <!-- Exams keep their own days, window and length. -->
                <div class="border-border-subtle mt-3 border-t pt-3">
                    <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                        <p class="text-text-tertiary text-xs">
                            {{ $lang.examWindowsPreview || 'Exam sittings at the default length' }}
                        </p>
                        <p class="text-text-tertiary text-xs">
                            {{ examDayNames(setting) }} · {{ setting.exam_duration_minutes }}′ ·
                            {{ setting.exam_period_days }}
                            {{ $lang.daysLabel || 'days' }}
                        </p>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                        <span
                            v-for="window in setting.exam_windows"
                            :key="window.start"
                            class="bg-surface-subtle text-text-secondary rounded-md px-2 py-1 text-xs tabular-nums">
                            {{ window.start }}–{{ window.end }}
                        </span>
                        <span
                            v-if="!setting.exam_windows?.length"
                            class="text-text-tertiary text-xs">
                            {{ $lang.noExamWindows || 'No sittings fit in the exam day.' }}
                        </span>
                    </div>
                </div>
            </section>
        </div>

        <ScheduleSettingFormDialog v-model:visible="dialogVisible" />
    </div>
</template>
