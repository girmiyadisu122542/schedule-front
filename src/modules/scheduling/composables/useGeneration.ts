import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';

import { useLanguageStore } from '@/stores/languageStore';
import { readApiErrorMessage } from '@/utils/apiError';
import { GENERATION_STATUS } from '@/modules/scheduling/constants/classScheduleStatus';
import { generateClassSchedules, getGenerationRun } from '@/modules/scheduling/services/generationRunService';
import { generateExamSchedules } from '@/modules/scheduling/services/examScheduleService';
import type { GenerationRun, GenerationUnplaced } from '@/modules/scheduling/types/classSchedule';
import type { MutationResult } from '@/utils/apiError';

/** How often, and for how long, a still-running run is re-read. */
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Which timetable a panel generates. */
export type GenerationMode = 'class' | 'exam';

type Trigger = (semesterId: number, examTypeId?: number | null) => Promise<MutationResult<GenerationRun>>;

const TRIGGERS: Record<GenerationMode, Trigger> = {
    class: (semesterId) => generateClassSchedules(semesterId),
    exam: (semesterId, examTypeId) => generateExamSchedules(semesterId, examTypeId)
};

/**
 * Triggering automatic scheduling, and following the run to its end.
 *
 * The endpoints currently answer with a finished run, so the poll below usually
 * does not fire at all. It exists because the run row is the contract — if
 * generation ever moves onto a queue, these screens already read it correctly.
 */
function generationManager(mode: GenerationMode) {
    const { customizeLanguageData } = useLanguageStore();

    const isGenerating = ref(false);
    const run = ref<GenerationRun | null>(null);

    /** Backend message when there is one, localized fallback otherwise. */
    const genericError = (error: unknown) =>
        readApiErrorMessage(error, customizeLanguageData('somethingWentWrong', 'Something went wrong'));

    const isRunning = computed(() => run.value?.status_code === GENERATION_STATUS.RUNNING);
    const hasFailed = computed(() => run.value?.status_code === GENERATION_STATUS.FAILED);

    /** The offerings the generator could not finish placing — shown separately. */
    const unplaced = computed<GenerationUnplaced[]>(() => run.value?.summary?.unplaced ?? []);
    const placed = computed(() => run.value?.summary?.placed ?? []);
    const skipped = computed(() => run.value?.summary?.skipped ?? []);

    /**
     * Re-read the run until it stops being `running`.
     *
     * @param uuid the run to follow
     */
    const pollUntilSettled = async (uuid: string) => {
        const deadline = Date.now() + POLL_TIMEOUT_MS;

        while (Date.now() < deadline) {
            await sleep(POLL_INTERVAL_MS);

            try {
                const latest = await getGenerationRun(uuid);
                run.value = latest;

                if (latest.status_code !== GENERATION_STATUS.RUNNING) return;
            } catch (error: unknown) {
                toast.error(genericError(error));
                return;
            }
        }
    };

    /**
     * Generate the timetable for one semester.
     *
     * @param semesterId
     * @param examTypeId which sitting to generate; exam mode only, finals by default
     *
     * @returns true when a run finished, so the caller can refresh its list
     */
    const generate = async (semesterId: number, examTypeId?: number | null): Promise<boolean> => {
        isGenerating.value = true;
        run.value = null;

        try {
            const started = await TRIGGERS[mode](semesterId, examTypeId);
            run.value = started.data;

            if (started.data.status_code === GENERATION_STATUS.RUNNING) {
                await pollUntilSettled(started.data.uuid);
            }

            if (hasFailed.value) {
                toast.error(customizeLanguageData('generationFailed', 'Generation failed'));
                return false;
            }

            toast.success(started.message ?? customizeLanguageData('savedSuccessfully', 'Saved successfully'));

            return true;
        } catch (error: unknown) {
            // "No registrar-approved offerings", "semester is closed" and every
            // other 422 arrive here already translated — never swallow them.
            toast.error(genericError(error));

            return false;
        } finally {
            isGenerating.value = false;
        }
    };

    return { isGenerating, run, isRunning, hasFailed, placed, unplaced, skipped, generate };
}

/**
 * One shared instance PER MODE, memoized for the app's lifetime.
 *
 * A single shared instance would let a class run and an exam run overwrite each
 * other's summary. `createSharedComposable` is deliberately not used: it ties
 * the instance to an effect scope that is disposed when the last consumer
 * unmounts, which would throw away a finished run every time the user leaves
 * the page. Nothing here registers a watcher, so an app-lifetime singleton
 * leaks nothing.
 */
const instances: Partial<Record<GenerationMode, ReturnType<typeof generationManager>>> = {};

export function useGeneration(mode: GenerationMode = 'class') {
    instances[mode] ??= generationManager(mode);

    return instances[mode];
}
