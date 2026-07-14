import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import { reactive, computed, watch } from 'vue';

import axiosInstance from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/CommonTypes';
import { useLanguageStore } from '@/stores/languageStore';

interface Props {
    maxCols?: number;
    dataTree: any[];
    baseComponent: any;

    apiUrl?: string;
    valueKey?: string;
    labelKey?: string;
    displayKey?: string;
    initialLabel?: string;
    isMultiSelect?: boolean;
    placeholderTemplate?: string;
    initialParams?: Record<string, any>;
    componentProps?: Record<string, any>;
    fetchChildren?: (parent: any, level: number) => Promise<any[]>;
}

interface SelectionLevel {
    label: string;
    options: any[];
    selectedId: any;
    isLoading?: boolean;
    displayName?: string;
    searchQuery?: string;
}

type RecursiveEmitEvent = 'change' | 'clear' | 'update:modelValue' | 'resetToRoot' | 'update:search-query-param';

export function useRecursiveComponent(props: Props, emit?: (event: RecursiveEmitEvent, ...args: any[]) => void) {
    const { translations } = storeToRefs(useLanguageStore());
    const gridColsMap: Record<number, string> = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6'
    };

    const category = computed(() => {
        return props.initialLabel || translations.value?.category || 'Category';
    });

    const placeholder = computed(() => {
        return props.placeholderTemplate || translations.value?.select || 'Select';
    });

    const gridClass = computed(() => {
        const cols = Math.min(props.maxCols || 4, 6);
        return `${gridColsMap[1]} sm:${gridColsMap[2]} md:${gridColsMap[Math.min(cols, 3)]} lg:${gridColsMap[cols]}`;
    });

    const selections = reactive<SelectionLevel[]>([
        {
            label: category.value,
            options: props.dataTree,
            selectedId: props.isMultiSelect ? [] : null,
            isLoading: false,
            searchQuery: ''
        }
    ]);

    const resetToRoot = () => {
        if (emit) {
            emit('resetToRoot');
        }
    };

    const fetchData = async (parent: any, level: number) => {
        if (!props.apiUrl) return [];

        try {
            const response = await axiosInstance.get<ApiResponse<any>>(props.apiUrl, {
                params: {
                    ...props.initialParams,
                    parentId: parent?.id,
                    search: selections[level]?.searchQuery || ''
                }
            });

            return response.data.data;
        } catch (error) {
            toast.error(translations.value.somethingWentWrong || 'Something went wrong');
            return [];
        }
    };

    function clearSelection(index: number, selectedItem?: any) {
        if (emit) {
            emit('clear', {
                index,
                item: selectedItem
            });
        }
    }

    const getPlaceholder = (level: SelectionLevel, index: number): string => {
        if (index === 0) {
            return props.componentProps?.placeholder || `${translations.value.select} ${category.value}...`;
        }

        const parentName = selections[index - 1]?.displayName || 'option';
        return translations.value?.selectParents.replace(':parent', parentName);
    };

    const getDisplayName = (item: any): string => {
        return item[props.labelKey || 'display_name'] || item.display_name || item.name || item.title || '';
    };

    const getValue = (item: any): any => {
        return item[props.valueKey || 'id'] ?? item.id;
    };

    const emitSelectionChange = (index: number, selectedItem: any | null, selectedId: any) => {
        if (!emit) return;

        const path = selections
            .slice(0, index + 1)
            .map((level, currentIndex) => (currentIndex === index ? selectedId : level.selectedId))
            .filter((id) => id != null && (!Array.isArray(id) || id.length > 0));

        emit('change', {
            path,
            selectedId,
            selectedItem
        });
    };

    async function handleUpdate(index: number, value: any) {
        const currentLevel = selections[index];
        if (!currentLevel) return;

        currentLevel.selectedId = value;

        if (selections.length > index + 1) {
            selections.splice(index + 1);
        }

        if (!value || (Array.isArray(value) && value.length === 0)) {
            emitSelectionChange(index, null, value);
            return;
        }

        if (props.isMultiSelect) {
            const selectedIds = value as any[];
            const allChildren: any[] = [];
            const selectedNames: string[] = [];

            for (const id of selectedIds) {
                const selectedObj = currentLevel.options.find((opt: any) => getValue(opt) === id);
                if (!selectedObj) continue;

                selectedNames.push(getDisplayName(selectedObj));

                if ((props.apiUrl || props.fetchChildren) && !selectedObj._children) {
                    currentLevel.isLoading = true;
                    try {
                        if (props.apiUrl) {
                            selectedObj._children = await fetchData(selectedObj, index);
                        } else {
                            selectedObj._children = await props.fetchChildren!(selectedObj, index);
                        }
                    } finally {
                        currentLevel.isLoading = false;
                    }
                }
                if (selectedObj._children?.length) {
                    allChildren.push(...selectedObj._children);
                }
            }

            if (allChildren.length > 0) {
                const uniqueChildren = allChildren.filter(
                    (child, idx, self) => idx === self.findIndex((c) => getValue(c) === getValue(child))
                );

                const parentLabel =
                    selectedNames.length > 0
                        ? selectedNames.slice(0, 2).join(', ') +
                          (selectedNames.length > 2 ? ` +${selectedNames.length - 2} more` : '')
                        : 'Selected';

                selections.push({
                    label: `${translations.value.childLevel} ${parentLabel}`,
                    options: uniqueChildren,
                    selectedId: [],
                    isLoading: false,
                    displayName: parentLabel,
                    searchQuery: ''
                });
            }
        } else {
            const selectedObj = currentLevel.options.find((opt: any) => getValue(opt) === value);
            if (!selectedObj) return;

            emitSelectionChange(index, selectedObj, value);

            if ((props.apiUrl || props.fetchChildren)) {
                currentLevel.isLoading = true;
                try {
                    if (props.apiUrl) {
                        selectedObj._children = await fetchData(selectedObj, index);
                    } else {
                        selectedObj._children = await props.fetchChildren!(selectedObj, index);
                    }
                } finally {
                    currentLevel.isLoading = false;
                }
            }

            const firstChild = selectedObj._children?.[0];
            const selectedName = getDisplayName(firstChild ?? selectedObj);
            currentLevel.displayName = selectedName;

            if (selectedObj._children?.length) {
                selections.push({
                    label: `${selectedName}`,
                    options: selectedObj._children,
                    selectedId: null,
                    isLoading: false,
                    displayName: selectedName,
                    searchQuery: ''
                });
            }
        }
    }

    watch(
        () => props.dataTree,
        (newTree) => {
            selections.splice(0, selections.length, {
                label: category.value,
                options: newTree,
                selectedId: props.isMultiSelect ? [] : null,
                isLoading: false,
                searchQuery: ''
            });
        }
    );

    watch(
        () => selections[selections.length - 1]?.selectedId,
        (newVal) => {
            if (emit) emit('update:modelValue', newVal);
        }
    );

    return {
        placeholder,
        selections,
        gridClass,
        category,
        getValue,
        fetchData,
        resetToRoot,
        handleUpdate,
        clearSelection,
        getPlaceholder,
        getDisplayName
    };
}
