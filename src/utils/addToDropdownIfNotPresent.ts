// Default fallback type (for backward compatibility)
type DefaultDropdownOption = { id: number | string; name: string };

// Generic dropdown type
type Dropdown<T extends { id: number | string }> =
    | {
          options: { value: Array<T> };
      }
    | Array<T>
    | any;

// Generic input types
type MultipleItemsInput<T extends { id: number | string }> = {
    items: Array<T>;
    dropdown: Dropdown<T>;
};

type SingleItemInput<T extends { id: number | string }> = {
    item: T | null;
    dropdown: Dropdown<T>;
};

export const addMultipleItemsToDropdownIfNotPresent = <T extends { id: number | string } = DefaultDropdownOption>(
    input: MultipleItemsInput<T> | Array<MultipleItemsInput<T>>,
    hasNoOptions = false
): void => {
    const processItems = (items: Array<T>, dropdown: Dropdown<T>): void => {
        let existingIds = new Set();

        if (!hasNoOptions) {
            existingIds = new Set(dropdown.options.value.map((option: any) => option.id));
        } else {
            existingIds = new Set(dropdown.map((option: any) => option.id));
        }

        items.forEach((item: any) => {
            if (!existingIds.has(item.id)) {
                if (hasNoOptions) {
                    dropdown.push({
                        ...item,
                        display_name: item.name
                    });
                } else {
                    dropdown.options.value = [...dropdown.options.value, item];
                }
            }
        });
    };

    if (Array.isArray(input)) {
        input.forEach(({ items, dropdown }) => processItems(items, dropdown));
    } else {
        processItems(input.items, input.dropdown);
    }
};

export const addSingleItemToDropdownIfNotPresent = <T extends { id: number | string } = DefaultDropdownOption>(
    input: SingleItemInput<T> | Array<SingleItemInput<T>>
): void => {
    const processItem = (item: T | null, dropdown: Dropdown<T>): void => {
        if (!item) return;

        const exists = dropdown.options.value.some((option: any) => option.id === item.id);

        if (!exists) {
            dropdown.options.value.push(item);
        }
    };

    if (Array.isArray(input)) {
        input.forEach(({ item, dropdown }) => processItem(item, dropdown));
    } else {
        processItem(input.item, input.dropdown);
    }
};
