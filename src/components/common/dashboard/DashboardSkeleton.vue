<script setup lang="ts">
import Skeleton from '@/components/common/Skeleton.vue';
</script>

<template>
    <div class="space-y-5">
        <!-- KPI tiles -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <div
                v-for="n in 5"
                :key="n"
                class="schedule-card flex items-center gap-3 p-4">
                <Skeleton
                    shape="circle"
                    width="2.75rem"
                    height="2.75rem" />
                <div class="flex-1 space-y-2">
                    <Skeleton
                        height="0.6rem"
                        width="60%" />
                    <Skeleton
                        height="1rem"
                        width="80%" />
                </div>
            </div>
        </div>

        <!-- area + donut -->
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div class="schedule-card space-y-4 p-5 lg:col-span-2">
                <Skeleton
                    height="1rem"
                    width="40%" />
                <Skeleton height="16rem" />
            </div>
            <div class="schedule-card space-y-4 p-5">
                <Skeleton
                    height="1rem"
                    width="50%" />
                <div class="flex justify-center py-4">
                    <Skeleton
                        shape="circle"
                        width="11rem"
                        height="11rem" />
                </div>
            </div>
        </div>

        <!-- three charts -->
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div
                v-for="n in 3"
                :key="n"
                class="schedule-card space-y-4 p-5">
                <Skeleton
                    height="1rem"
                    width="50%" />
                <Skeleton height="14rem" />
            </div>
        </div>

        <!-- table + list -->
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div class="schedule-card space-y-3 p-5 lg:col-span-2">
                <Skeleton
                    height="1rem"
                    width="30%" />
                <Skeleton
                    v-for="n in 5"
                    :key="n"
                    height="1.6rem" />
            </div>
            <div class="schedule-card space-y-3 p-5">
                <Skeleton
                    height="1rem"
                    width="40%" />
                <Skeleton
                    v-for="n in 5"
                    :key="n"
                    height="1.6rem" />
            </div>
        </div>
    </div>
</template>
