export interface UserProfileGender {
    id: number;
    name: string;
    label?: string;
    display_name?: string;
}

export interface UserProfileRole {
    id: number;
    name: string;
    display_name?: string;
}

export interface UserProfileEntity {
    id: number;
    name: string;
    display_name?: string;
}

export interface UserProfile {
    id: number;
    email: string;
    photo: string | null;
    cover_photo: string | null;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    bio: string | null;
    dob: string | null;
    joined_date: string | null;
    gender: UserProfileGender | number | null;
    roles: UserProfileRole[] | null;
    entity: UserProfileEntity | null;
}

export interface UserProfileForm {
    email: string;
    bio: string;
    photo: File | string | null;
    cover_photo: File | string | null;
}
