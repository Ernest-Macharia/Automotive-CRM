import { API_BASE_URL } from './config';

class ApiClient {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = sessionStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Create an error object with status and response data
        const error = new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
        
        // Add status and response data to the error object
        (error as any).status = response.status;
        (error as any).response = {
          status: response.status,
          statusText: response.statusText,
          data: errorText
        };
        
        if (response.status === 401) {
          sessionStorage.removeItem('accessToken');
          // Don't redirect here - let the component handle it
          // window.location.href = '/auth/login';
        }
        
        throw error;
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return {} as T;
      
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