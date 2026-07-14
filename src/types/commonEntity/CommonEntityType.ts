import type { Status } from '@/types/CommonTypes';
import type { User } from '@/modules/user/types/AccessManagement/User/UserType';

export interface EntityType {
    id: number;
    name: string;
    code: number;
    description: string;
    status: Status;
    user: User;
}
