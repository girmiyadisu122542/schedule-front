export const CUSTOMER_GROUP_TABS = {
    BASIC: 'basic',
    CUSTOMERS: 'customers'
} as const;

export type CustomerGroupTab = (typeof CUSTOMER_GROUP_TABS)[keyof typeof CUSTOMER_GROUP_TABS];

export const RETURN_TO = {
    CUSTOMER_GROUP: 'customer-group'
} as const;
