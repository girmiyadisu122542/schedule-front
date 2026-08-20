import { computed, ref, watch, type Ref } from 'vue';

/**
 * Search, sort and paging over an array already in memory.
 *
 * The reports load their whole result set in one request — they are aggregates,
 * computed per semester, and paginating them server-side would mean recomputing
 * the aggregate per page. That is fine for the data but not for the DOM: a
 * thousand instructors rendered as a thousand table rows is a slow page and,
 * worse, one with no way to find anybody in it.
 *
 * So the work happens here instead: filter, order and slice the array the view
 * already holds. No extra requests, no server changes, and the reader gets a
 * box to type a name into.
 *
 * @param source the full row list
 * @param searchKeys which fields a search term looks at
 * @param initialSort the column to order by on first render
 */
export function useClientTable<T extends Record<string, any>>(
    source: Ref<T[]> | (() => T[]),
    searchKeys: Array<keyof T>,
    initialSort?: { key: keyof T; direction?: 'asc' | 'desc' }
) {
    const rows = computed<T[]>(() => (typeof source === 'function' ? source() : source.value) ?? []);

    const search = ref('');
    const page = ref(1);
    const perPage = ref(25);
    const sortKey = ref<keyof T | null>(initialSort?.key ?? null);
    const sortDirection = ref<'asc' | 'desc'>(initialSort?.direction ?? 'desc');

    const filtered = computed<T[]>(() => {
        const term = search.value.trim().toLowerCase();
        if (!term) return rows.value;

        return rows.value.filter((row) =>
            searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(term))
        );
    });

    const sorted = computed<T[]>(() => {
        const key = sortKey.value;
        if (!key) return filtered.value;

        // Copied before sorting: `Array.prototype.sort` mutates, and mutating a
        // computed's source re-triggers it — an infinite loop.
        return [...filtered.value].sort((a, b) => {
            const left = a[key];
            const right = b[key];

            // Nulls last whichever way the column is sorted. A missing figure
            // is not "smallest"; it is absent, and it belongs out of the way.
            if (left == null && right == null) return 0;
            if (left == null) return 1;
            if (right == null) return -1;

            const result =
                typeof left === 'number' && typeof right === 'number'
                    ? left - right
                    : String(left).localeCompare(String(right));

            return sortDirection.value === 'asc' ? result : -result;
        });
    });

    const total = computed(() => filtered.value.length);
    const pageCount = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)));

    const visible = computed<T[]>(() => {
        const start = (page.value - 1) * perPage.value;

        return sorted.value.slice(start, start + perPage.value);
    });

    /** Typing a search term while on page 9 must not leave the reader on an empty page. */
    watch([search, perPage, rows], () => {
        page.value = 1;
    });

    watch(pageCount, (count) => {
        if (page.value > count) page.value = count;
    });

    /** Click a header: sort by it, or flip the direction if it is already active. */
    const toggleSort = (key: keyof T) => {
        if (sortKey.value === key) {
            sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';

            return;
        }

        sortKey.value = key;
        sortDirection.value = 'desc';
    };

    const rangeStart = computed(() => (total.value === 0 ? 0 : (page.value - 1) * perPage.value + 1));
    const rangeEnd = computed(() => Math.min(page.value * perPage.value, total.value));

    return {
        search,
        page,
        perPage,
        sortKey,
        sortDirection,
        visible,
        total,
        pageCount,
        rangeStart,
        rangeEnd,
        toggleSort
    };
}
