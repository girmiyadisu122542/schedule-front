import { useRouter, type RouteLocationRaw } from 'vue-router';
import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties, type Ref } from 'vue';

interface UsePopoverForMainTableColumnOptions<T = any> {
    data: Ref<T[] | undefined>;
    maxVisible: Ref<number>;
    getRouteLocation: Ref<((datum: T) => RouteLocationRaw | null) | null | undefined>;
}

const VIEWPORT_PADDING = 12;
const POPOVER_OFFSET = 10;
const MAX_POPOVER_HEIGHT = 300;

export function usePopoverForMainTableColumn<T = any>(options: UsePopoverForMainTableColumnOptions<T>) {
    const router = useRouter();

    const rootRef = ref<HTMLElement | null>(null);
    const triggerRef = ref<HTMLElement | null>(null);
    const popoverRef = ref<HTMLElement | null>(null);
    const isOpen = ref(false);
    const popoverStyle = ref<CSSProperties>({});
    const popoverTransformOrigin = ref('center top');

    const hiddenCount = computed(() => Math.max((options.data.value?.length || 0) - options.maxVisible.value, 0));

    const normalizeDecimalNumber = (value: number | string) => {
        return Number(parseFloat(String(value)).toFixed(2)).toString();
    };

    const getDatumLabel = (datum: any) => {
        if (datum?.rate_percent !== null && datum?.rate_percent !== undefined && datum?.rate_percent !== '') {
            return `${normalizeDecimalNumber(datum.rate_percent)}%`;
        }

        return datum?.display_name || datum?.name || '-';
    };

    const getDatumRouteLocation = (datum: T) => options.getRouteLocation.value?.(datum) ?? null;

    const isDatumNavigable = (datum: T) => Boolean(getDatumRouteLocation(datum));

    const closePopover = () => {
        isOpen.value = false;
    };

    const handleDatumClick = async (datum: T) => {
        const routeLocation = getDatumRouteLocation(datum);

        if (!routeLocation) {
            return;
        }

        closePopover();
        await router.push(routeLocation);
    };

    const updatePopoverPosition = async () => {
        if (!isOpen.value || !triggerRef.value || !popoverRef.value) return;

        await nextTick();

        const triggerRect = triggerRef.value.getBoundingClientRect();
        const popoverRect = popoverRef.value.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const availableBelow = viewportHeight - triggerRect.bottom - VIEWPORT_PADDING;
        const availableAbove = triggerRect.top - VIEWPORT_PADDING;
        const shouldOpenAbove = availableBelow < popoverRect.height + POPOVER_OFFSET && availableAbove > availableBelow;

        const usableHeight = shouldOpenAbove ? availableAbove : availableBelow;
        const maxHeight = Math.max(Math.min(usableHeight - POPOVER_OFFSET, MAX_POPOVER_HEIGHT), 0);

        const unclampedTop = shouldOpenAbove
            ? triggerRect.top - Math.min(popoverRect.height, maxHeight) - POPOVER_OFFSET
            : triggerRect.bottom + POPOVER_OFFSET;

        const top = Math.min(
            Math.max(unclampedTop, VIEWPORT_PADDING),
            viewportHeight - Math.min(popoverRect.height, maxHeight) - VIEWPORT_PADDING
        );

        const preferredLeft = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
        const maxLeft = Math.max(VIEWPORT_PADDING, viewportWidth - popoverRect.width - VIEWPORT_PADDING);
        const left = Math.min(Math.max(preferredLeft, VIEWPORT_PADDING), maxLeft);

        const originX = Math.min(
            Math.max(triggerRect.left + triggerRect.width / 2 - left, 24),
            popoverRect.width - 24
        );
        
        const originY = shouldOpenAbove ? Math.min(popoverRect.height, maxHeight) : 0;

        popoverTransformOrigin.value = `${originX}px ${originY}px`;

        popoverStyle.value = {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            maxHeight: `${maxHeight}px`,
            transformOrigin: popoverTransformOrigin.value
        };
    };

    const openPopover = async () => {
        isOpen.value = true;
        await updatePopoverPosition();
    };

    const togglePopover = async () => {
        if (isOpen.value) {
            closePopover();
            return;
        }

        await openPopover();
    };

    const handleWindowChange = () => {
        if (isOpen.value) {
            void updatePopoverPosition();
        }
    };

    const handleDocumentPointerDown = (event: Event) => {
        if (!rootRef.value?.contains(event.target as Node)) {
            closePopover();
        }
    };

    const handleDocumentKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            closePopover();
        }
    };

    watch(isOpen, (open) => {
        if (open) {
            window.addEventListener('resize', handleWindowChange);
            window.addEventListener('scroll', handleWindowChange, true);
            document.addEventListener('pointerdown', handleDocumentPointerDown);
            document.addEventListener('keydown', handleDocumentKeydown);
            return;
        }

        window.removeEventListener('resize', handleWindowChange);
        window.removeEventListener('scroll', handleWindowChange, true);
        document.removeEventListener('pointerdown', handleDocumentPointerDown);
        document.removeEventListener('keydown', handleDocumentKeydown);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleWindowChange);
        window.removeEventListener('scroll', handleWindowChange, true);
        document.removeEventListener('pointerdown', handleDocumentPointerDown);
        document.removeEventListener('keydown', handleDocumentKeydown);
    });

    return {
        popoverStyle,
        hiddenCount,
        triggerRef,
        popoverRef,
        rootRef,
        isOpen,
        togglePopover,
        getDatumLabel,
        isDatumNavigable,
        handleDatumClick,
    };
}
