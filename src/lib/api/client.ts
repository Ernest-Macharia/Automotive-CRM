// src/lib/api/client.ts
import { API_BASE_URL } from './config';

export interface ApiError extends Error {
  status?: number;
  body?: string;
}

export class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;

    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<TResponse = unknown, TRequest = unknown>(
    endpoint: string,
    options: RequestInit & { body?: TRequest } = {}
  ): Promise<TResponse> {
    if (!endpoint) throw new Error('API endpoint is undefined');

    const url = `${this.baseURL}${endpoint}`;

    // Use a plain object for headers so we can index it safely
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Convert the generic request body to a string for fetch
    const body: BodyInit | undefined = options.body !== undefined ? JSON.stringify(options.body) : undefined;

    const config: RequestInit = {
      ...options,
      headers,
      // ensure we pass the stringified body to fetch
      body,
    };

    try {
      const response = await fetch(url, config);
      // Read the response body (clone so we can read multiple times)
      const responseClone = response.clone();

      if (!response.ok) {
        // Try to get a helpful body (json or text)
        let bodyText = '';
        try {
          bodyText = await responseClone.text();
        } catch (e) {
          bodyText = `<unable to read response body: ${String(e)}>`;
        }

        // Try to parse JSON for message/error
        let serverMessage = `HTTP error! status: ${response.status}`;
        try {
          const parsed = JSON.parse(bodyText);
          serverMessage = parsed?.message || parsed?.error || bodyText || serverMessage;
        } catch {
          serverMessage = bodyText || serverMessage;
        }

        // Log detailed info for devs (but don't log 401 noise)
        if (response.status !== 401) {
          console.error('❌ API Error', {
            status: response.status,
            url,
            request: {
              method: config.method,
              headers,
              // don't log body for security in production; this is for dev debugging
            },
            responseBody: bodyText,
            responseHeaders: Object.fromEntries(response.headers.entries()),
          });
        }

        const err: ApiError = new Error(serverMessage) as ApiError;
        err.status = response.status;
        err.body = bodyText;
        throw err;
      }

      // Success: parse JSON if available, otherwise return text
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as TResponse;
      }
      return (await response.text()) as unknown as TResponse;
    } catch (error: unknown) {
      // Network-level errors (fetch failures) produce TypeError
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error('❌ Network error:', error);
          throw new Error('Network error. Please check your internet connection and ensure the server is reachable.');
        }
        // Re-throw known ApiError or other Error
        throw error;
      }

      console.error('❌ Unknown error in ApiClient.request:', error);
      throw new Error('An unexpected error occurred');
    }
  }

  // Public helpers with strong typings
  async get<TResponse = unknown>(endpoint: string): Promise<TResponse> {
    return this.request<TResponse>(endpoint, { method: 'GET' });
  }

  async post<TRequest = unknown, TResponse = unknown>(endpoint: string, data?: TRequest): Promise<TResponse> {
    return this.request<TResponse, TRequest>(endpoint, { method: 'POST', body: data });
  }

  async put<TRequest = unknown, TResponse = unknown>(endpoint: string, data?: TRequest): Promise<TResponse> {
    return this.request<TResponse, TRequest>(endpoint, { method: 'PUT', body: data });
  }

  async patch<TRequest = unknown, TResponse = unknown>(endpoint: string, data?: TRequest): Promise<TResponse> {
    return this.request<TResponse, TRequest>(endpoint, { method: 'PATCH', body: data });
  }

  async delete<TResponse = unknown>(endpoint: string): Promise<TResponse> {
    return this.request<TResponse>(endpoint, { method: 'DELETE' });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
