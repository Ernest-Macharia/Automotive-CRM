import { API_BASE_URL } from './config';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthTokens,
} from '@/lib/auth/tokenStorage';
import {
  buildRequestCacheKey,
  clearPendingRequest,
  clearRequestCache,
  getCachedResponse,
  getPendingRequest,
  setCachedResponse,
  setPendingRequest,
} from './requestCache';

class ApiClient {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getStoredAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (!data?.accessToken) {
        return false;
      }

      storeAuthTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, allowRetry = true): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    };

    const method = (config.method || 'GET').toUpperCase();
    const cacheKey = buildRequestCacheKey(method, url, headers);

    if (method === 'GET') {
      const cached = getCachedResponse<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const pending = getPendingRequest<T>(cacheKey);
      if (pending) {
        return pending;
      }
    } else {
      clearRequestCache();
    }

    try {
      const executeRequest = async (): Promise<T> => {
        const response = await fetch(url, config);

        if (!response.ok) {
          if (response.status === 401 && allowRetry && !endpoint.startsWith('/auth/refresh')) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
              return this.request<T>(endpoint, options, false);
            }
          }

          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          
          const error = new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
          (error as any).status = response.status;
          (error as any).response = {
            status: response.status,
            statusText: response.statusText,
            data: errorText
          };
          
          if (response.status === 401) {
            handleUnauthorizedRedirect();
          }
          
          throw error;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (method === 'GET') {
            setCachedResponse(cacheKey, data);
          }
          return data;
        }

        const emptyResponse = {} as T;
        if (method === 'GET') {
          setCachedResponse(cacheKey, emptyResponse);
        }
        return emptyResponse;
      };

      if (method === 'GET') {
        const pendingPromise = executeRequest().finally(() => clearPendingRequest(cacheKey));
        setPendingRequest(cacheKey, pendingPromise);
        return await pendingPromise;
      }

      return await executeRequest();
      
    } catch (error) {
      // If it's already our enhanced error, rethrow it
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      
      // Handle network errors
      const networkError = new Error('Network error');
      (networkError as any).isNetworkError = true;
      (networkError as any).message = error instanceof Error ? error.message : 'Network error';
      throw networkError;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    return this.request<T>(url);
  }

  async post<D, T>(endpoint: string, data: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<D, T>(endpoint: string, data: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<D, T>(endpoint: string, data: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
