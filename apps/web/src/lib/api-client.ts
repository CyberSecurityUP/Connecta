const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...fetchOptions,
        headers,
      });
    } catch (err) {
      throw new ApiError(0, "Could not connect to server. Please check that the backend is running.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new ApiError(response.status, error.message || "An error occurred", error.errors);
    }

    return response.json();
  }

  async get<T>(path: string, options: FetchOptions = {}) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T>(path: string, body?: unknown, options: FetchOptions = {}) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown, options: FetchOptions = {}) {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options: FetchOptions = {}) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const apiClient = new ApiClient(API_URL);
