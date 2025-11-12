// src/services/authService.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, API_BASE_URL } from '@/lib/api/config';

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'sales' | 'technician' | 'manager' | 'user';
  phone?: string;
  avatar?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export class AuthenticationError extends Error {
  status = 401;
  constructor(message = 'Invalid email or password') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'No internet connection. Please check your network.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class SessionExpiredError extends Error {
  status = 401;
  constructor() {
    super('Your session has expired. Please log in again.');
    this.name = 'SessionExpiredError';
  }
}

export const authService = {
  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<LoginData, AuthResponse>(
        API_ENDPOINTS.LOGIN,
        credentials
      );

      if (!response?.accessToken || !response?.refreshToken || !response?.user) {
        throw new Error('Invalid response from server');
      }

      apiClient.setTokens(response.accessToken, response.refreshToken);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        const apiError = error as { status?: number };
        if (apiError.status === 401) {
          throw new AuthenticationError();
        }
        if (error.message.toLowerCase().includes('network') || error.name === 'TypeError') {
          throw new NetworkError();
        }
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      return await apiClient.get<User>(API_ENDPOINTS.GET_ME);
    } catch (error: unknown) {
      if (error instanceof Error && (error as { status?: number }).status === 401) {
        throw new SessionExpiredError();
      }
      throw error;
    }
  },

  async refreshToken(): Promise<string> {
    const refreshToken = apiClient.getRefreshToken();
    if (!refreshToken) throw new SessionExpiredError();

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error('Refresh failed');

      const data = await response.json();
      const newAccessToken = data.accessToken;

      apiClient.setTokens(newAccessToken, refreshToken);
      return newAccessToken;
    } catch {
      apiClient.clearTokens();
      throw new SessionExpiredError();
    }
  },

  logout(): void {
    apiClient.clearTokens();
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  },

  async demoLogin(): Promise<AuthResponse> {
    return this.login({
      email: 'superadmin@crm.local',
      password: 'ChangeMe123!',
    });
  },
};

