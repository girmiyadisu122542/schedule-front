export const ITEM_IMPORT_STEPS = {
    UPLOAD: 'upload',
    RESULT: 'result'
} as const;

export type ItemImportStep = (typeof ITEM_IMPORT_STEPS)[keyof typeof ITEM_IMPORT_STEPS];
