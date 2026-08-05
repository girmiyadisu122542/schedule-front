import axiosInstance from '@/api/axiosInstance';

/** The current semester, as the dashboard needs it. */
export interface DashboardSemester {
    id: number;
    uuid: string;
    name: string;
    status_code: string | null;
    status_label: string | null;
    start_date: string | null;
    end_date: string | null;
}

/**
 * The landing screen's figures, all scoped to the current semester — a
 * dashboard that mixes terms answers nothing.
 */
export interface DashboardStats {
    current_semester: DashboardSemester | null;
    registrar_approved_offerings_count: number;
    published_class_schedules_count: number;
    /**
     * Published sittings still to come. A semester whose exam period has passed
     * reports 0, which is the honest answer rather than a bug.
     */
    upcoming_published_exams_count: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const response = await axiosInstance.get('/dashboard/stats');

    return response.data;
}
