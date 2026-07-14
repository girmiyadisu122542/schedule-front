import type { AllowedAction } from '@/constants/allowedActions';
import { useAllowedRoutesStore } from '@/stores/allowedRoutesStore';

/**
 * Accepts AllowedAction(s), encrypts them, returns encrypted array for Axios params.
 * @param permissions - AllowedAction or array
 * @returns Array | String of encrypted permissions
 */
export function attachPermissions(permissions: AllowedAction | AllowedAction[]): string[] | string {
    const store = useAllowedRoutesStore();
    return store.permissionEncripted(permissions) as string[] | string;
}
