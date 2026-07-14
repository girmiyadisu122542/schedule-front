import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

export function useUnsavedChangesGuard(getState: () => unknown) {
    const baseline = ref('');
    const snapshot = () => JSON.stringify(getState());

    const isDirty = () => snapshot() !== baseline.value;

    const resetBaseline = () => {
        nextTick(() => {
            baseline.value = snapshot();
        });
    };

    const showLeaveConfirm = ref(false);
    const suppressLeaveGuard = ref(false);
    let resolveLeave: ((value: boolean) => void) | null = null;

    const confirmLeave = () => {
        showLeaveConfirm.value = false;
        resolveLeave?.(true);
        resolveLeave = null;
    };

    const cancelLeave = () => {
        showLeaveConfirm.value = false;
        resolveLeave?.(false);
        resolveLeave = null;
    };

    const allowNextLeave = () => {
        suppressLeaveGuard.value = true;
    };

    onBeforeRouteLeave(() => {
        if (suppressLeaveGuard.value) {
            suppressLeaveGuard.value = false;
            return true;
        }
        if (!isDirty()) return true;
        showLeaveConfirm.value = true;
        return new Promise<boolean>((resolve) => {
            resolveLeave = resolve;
        });
    });

    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
        if (suppressLeaveGuard.value || !isDirty()) return;
        event.preventDefault();
        event.returnValue = '';
    };

    onMounted(() => {
        resetBaseline();
        window.addEventListener('beforeunload', beforeUnloadHandler);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
    });

    return {
        isDirty,
        resetBaseline,
        allowNextLeave,
        showLeaveConfirm,
        confirmLeave,
        cancelLeave
    };
}
