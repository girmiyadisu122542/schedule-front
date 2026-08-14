import { createSharedComposable } from '@vueuse/core';

import { academicScopeFiltersManager } from '@/composables/useAcademicScopeFilters';

/**
 * The scheduling screens' academic scope: College → Department → Programme →
 * Section, each narrowing the next.
 *
 * The FACTORY is shared, not the instance. A single `createSharedComposable`
 * across modules would mean choosing a department on the timetable screen
 * silently re-filtered the offerings queue, and vice versa — one selection
 * pretending to be two screens' worth of state.
 */
export const useScheduleFilters = createSharedComposable(academicScopeFiltersManager);
