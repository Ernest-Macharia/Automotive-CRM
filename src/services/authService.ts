// src/services/authService.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export const authService = {
  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.LOGIN,
        credentials
      );
      
      if (response.accessToken && response.refreshToken) {
        apiClient.setTokens(response.accessToken, response.refreshToken);
      }
      
      return response;
    } catch (error: any) {
      // Handle 401 as expected application state, not an error
      if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
        throw new AuthenticationError('Invalid email or password. Please check your credentials and try again.');
      }
      
      // Handle network errors
      if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
        throw new NetworkError('Unable to connect to the server. Please check your internet connection.');
      }
      
      // Handle server errors
      if (error.message.includes('500')) {
        throw new Error('Server temporarily unavailable. Please try again later.');
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    return await apiClient.post<User>(API_ENDPOINTS.GET_ME);
  },

  async logout(): Promise<void> {
    apiClient.clearTokens();
  },

  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  },
};