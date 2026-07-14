export interface TopMenuItem {
    icon?: string;
    name: string;
    subtitle?: string;
    path?: string;
    subItems?: TopMenuItem[];
    module?: any;
}

export interface TopMenuGroup {
    title: string;
    items: TopMenuItem[];
    subtitle?: string;
}
