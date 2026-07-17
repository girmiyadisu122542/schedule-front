<script setup lang="ts">
import { computed } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useCollege } from '@/modules/masterData/composables/useCollege';

import Breadcrumb from '@/components/common/Breadcrumb.vue';
import StatCard from '@/components/common/StatCard.vue';
import BuildingCityIcon from '@/assets/icons/BuildingCityIcon.vue';
import BuildingIcon from '@/assets/icons/BuildingIcon.vue';
import CircleCheckIcon from '@/assets/icons/CircleCheckIcon.vue';
import ExclamationCircleIcon from '@/assets/icons/ExclamationCircleIcon.vue';
import College from '@/modules/masterData/components/College/College.vue';

const { customizeLanguageData } = useLanguageStore();
const { stats } = useCollege();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('collegesOrSchools', 'Colleges / Schools') }]);
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="BuildingCityIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-schedule-text-primary dark:text-text-primary text-xl font-semibold">
                    {{ $lang.manageColleges || 'Manage Colleges / Schools' }}
                </h1>
                <p class="text-md text-schedule-text-tertiary dark:text-text-tertiary font-normal">
                    {{ $lang.manageCollegesDesc || 'Create and manage the colleges and schools of the university.' }}
                </p>
            </div>
            <College />
        </div>
    </div>
</template>
