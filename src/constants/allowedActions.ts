import type { UserAllowedAction } from '@/modules/user/constants/allowedActions';
import type { MasterDataAllowedAction } from '@/modules/masterData/constants/allowedActions';
import type { OfferingAllowedAction } from '@/modules/offerings/constants/allowedActions';
import type { SchedulingAllowedAction } from '@/modules/scheduling/constants/allowedActions';
import type {
    InvigilationAssignmentAllowedAction,
    InvigilationRequestAllowedAction
} from '@/modules/invigilation/constants/allowedActions';

export type AllowedAction =
    | UserAllowedAction
    | MasterDataAllowedAction
    | OfferingAllowedAction
    | SchedulingAllowedAction
    | InvigilationAssignmentAllowedAction
    | InvigilationRequestAllowedAction;
