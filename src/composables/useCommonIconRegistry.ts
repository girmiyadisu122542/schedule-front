import CircleCheckIcon from '@/assets/icons/CircleCheckIcon.vue';
import ClockTimeTimerArrow from '@/assets/icons/ClockTimeTimerArrow.vue';
import GlobeIcon from '@/assets/icons/GlobeIcon.vue';
export const useCommonIconRegistry: Record<string, any> = {
    CircleCheckIcon: CircleCheckIcon,
    'check-circle': CircleCheckIcon,
    clock: ClockTimeTimerArrow,
    globe: GlobeIcon
};
