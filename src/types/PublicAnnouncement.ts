export interface AnnouncementTypeTag {
    id?: number | string;
    name?: string | null;
    slug?: string | null;
    color?: string | null;
}

export interface AnnouncementJobPositionType {
    id?: number;
    name?: string;
}

export interface AnnouncementJobPostRef {
    id?: number;
    slug?: string;
    position_type?: AnnouncementJobPositionType | null;
}

export interface PublicAnnouncement {
    id: number;
    slug?: string;
    title: string;
    content?: string | null;
    appeal_deadline?: string | null;
    announcement_type?: AnnouncementTypeTag | null;
    job_post?: AnnouncementJobPostRef | null;
    show_users?: boolean;
    created_at: string;
}

export interface AnnouncementUser {
    id: number;
    tracking_number: string | null;
    full_name: string;
    email: string;
    phone_number: string | null;
    birth_date: string | null;
}
