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
      this.accessToken = sessionStorage.getItem('accessToken');
      this.refreshToken = sessionStorage.getItem('refreshToken');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<TResponse = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TResponse> {
    if (!endpoint) throw new Error('API endpoint is undefined');

    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const responseClone = response.clone();

      if (!response.ok) {
        let bodyText = '';
        try {
          bodyText = await responseClone.text();
        } catch (e) {
          bodyText = `<unable to read response body: ${String(e)}>`;
        }

        let serverMessage = `HTTP error! status: ${response.status}`;
        try {
          const parsed = JSON.parse(bodyText);
          serverMessage = parsed?.message || parsed?.error || bodyText || serverMessage;
        } catch {
          serverMessage = bodyText || serverMessage;
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
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and ensure the server is reachable.');
        }
        throw error;
      }

      console.error('Unknown error in ApiClient.request:', error);
      throw new Error('An unexpected error occurred');
    }
  }

  async get<TResponse = unknown>(endpoint: string): Promise<TResponse> {
    return this.request<TResponse>(endpoint, { method: 'GET' });
  }

  async post<TRequest = unknown, TResponse = unknown>(endpoint: string, data?: TRequest): Promise<TResponse> {
    const body = data !== undefined ? JSON.stringify(data) : undefined;
    return this.request<TResponse>(endpoint, { method: 'POST', body });
  }

  async put<TRequest = unknown, TResponse = unknown>(endpoint: string, data?: TRequest): Promise<TResponse> {
    const body = data !== undefined ? JSON.stringify(data) : undefined;
    return this.request<TResponse>(endpoint, { method: 'PUT', body });
  }

  async patch<TRequest = unknown, TResponse = unknown>(endpoint: string, data?: TRequest): Promise<TResponse> {
    const body = data !== undefined ? JSON.stringify(data) : undefined;
    return this.request<TResponse>(endpoint, { method: 'PATCH', body });
  }

  async delete<TResponse = unknown>(endpoint: string): Promise<TResponse> {
    return this.request<TResponse>(endpoint, { method: 'DELETE' });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);