import type { Pagination } from '@/types/CommonTypes';

export type PaginationUpdateAction = 'create' | 'delete' | 'bulk_create';

interface UpdatePaginationOptions {
    dataLength: number;
    itemsCount?: number;
    pagination: Pagination;
    action: PaginationUpdateAction;
}

export function updatePaginationOptimistically({
	action,
	pagination,
	dataLength,
	itemsCount = 1
}: UpdatePaginationOptions): Pagination {
	const { total, per_page, current_page } = pagination;

	const totalChangeMap: Record<PaginationUpdateAction, number> = {
		create: 1,
		delete: -1,
		bulk_create: itemsCount
  };

  let updatedTotal = Math.max(total + totalChangeMap[action], 0);
  const lastPage = Math.max(1, Math.ceil(updatedTotal / per_page));
  let updatedCurrentPage = current_page;

  if (action === 'delete' && dataLength === 0 && current_page > 1)  updatedCurrentPage -= 1;

  const hasData = updatedTotal > 0;
  const from = hasData ? (updatedCurrentPage - 1) * per_page + 1 : 0;
  const to = hasData ? Math.min(from + dataLength - 1, updatedTotal) : 0;

  return {
    ...pagination,

    total: updatedTotal,
    last_page: lastPage,
    current_page: updatedCurrentPage,

    from,
    to
  };
}