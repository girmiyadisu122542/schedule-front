import { AllowedAction } from '@/constants/allowedActions';

declare global {
    const NProgress: {
        configure: (options: Record<string, unknown>) => void;
        start: () => void;
        done: (force?: boolean) => void;
    };
}

declare module 'vue' {
    interface ComponentCustomProperties {
        $can: (action: AllowedAction) => boolean;
        $lang: Record<string, string>;
    }
}

export {};
