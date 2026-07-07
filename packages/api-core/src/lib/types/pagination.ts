export interface PaginationQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly sort?: string;
  readonly order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
}