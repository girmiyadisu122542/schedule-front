import axiosInstance from '@/api/axiosInstance';
import type { MutationResult } from '@/utils/apiError';
import type {
    GenerationRun,
    PaginatedGenerationRuns,
    SchedulingConstants
} from '@/modules/scheduling/types/classSchedule';

const RUNS = '/schedule/generation-runs';

export interface GenerationRunListParams {
    page?: number;
    /** Pagination wire field is `limit`, never `perPage`. */
    limit?: number;
    semester_id?: number;
    type_code?: string;
    status_code?: string;
}

export async function fetchGenerationRuns(params: GenerationRunListParams = {}): Promise<PaginatedGenerationRuns> {
    const response = await axiosInstance.get(RUNS, { params });

    return {
        data: response.data.data ?? [],
        pagination: response.data.pagination ?? null
    };
}

/** The endpoint the progress panel polls while a run is `running`. */
export async function getGenerationRun(key: string | number): Promise<GenerationRun> {
    const response = await axiosInstance.get(`${RUNS}/${key}`);

    return response.data.data;
}

/**
 * Trigger automatic class scheduling for one semester. Returns the run row —
 * its `summary` names every offering that was placed, skipped or left short.
 */
export async function generateClassSchedules(semesterId: number): Promise<MutationResult<GenerationRun>> {
    const response = await axiosInstance.post('/schedule/generate-class', { semester_id: semesterId });

    return response.data;
}

/**
 * Weekday labels and the daily slot grid, from the backend constants. The
 * backend is the runtime source of truth — changing the grid needs no frontend
 * redeploy.
 */
export async function fetchSchedulingConstants(): Promise<SchedulingConstants> {
    const response = await axiosInstance.get('/constants/scheduling');

    return response.data;
}
