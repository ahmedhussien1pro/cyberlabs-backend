/**
 * Pagination Interfaces
 * Query and result pagination structures
 */

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Helper to calculate pagination options
 */
export function calculatePagination(
  page: number = 1,
  pageSize: number = 10,
): PaginationOptions {
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(100, Math.max(1, pageSize));

  return {
    page: validPage,
    pageSize: validPageSize,
    skip: (validPage - 1) * validPageSize,
    take: validPageSize,
  };
}

/**
 * Helper to build pagination metadata
 */
export function buildPaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number,
) {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
