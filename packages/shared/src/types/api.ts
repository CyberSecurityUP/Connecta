export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  totalCount?: number;
}

export interface ApiError {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}
