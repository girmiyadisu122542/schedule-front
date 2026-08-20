<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import axiosInstance from '@/api/axiosInstance';
import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MultipleSelect from '@/components/common/MultipleSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import type { DepartmentForm } from '@/modules/masterData/types/department';
import type { DropdownOption } from '@/types/CommonTypes';

const props = defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    /** The row being edited, or null when creating. Scopes the room picker. */
    departmentId?: number | null;
    form: DepartmentForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const collegeDropdown = useDropdownOptions<DropdownOption>('/colleges', { [DROPDOWN_PARAM_KEY]: true });
// Only this department's own instructors may head it, so the list is asked for
// by department rather than filtered client-side. A department being CREATED has
// no id yet and therefore no instructors, which is why the picker below says so
// instead of offering an empty list with no explanation.
const headDropdown = useDropdownOptions<DropdownOption>('/user', { [DROPDOWN_PARAM_KEY]: true });

/** Re-read the candidates whenever the dialog opens on a different department. */
function fetchHeadCandidates() {
    if (!props.departmentId) {
        headDropdown.options.value = [];

        return;
    }

    headDropdown.fetchOptions(true, { instructor_of_department_id: props.departmentId });
}
const buildingDropdown = useDropdownOptions<DropdownOption>('/buildings', { [DROPDOWN_PARAM_KEY]: true });

/** A room as the picker needs it — enough to say which building and what kind. */
interface ClaimableRoom {
    id: number;
    code: string;
    name: string;
    building_id: number;
    room_type_code?: string | null;
    building?: { id: number; name: string } | null;
}

const rooms = ref<ClaimableRoom[]>([]);
const roomsLoading = ref(false);
/** Filter only — which building's rooms to list. Never part of the payload. */
const buildingFilter = ref<number | null>(null);

/**
 * Every room this department may claim: the unassigned ones plus the ones it
 * already holds. Asking the server for exactly that is what stops the picker
 * offering another department's room and being refused on save.
 */
async function fetchRooms() {
    roomsLoading.value = true;
    try {
        const response = await axiosInstance.get('/rooms', {
            params: {
                is_active: true,
                claimable_by_department_id: props.departmentId ?? 0,
                limit: 500
            }
        });
        rooms.value = response.data.data ?? [];
    } finally {
        roomsLoading.value = false;
    }
}

/**
 * The options the multiselect shows.
 *
 * Filtered to the chosen building, UNION whatever is already selected. The
 * union matters: the component derives its chips from `options`, so a room
 * picked in another building would vanish from view — and "Select All" would
 * quietly drop it — if the list were narrowed to the current building alone.
 */
const roomOptions = computed(() =>
    rooms.value
        .filter(
            (room) =>
                !buildingFilter.value ||
                room.building_id === buildingFilter.value ||
                props.form.room_ids.includes(room.id)
        )
        .map((room) => ({
            id: room.id,
            // "NB-301 · Lab · New Block" — the kind matters as much as the
            // place, since a department picks lab and class rooms together.
            label: [room.name || room.code, room.room_type_code, room.building?.name]
                .filter(Boolean)
                .join(' · ')
        }))
);

onMounted(() => {
    collegeDropdown.fetchOptions();
    fetchHeadCandidates();
    buildingDropdown.fetchOptions();
});

// Re-read on open: another department may have released or taken a room since
// this dialog was last used.
watch(
    () => [props.visible, props.departmentId],
    ([isVisible]) => {
        if (isVisible) {
            buildingFilter.value = null;
            fetchRooms();
            fetchHeadCandidates();
        }
    },
    { immediate: true }
);
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editDepartment || 'Edit Department' : $lang.createDepartment || 'Create Department'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.departmentInformation || 'Department Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.name"
                        :label="$lang.name || 'Name'"
                        :placeholder="$lang.enterDepartmentName || 'e.g. Computer Science'"
                        :invalid="!!errors.name"
                        :message="errors.name"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.code"
                        :label="$lang.code || 'Code'"
                        :placeholder="$lang.leaveBlankToAutoGenerate || 'Leave blank to auto-generate'"
                        :invalid="!!errors.code"
                        :message="errors.code"
                        message-type="error"
                        size="normal" />
                    <MainSelect
                        v-model="form.college_id"
                        :label-text="$lang.college || 'College'"
                        :options="collegeDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectCollege || 'Select a college'"
                        :invalid="!!errors.college_id"
                        :message="errors.college_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="collegeDropdown.loading.value"
                        @refresh="collegeDropdown.fetchOptions(true)" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.approvalRouting || 'Approval Routing' }}
                </h3>

                <MainSelect
                    v-model="form.head_user_id"
                    :label-text="$lang.departmentHead || 'Department head'"
                    :options="headDropdown.options.value"
                    option-label="full_name"
                    option-value="id"
                    :placeholder="
                        departmentId
                            ? $lang.selectDepartmentHead || 'Select the head (optional)'
                            : $lang.saveDepartmentFirst || 'Save the department first, then assign its head'
                    "
                    :disabled="!departmentId"
                    :invalid="!!errors.head_user_id"
                    :message="errors.head_user_id"
                    message-type="error"
                    size="normal"
                    search
                    show-clear
                    show-refresh
                    :loading="headDropdown.loading.value"
                    :helper-message="
                        departmentId
                            ? $lang.headRoutingHint ||
                              'Only this department\'s own instructors can head it. Names who the department-approval step goes to; permission to act still comes from the user\'s role.'
                            : $lang.headAfterSaveHint ||
                              'A head is chosen from the department\'s own instructors, so this can be set once the department exists and has staff.'
                    "
                    @refresh="fetchHeadCandidates()" />

                <ToggleSwitch
                    v-model="form.is_active"
                    :label="$lang.active || 'Active'"
                    has-border />
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.rooms || 'Rooms' }}
                </h3>
                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.departmentRoomsHint ||
                        'Classes and exams for this department are scheduled only in these rooms. Pick a building, then its lecture rooms and labs; repeat for as many buildings as the department uses.'
                    }}
                </p>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <!-- A filter for the list below, not a saved field. -->
                    <MainSelect
                        v-model="buildingFilter"
                        :label-text="$lang.building || 'Building'"
                        :options="buildingDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.allBuildings || 'All buildings'"
                        size="normal"
                        search
                        show-clear
                        :loading="buildingDropdown.loading.value" />

                    <MultipleSelect
                        v-model="form.room_ids"
                        :label-text="$lang.assignedRooms || 'Assigned rooms'"
                        :options="roomOptions"
                        option-label="label"
                        option-value="id"
                        :placeholder="$lang.selectRooms || 'Select rooms'"
                        :invalid="!!errors.room_ids"
                        :message="errors.room_ids"
                        message-type="error"
                        size="normal"
                        search
                        show-clear
                        show-refresh
                        :loading="roomsLoading"
                        @refresh="fetchRooms" />
                </div>

                <p class="text-text-tertiary text-xs">
                    {{
                        $lang.departmentNoRoomsHint ||
                        'Leave this empty if the department has no rooms of its own — its classes are still scheduled, carrying the course and the time, with the room filled in later.'
                    }}
                </p>
            </section>
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-end gap-3">
                <MainButton
                    outlined
                    :label="$lang.cancel || 'Cancel'"
                    @click="emit('update:visible', false)" />
                <MainButton
                    :label="isEditing ? $lang.saveChanges || 'Save Changes' : $lang.save || 'Save'"
                    severity="primary"
                    :loading="isSaving"
                    @click="emit('save')" />
            </div>
        </template>
    </MainDialog>
</template>
