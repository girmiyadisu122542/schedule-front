import { ComponentCustomProperties } from 'vue';
import { AllowedAction } from '@/constants/allowedActions';

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $lang: Record<string, string>;
        $can: (action: AllowedAction) => boolean;
    }
}
