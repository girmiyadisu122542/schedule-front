import axiosInstance from '@/api/axiosInstance';
import type {
    ComparisonReport,
    TermSetupChecklist,
    ExceptionReport,
    InstructorWorkloadReport,
    RoomUtilisationReport
} from '@/modules/reports/types/report';

/** Backend prefix — `Route::prefix('/reports')`. */
const BASE = '/reports';

export async function fetchRoomUtilisation(
    semesterId: number,
    filters: { building_id?: number | null; campus_id?: number | null } = {}
): Promise<RoomUtilisationReport> {
    const response = await axiosInstance.get(`${BASE}/room-utilisation`, {
        params: { semester_id: semesterId, ...filters }
    });

    return response.data.data;
}

export async function fetchInstructorWorkload(
    semesterId: number,
    filters: { department_id?: number | null } = {}
): Promise<InstructorWorkloadReport> {
    const response = await axiosInstance.get(`${BASE}/instructor-workload`, {
        params: { semester_id: semesterId, ...filters }
    });

    return response.data.data;
}

export async function fetchExceptions(semesterId: number): Promise<ExceptionReport> {
    const response = await axiosInstance.get(`${BASE}/exceptions`, { params: { semester_id: semesterId } });

    return response.data.data;
}

export async function fetchComparison(semesterId: number, compareSemesterId: number): Promise<ComparisonReport> {
    const response = await axiosInstance.get(`${BASE}/compare`, {
        params: { semester_id: semesterId, compare_semester_id: compareSemesterId }
    });

    return response.data.data;
}

export async function fetchTermSetup(semesterId: number): Promise<TermSetupChecklist> {
    const response = await axiosInstance.get(`${BASE}/term-setup`, { params: { semester_id: semesterId } });

    return response.data.data;
}
