<script setup lang="ts">
const year = new Date().getFullYear();
</script>
<template>
    <div class="dark:bg-schedule-dark flex items-center justify-center pb-14">
        <p class="text-schedule-text-footer dark:text-schedule-text-tertiary text-sm font-normal">
            @ {{ year }} {{ $lang.scheduleSystem }}.
        </p>
        <div class="text-schedule-text-footer dark:text-schedule-text-tertiary px-4 text-sm font-normal">
            | {{ $lang.contactUs }} | {{ $lang.privacyPolicy }} | {{ $lang.termsOfService }} |
        </div>
    </div>
</template>
