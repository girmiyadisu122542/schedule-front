<script setup lang="ts">
import type { Component } from 'vue';

import Breadcrumb from '@/components/common/Breadcrumb.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import PagePlaceholder from '@/components/common/PagePlaceholder.vue';

/**
 * The shell every detail page wears: breadcrumb, identity header, a field grid
 * and however many related panels the record warrants.
 *
 * It owns the three states a detail page always has — loading, not-found, and
 * loaded — so no page has to re-implement them.
 */
withDefaults(
    defineProps<{
        breadcrumbItems: Array<{ label: string; to?: string }>;
        icon?: Component;
        title: string;
        /** The line under the title: what this record IS, in context. */
        subtitle?: string;
        isLoading?: boolean;
        notFound?: boolean;
        notFoundTitle?: string;
        notFoundDescription?: string;
    }>(),
    {
        subtitle: '',
        isLoading: false,
        notFound: false,
        notFoundTitle: 'Not found',
        notFoundDescription: ''
    }
);
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="icon" />
        </div>

        <!-- Only skeleton on a FIRST load; a refresh keeps the record on screen. -->
        <Skeleton v-if="isLoading && !title" />

        <PagePlaceholder
            v-else-if="notFound"
            :title="notFoundTitle"
            :description="notFoundDescription" />

        <template v-else>
            <section class="schedule-card border-border-default rounded-2xl border p-6">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="min-w-0">
                        <h1 class="text-text-primary text-xl font-semibold break-words">{{ title }}</h1>
                        <p
                            v-if="subtitle"
                            class="text-text-tertiary mt-1 text-sm">
                            {{ subtitle }}
                        </p>
                    </div>

                    <!-- Status chips on the left of this slot, actions on the right. -->
                    <div class="flex flex-wrap items-center gap-2">
                        <slot name="header-actions" />
                    </div>
                </div>

                <dl
                    v-if="$slots.fields"
                    class="border-border-subtle mt-6 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-3 lg:grid-cols-4">
                    <slot name="fields" />
                </dl>
            </section>

            <!-- Related panels: what this record contains, or is used by. -->
            <slot />
        </template>
    </div>
</template>
