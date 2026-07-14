<script setup lang="ts">
import MainDialog from '@/components/common/MainDialog.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import CheckBox from '@/components/common/CheckBox.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';

defineProps<{
    visible: boolean;
    isEditing: boolean;
    isSaving: boolean;
    form: {
        name: string;
        is_system: boolean;
        unique_per_user: boolean;
        state: number;
        description: string;
    };
    errors: Record<string, string>;
}>();

const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'save'): void;
    (e: 'expand'): void;
}>();
</script>

<template>
    <MainDialog
        :no-x-padding="true"
        :plain-background="true"
        :visible="visible"
        :header="isEditing ? $lang.editRole : $lang.createRole"
        max-width="max-w-3xl"
        @update:visible="emit('update:visible', $event)">
        <div class="mx-4 space-y-7 py-1">
            <section class="space-y-4">
                <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                    {{ $lang.roleInformation || 'Role Information' }}
                </h3>

                <InputText
                    v-model="form.name"
                    :label="$lang.name || 'Name'"
                    :placeholder="$lang.enterName || 'Enter name'"
                    :invalid="!!errors.name"
                    :message="errors.name"
                    message-type="error"
                    size="normal" />

                <FieldWrapper
                    :label="$lang.description || 'Description'"
                    :required="false">
                    <textarea
                        v-model="form.description"
                        rows="4"
                        :placeholder="$lang.enterDescription || 'Enter a description...'"
                        class="border-border-default text-text-primary placeholder:text-text-tertiary focus:border-schedule-brand-blue focus:ring-schedule-brand-blue/20 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:ring-2 focus:outline-none"></textarea>
                </FieldWrapper>
            </section>

            <section class="border-border-subtle space-y-3 border-t pt-6">
                <div>
                    <h3 class="text-text-tertiary text-xs font-semibold tracking-wide uppercase">
                        {{ $lang.scope || 'Scope' }}
                    </h3>
                    <p class="text-text-tertiary mt-1 text-xs">
                        {{ $lang.roleScopeHelp || 'Controls how this role may be assigned across users and entities.' }}
                    </p>
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label
                        class="border-border-subtle hover:border-schedule-brand-blue/40 flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors">
                        <CheckBox
                            v-model="form.unique_per_user"
                            :binary="true"
                            class="mt-0.5" />
                        <span class="flex flex-col">
                            <span class="text-text-primary text-sm font-medium">
                                {{ $lang.uniquePerUser || 'Unique Per User' }}
                            </span>
                            <span class="text-text-tertiary text-xs">
                                {{ $lang.uniquePerUserHelp || 'A user can hold this role only once.' }}
                            </span>
                        </span>
                    </label>
                </div>
            </section>
        </div>

        <template #footer>
            <div class="mx-2 flex items-center justify-between gap-3">
                <MainButton
                    outlined
                    @click="emit('expand')">
                    <template #default>
                        <span class="flex items-center gap-2 font-semibold">
                            {{ $lang.expandFullForm || 'Expand Full Form' }}
                            <i class="fa-solid fa-up-right-and-down-left-from-center text-xs"></i>
                        </span>
                    </template>
                </MainButton>
                <div class="flex items-center gap-3">
                    <MainButton
                        v-if="isEditing"
                        outlined
                        :label="$lang.cancel || 'Cancel'"
                        @click="emit('update:visible', false)" />
                    <MainButton
                        :label="isEditing ? $lang.saveChanges || 'Save Changes' : $lang.save || 'Save'"
                        severity="primary"
                        :loading="isSaving"
                        @click="emit('save')" />
                </div>
            </div>
        </template>
    </MainDialog>
</template>
