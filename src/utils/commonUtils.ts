export const truncate = (text?: string, limit = 30) =>
    text ? (text.length > limit ? text.slice(0, limit) + '...' : text) : '';

export const toCapitalizedWords = (text?: string | null) => {
    if (!text) return '';
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const getInitialsFromName = (name?: string | null, limit = 2) => {
    if (!name) return '';
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, limit)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
};

export const camelCaseToTitleCase = (str?: string | null) => {
    if (!str) return '';
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
