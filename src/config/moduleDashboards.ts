/**
 * Module codes (mirror the backend `helper/AppConfig.php` *_MODULE_CODE constants)
 * and the map of which business modules ship their own dashboard.
 *
 * Selecting a module from the switcher lands on that module's dashboard when it
 * has one; Core, System Config and Company Setup have no dedicated dashboard and
 * fall back to the shared /dashboard.
 */
export const MODULE_CODES = {
    CORE: 'UserMgmt-0001',
    CUSTOMIZATION: 'MOD-CUSTOMIZATION-0001',
    SYSTEM_CONFIG: 'MOD-SYSTEM-0001',
    INVENTORY: 'MOD-INVENTORY-0001',
    SALES: 'MOD-SALES-0001'
} as const;

/** Module code -> the named route of that module's dashboard. */
export const MODULE_DASHBOARD_ROUTE: Record<string, string> = {
    [MODULE_CODES.SALES]: 'SalesDashboard',
    [MODULE_CODES.INVENTORY]: 'InventoryDashboard'
};
