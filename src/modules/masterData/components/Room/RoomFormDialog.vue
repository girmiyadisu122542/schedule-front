<script setup lang="ts">
import { onMounted } from 'vue';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import MainButton from '@/components/common/MainButton.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useLookupValues } from '@/composables/useLookupValues';
import { DROPDOWN_PARAM_KEY } from '@/config/appConfig';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';
import type { RoomForm } from '@/modules/masterData/types/room';
import type { DropdownOption } from '@/types/CommonTypes';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: RoomForm;
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void;
    (event: 'save'): void;
}>();

const buildingDropdown = useDropdownOptions<DropdownOption>('/buildings', { [DROPDOWN_PARAM_KEY]: true });
const roomTypes = useLookupValues(LOOKUP_TYPE.ROOM_TYPE);

onMounted(() => {
    buildingDropdown.fetchOptions();
});
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editRoom || 'Edit Room' : $lang.createRoom || 'Create Room'"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.roomInformation || 'Room Information' }}
                </h3>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputText
                        v-model="form.code"
                        :label="$lang.code || 'Code'"
                        :placeholder="$lang.enterRoomCode || 'e.g. NB-301'"
                        :invalid="!!errors.code"
                        :message="errors.code"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.name"
                        :label="$lang.name || 'Name'"
                        :placeholder="$lang.enterRoomName || 'Optional — defaults to the code'"
                        :invalid="!!errors.name"
                        :message="errors.name"
                        message-type="error"
                        size="normal" />
                    <MainSelect
                        v-model="form.building_id"
                        :label-text="$lang.building || 'Building'"
                        :options="buildingDropdown.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectBuilding || 'Select a building'"
                        :invalid="!!errors.building_id"
                        :message="errors.building_id"
                        message-type="error"
                        size="normal"
                        is-required
                        search
                        show-refresh
                        :loading="buildingDropdown.loading.value"
                        @refresh="buildingDropdown.fetchOptions(true)" />
                    <MainSelect
                        v-model="form.room_type_lookup_value_id"
                        :label-text="$lang.roomType || 'Room type'"
                        :options="roomTypes.options.value"
                        option-label="name"
                        option-value="id"
                        :placeholder="$lang.selectRoomType || 'Select a room type'"
                        :invalid="!!errors.room_type_lookup_value_id"
                        :message="errors.room_type_lookup_value_id"
                        message-type="error"
                        size="normal"
                        is-required
                        :loading="roomTypes.loading.value" />
                    <InputText
                        v-model="form.floor"
                        :label="$lang.floor || 'Floor'"
                        :placeholder="$lang.enterFloor || 'e.g. 3 (negative = basement)'"
                        :invalid="!!errors.floor"
                        :message="errors.floor"
                        message-type="error"
                        size="normal" />
                    <InputText
                        v-model="form.capacity"
                        :label="$lang.capacity || 'Teaching capacity'"
                        :placeholder="$lang.enterCapacity || 'e.g. 60'"
                        :invalid="!!errors.capacity"
                        :message="errors.capacity"
                        message-type="error"
                        size="normal" />
                </div>
            </section>

            <section class="border-border-subtle space-y-4 border-t pt-6">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.examUse || 'Exam Use' }}
                </h3>

                <!--
                    A use-flag independent of the room type: a large lecture hall may
                    serve as an exam venue, so eligibility is not derived from the type.
                -->
                <ToggleSwitch
                    v-model="form.is_exam_venue"
                    :label="$lang.examVenue || 'Exam venue'"
                    has-border />

                <InputText
                    v-if="form.is_exam_venue"
                    v-model="form.exam_capacity"
                    :label="$lang.examCapacity || 'Exam capacity'"
                    :placeholder="$lang.enterExamCapacity || 'Spaced seating — usually about half'"
                    :invalid="!!errors.exam_capacity"
                    :message="errors.exam_capacity"
                    message-type="error"
                    size="normal"
                    :helper-message="
                        $lang.examCapacityHint || 'Spaced exam seating uses roughly half a hall\'s teaching capacity.'
                    " />

                <ToggleSwitch
                    v-model="form.is_active"
                    :label="$lang.active || 'Active'"
                    has-border />
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
