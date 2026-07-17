<script setup lang="ts">
import { computed } from 'vue';
import MainDialog from '@/components/common/MainDialog.vue';
import type { College } from '@/modules/masterData/types/college';

const props = defineProps<{
    visible: boolean;
    college: College | null;
}>();

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>();

const createdOn = computed(() => {
    if (!props.college?.created_at) return null;
    return new Date(props.college.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
});
</script>

<template>
    <MainDialog
        :plain-background="true"
        :visible="visible"
        max-width="max-w-2xl"
        @update:visible="emit('update:visible', $event)">
        <template #header>
            <div class="flex items-center gap-3">
                <span class="text-text-primary text-xl font-semibold">
                    {{ $lang.collegeDetail || 'College Detail' }}
                </span>
                <span
                    :class="
                        college?.state === 1
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'dark:bg-surface-card dark:text-text-tertiary bg-gray-100 text-gray-500'
                    "
                    class="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {{ college?.state === 1 ? $lang.active || 'Active' : $lang.inactive || 'Inactive' }}
                </span>
            </div>
        </template>

        <div
            v-if="college"
            class="space-y-6 py-1">
            <!-- Identity hero -->
            <div class="border-border-subtle flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                <div class="min-w-0">
                    <h2 class="text-text-primary truncate text-lg font-semibold">{{ college.name }}</h2>
                    <p class="text-text-tertiary mt-0.5 text-sm">{{ college.code }}</p>
                </div>

                <div class="border-border-subtle flex shrink-0 flex-col rounded-xl border px-4 py-2">
                    <span class="text-schedule-brand-blue text-lg leading-none font-bold">
                        {{ college.departments_count ?? 0 }}
                    </span>
                    <span class="text-text-tertiary text-xs">{{ $lang.departments || 'Departments' }}</span>
                </div>
            </div>

            <!-- Attribute grid -->
            <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                    <p class="text-text-tertiary text-xs font-medium tracking-wide uppercase">
                        {{ $lang.dean || 'Dean' }}
                    </p>
                    <p class="text-text-secondary mt-1 text-sm">{{ college.dean_name || '—' }}</p>
                </div>
                <div>
                    <p class="text-text-tertiary text-xs font-medium tracking-wide uppercase">
                        {{ $lang.establishedYear || 'Established Year' }}
                    </p>
                    <p class="text-text-secondary mt-1 text-sm">{{ college.established_year || '—' }}</p>
                </div>
                <div>
                    <p class="text-text-tertiary text-xs font-medium tracking-wide uppercase">
                        {{ $lang.email || 'Email' }}
                    </p>
                    <p class="text-text-secondary mt-1 text-sm break-all">{{ college.email || '—' }}</p>
                </div>
                <div>
                    <p class="text-text-tertiary text-xs font-medium tracking-wide uppercase">
                        {{ $lang.phone || 'Phone' }}
                    </p>
                    <p class="text-text-secondary mt-1 text-sm">{{ college.phone || '—' }}</p>
                </div>
            </div>

            <!-- Description -->
            <div>
                <p class="text-text-tertiary mb-1.5 text-xs font-medium tracking-wide uppercase">
                    {{ $lang.description || 'Description' }}
                </p>
                <div class="border-border-subtle rounded-xl border p-4">
                    <p
                        v-if="college.description"
                        class="text-text-secondary text-sm leading-relaxed">
                        {{ college.description }}
                    </p>
                    <p
                        v-else
                        class="text-text-tertiary text-sm italic">
                        {{ $lang.noDescriptionAvailable || 'No description available' }}
                    </p>
                </div>
            </div>

            <!-- Metadata -->
            <div
                v-if="createdOn"
                class="border-border-subtle text-text-tertiary flex flex-wrap gap-x-6 gap-y-1 border-t pt-4 text-xs">
                <span>
                    {{ $lang.createdOn || 'Created on' }}:
                    <span class="text-text-secondary font-medium">{{ createdOn }}</span>
                </span>
            </div>
        </div>
    </MainDialog>
</template>
