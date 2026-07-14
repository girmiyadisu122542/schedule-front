<script setup lang="ts">
import { computed } from 'vue';

import type { PermissionGroupForm, PermissionGroup } from '@/modules/user/types/AccessManagement/permission';

import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import MainSelect from '@/components/common/MainSelect.vue';
import CheckBox from '@/components/common/CheckBox.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';

const props = defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: PermissionGroupForm;
    errors: Record<string, string>;
    groups: PermissionGroup[];
}>();

const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'save'): void;
}>();

const groupOptions = computed(() => props.groups.map((g) => ({ id: g.id, name: g.name })));
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :visible="visible"
        :header="isEditing ? $lang.editPermissionGroup : $lang.createPermissionGroup"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-4 py-2">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputText
                    v-model="form.name"
                    :label="$lang.name || 'Name'"
                    :placeholder="$lang.enterName || 'Enter name'"
                    :invalid="!!errors.name"
                    :message="errors.name"
                    message-type="error" />

                <FieldWrapper
                    :label="$lang.permissionGroup || 'Parent Group'"
                    :required="false">
                    <MainSelect
                        v-model="form.permission_group_id"
                        :options="groupOptions"
                        option-label="name"
                        option-value="id"
                        :showClear="true"
                        :placeholder="$lang.selectPermissionGroup || 'Select parent group'" />
                </FieldWrapper>

                <label class="flex cursor-pointer items-center gap-3">
                    <CheckBox
                        v-model="form.is_group"
                        :binary="true" />
                    <span class="dark:text-text-secondary text-sm font-medium text-gray-700">
                        {{ $lang.isGroup || 'Is Group' }}
                    </span>
                </label>
            </div>
        </div>

        <template #footer>
            <div
                class="border-schedule-border-subtle dark:border-border-default mx-4 mb-3 flex justify-end border-t pt-4">
                <MainButton
                    :label="$lang.save || 'Save'"
                    severity="primary"
                    :loading="isSaving"
                    @click="emit('save')" />
            </div>
        </template>
    </MainDialog>
</template>
