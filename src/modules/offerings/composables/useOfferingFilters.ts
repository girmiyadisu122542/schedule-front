import { createSharedComposable } from '@vueuse/core';

import { academicScopeFiltersManager } from '@/composables/useAcademicScopeFilters';

/**
 * The offering queue's academic scope — its OWN instance of the shared cascade.
 *
 * Deliberately a second singleton rather than the scheduling one: the two
 * screens ask the same question about different work, and sharing the selection
 * would make each of them silently reach into the other.
 */
export const useOfferingFilters = createSharedComposable(academicScopeFiltersManager);
