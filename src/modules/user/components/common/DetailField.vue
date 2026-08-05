<script setup lang="ts">
import MainBadge from '@/components/common/MainBadge.vue';

defineProps<{
    value?: string | number | undefined;
    label: string;
    badgeValue?: string;
    badgeSeverity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;
    position?: 'left' | 'right' | 'center' | undefined;
}>();
</script>

<template>
    <div class="min-h-[50px]"
        :class="{ 'text-right': position === 'right', 'text-left': position === 'left', 'text-center': position === 'center' }">
        <div class="flex flex-wrap items-center gap-2.5">
            <p 
                class="text-schedule-text-primary dark:text-schedule-text-inverse break-words text-sm capitalize font-semibold line-height-4xl md:text-lg leading-6"
                :title="value != null ? String(value) : undefined">
                {{ value || '-' }}
            </p>
            <MainBadge
                v-if="badgeValue"
                :value="badgeValue"
                :severity="badgeSeverity || 'success'"
                size="normal" />
        </div>
        <p class="text-schedule-text-tertiary mt-1 text-sm font-400 line-height-4xl md:text-lg leading-6">
            {{ label }}
        </p>
    </div>
</template>
