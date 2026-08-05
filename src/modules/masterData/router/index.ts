import type { RouteRecordRaw } from 'vue-router';

/**
 * Routes contributed by the masterData module. Paths mirror the backend
 * `App\Constants\FrontendPaths` constants and the entries in
 * `config/sidebar_menu.php` — the sidebar is server-driven, so a path that
 * drifts here simply stops resolving.
 *
 * Each list is paired with a `:uuid` detail route. Frontend routes by uuid —
 * numeric ids never appear in URLs — which is exactly what the backend's
 * id-or-uuid `show` endpoints exist to serve.
 */
const masterDataRoutes: Array<RouteRecordRaw> = [
    {
        path: 'campuses',
        name: 'Campuses',
        component: () => import('@/modules/masterData/views/Campus/ManageCampuses.vue')
    },
    {
        path: 'campuses/:uuid',
        name: 'CampusDetail',
        component: () => import('@/modules/masterData/views/Campus/CampusDetail.vue')
    },
    {
        path: 'buildings',
        name: 'Buildings',
        component: () => import('@/modules/masterData/views/Building/ManageBuildings.vue')
    },
    {
        path: 'buildings/:uuid',
        name: 'BuildingDetail',
        component: () => import('@/modules/masterData/views/Building/BuildingDetail.vue')
    },
    {
        path: 'colleges',
        name: 'Colleges',
        component: () => import('@/modules/masterData/views/College/ManageColleges.vue')
    },
    {
        path: 'colleges/:uuid',
        name: 'CollegeDetail',
        component: () => import('@/modules/masterData/views/College/CollegeDetail.vue')
    },
    {
        path: 'departments',
        name: 'Departments',
        component: () => import('@/modules/masterData/views/Department/ManageDepartments.vue')
    },
    {
        path: 'departments/:uuid',
        name: 'DepartmentDetail',
        component: () => import('@/modules/masterData/views/Department/DepartmentDetail.vue')
    },
    {
        path: 'academic-years',
        name: 'AcademicYears',
        component: () => import('@/modules/masterData/views/AcademicYear/ManageAcademicYears.vue')
    },
    {
        path: 'academic-years/:uuid',
        name: 'AcademicYearDetail',
        component: () => import('@/modules/masterData/views/AcademicYear/AcademicYearDetail.vue')
    },
    {
        path: 'programs',
        name: 'Programs',
        component: () => import('@/modules/masterData/views/Program/ManagePrograms.vue')
    },
    {
        path: 'programs/:uuid',
        name: 'ProgramDetail',
        component: () => import('@/modules/masterData/views/Program/ProgramDetail.vue')
    },
    {
        path: 'semesters',
        name: 'Semesters',
        component: () => import('@/modules/masterData/views/Semester/ManageSemesters.vue')
    },
    {
        path: 'semesters/:uuid',
        name: 'SemesterDetail',
        component: () => import('@/modules/masterData/views/Semester/SemesterDetail.vue')
    },
    {
        path: 'sections',
        name: 'Sections',
        component: () => import('@/modules/masterData/views/Section/ManageSections.vue')
    },
    {
        path: 'sections/:uuid',
        name: 'SectionDetail',
        component: () => import('@/modules/masterData/views/Section/SectionDetail.vue')
    },
    {
        path: 'rooms',
        name: 'Rooms',
        component: () => import('@/modules/masterData/views/Room/ManageRooms.vue')
    },
    {
        path: 'rooms/:uuid',
        name: 'RoomDetail',
        component: () => import('@/modules/masterData/views/Room/RoomDetail.vue')
    },
    {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/modules/masterData/views/Course/ManageCourses.vue')
    },
    {
        path: 'courses/:uuid',
        name: 'CourseDetail',
        component: () => import('@/modules/masterData/views/Course/CourseDetail.vue')
    },
    {
        path: 'instructors',
        name: 'Instructors',
        component: () => import('@/modules/masterData/views/Instructor/ManageInstructors.vue')
    },
    {
        path: 'instructors/:uuid',
        name: 'InstructorDetail',
        component: () => import('@/modules/masterData/views/Instructor/InstructorDetail.vue')
    }
];

export default masterDataRoutes;
