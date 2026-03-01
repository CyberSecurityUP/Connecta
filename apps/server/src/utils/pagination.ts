export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
}

export function parsePagination(query: { cursor?: string; limit?: string }): CursorPaginationParams {
  return {
    cursor: query.cursor || undefined,
    limit: Math.min(parseInt(query.limit || "50", 10), 100),
  };
}
