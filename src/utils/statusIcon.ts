const STATUS_ICON_FA_MAP: Record<string, string> = {
    'check-circle': 'fa-circle-check',
    'circle-check': 'fa-circle-check',
    check: 'fa-check',
    'x-circle': 'fa-circle-xmark',
    'circle-x': 'fa-circle-xmark',
    'circle-xmark': 'fa-circle-xmark',
    x: 'fa-xmark',
    clock: 'fa-clock',
    'clock-hour-3': 'fa-clock',
    hourglass: 'fa-hourglass-half',
    'alert-circle': 'fa-circle-exclamation',
    'exclamation-circle': 'fa-circle-exclamation',
    'alert-triangle': 'fa-triangle-exclamation',
    ban: 'fa-ban',
    'info-circle': 'fa-circle-info',
    circle: 'fa-circle',
    'circle-dot': 'fa-circle-dot',
    'thumb-up': 'fa-thumbs-up',
    'thumb-down': 'fa-thumbs-down',
    star: 'fa-star',
    flag: 'fa-flag',
    lock: 'fa-lock',
    pause: 'fa-pause',
    play: 'fa-play'
};

export function resolveStatusIconClass(icon?: string | null): string {
    if (!icon) return '';
    const name = icon.replace(/^(ti-|ti\s+|fa-solid\s+|fa-)/i, '').trim();
    const faName = STATUS_ICON_FA_MAP[name] ?? `fa-${name}`;
    return `fa-solid ${faName}`;
}
