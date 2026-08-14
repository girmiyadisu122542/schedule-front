<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { useSchedulingConstants } from '@/modules/scheduling/composables/useSchedulingConstants';
import {
    createClassSchedule,
    fetchPlacementSuggestions,
    type PlacementSuggestion
} from '@/modules/scheduling/services/classScheduleService';
import { readApiErrorMessage } from '@/utils/apiError';

import MainButton from '@/components/common/MainButton.vue';

/**
 * Where an offering the generator could not place would fit (C24).
 *
 * A reason code says what went wrong; this says what to do about it, which is
 * the difference between reporting a conflict and resolving one.
 *
 * Collapsed until asked for: the search walks the whole candidate space, and
 * running it for every unplaced row on a page would be slow and mostly unread.
 */
const props = defineProps<{
    courseOfferingId: number;
    /** Which instructor the placement should carry, from the offering. */
    instructorId?: number | null;
}>();

const emit = defineEmits<{ (e: 'placed'): void }>();

const { customizeLanguageData } = useLanguageStore();
const schedulingConstants = useSchedulingConstants();

const suggestions = ref<PlacementSuggestion[] | null>(null);
const isLoading = ref(false);
const placingKey = ref<string | null>(null);

const label = (key: string, fallback: string) => customizeLanguageData(key, fallback);
const genericError = (error: unknown) =>
    readApiErrorMessage(error, label('somethingWentWrong', 'Something went wrong'));

const keyOf = (suggestion: PlacementSuggestion) =>
    `${suggestion.day_of_week}-${suggestion.start_time}-${suggestion.room_id}`;

const load = async () => {
    isLoading.value = true;
    try {
        suggestions.value = await fetchPlacementSuggestions(props.courseOfferingId);
    } catch (error: unknown) {
        toast.error(genericError(error));
        suggestions.value = [];
    } finally {
        isLoading.value = false;
    }
};

/**
 * Take one suggestion.
 *
 * It goes through the ordinary create endpoint, so a slot that has been taken
 * since the list was drawn is refused by the database rather than silently
 * double-booked. On that failure the list is reloaded, because it is now known
 * to be out of date.
 */
const place = async (suggestion: PlacementSuggestion) => {
    placingKey.value = keyOf(suggestion);

    try {
        const result = await createClassSchedule({
            course_offering_id: props.courseOfferingId,
            instructor_id: props.instructorId ?? null,
            room_id: suggestion.room_id,
            day_of_week: suggestion.day_of_week,
            start_time: suggestion.start_time,
            end_time: suggestion.end_time
        });

        toast.success(result.message ?? label('savedSuccessfully', 'Saved successfully'));
        emit('placed');
        await load();
    } catch (error: unknown) {
        toast.error(genericError(error));
        // Someone took it first — what is on screen is stale, so redraw it.
        await load();
    } finally {
        placingKey.value = null;
    }
};
</script>

<template>
    <div class="space-y-2">
        <MainButton
            v-if="suggestions === null"
            text
            size="small"
            :label="$lang.whereWouldItFit || 'Where would it fit?'"
            :loading="isLoading"
            @click="load" />

        <template v-else>
            <p
                v-if="!suggestions.length"
                class="text-text-tertiary text-xs">
                {{
                    $lang.noFreeSlots ||
                    'No free slot fits it as things stand. Freeing a room or moving another session would be needed.'
                }}
            </p>

            <ul
                v-else
                class="border-border-subtle divide-y rounded-xl border">
                <li
                    v-for="suggestion in suggestions"
                    :key="keyOf(suggestion)"
                    class="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span class="text-text-secondary text-sm">
                        <span class="text-text-primary font-medium">
                            {{ schedulingConstants.dayName(suggestion.day_of_week) }}
                        </span>
                        <span class="tabular-nums">{{ suggestion.start_time }}–{{ suggestion.end_time }}</span>
                        · {{ suggestion.room_code }}
                        <span class="text-text-tertiary text-xs">
                            ({{ $lang.capacity || 'Teaching capacity (seats)' }} {{ suggestion.capacity }})
                        </span>
                    </span>
                    <MainButton
                        outlined
                        size="small"
                        :label="$lang.placeHere || 'Place here'"
                        :loading="placingKey === keyOf(suggestion)"
                        @click="place(suggestion)" />
                </li>
            </ul>
        </template>
    </div>
</template>
