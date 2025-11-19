// src/services/authService.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, API_BASE_URL } from '@/lib/api/config';

// ✅ Export all interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  roleName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
  message?: string;
}

export class AuthenticationError extends Error {
  status = 401;
  constructor(message = 'Invalid email or password') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RegistrationError extends Error {
  status = 400;
  constructor(message = 'Registration failed') {
    super(message);
    this.name = 'RegistrationError';
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
      console.log('🔐 Attempting login with:', { email: credentials.email });
      
      const response = await apiClient.post<LoginData, AuthResponse>(
        API_ENDPOINTS.LOGIN,
        credentials
      );

      console.log('✅ Login API response:', response);

      if (!response?.accessToken || !response?.refreshToken || !response?.user) {
        console.error('❌ Invalid login response:', response);
        throw new Error('Invalid response from server');
      }

      // Store tokens and user data
      sessionStorage.setItem('accessToken', response.accessToken);
      sessionStorage.setItem('refreshToken', response.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('📦 Tokens stored in sessionStorage');
      
      return response;
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      
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

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('👤 Attempting registration with:', { email: userData.email });
      
      const response = await apiClient.post<RegisterData, AuthResponse>(
        API_ENDPOINTS.REGISTER, // ✅ FIXED: Now using the defined REGISTER endpoint
        userData
      );

      console.log('✅ Registration API response:', response);

      if (!response?.accessToken || !response?.refreshToken || !response?.user) {
        console.error('❌ Invalid registration response:', response);
        throw new Error('Invalid response from server');
      }

      // Store tokens and user data (auto-login after registration)
      sessionStorage.setItem('accessToken', response.accessToken);
      sessionStorage.setItem('refreshToken', response.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('📦 Tokens stored in sessionStorage after registration');
      
      return response;
    } catch (error: unknown) {
      console.error('❌ Registration error:', error);
      
      if (error instanceof Error) {
        const apiError = error as { status?: number };
        if (apiError.status === 400) {
          throw new RegistrationError('User already exists or invalid data');
        }
        if (apiError.status === 401) {
          throw new AuthenticationError('Registration not authorized');
        }
        if (error.message.toLowerCase().includes('network') || error.name === 'TypeError') {
          throw new NetworkError();
        }
      }
      throw new RegistrationError('Registration failed. Please try again.');
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      console.log('👤 Fetching current user...');
      
      // Check if we have a token first
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        console.warn('⚠️ No access token found when fetching current user');
        throw new SessionExpiredError();
      }

      const user = await apiClient.get<User>(API_ENDPOINTS.GET_ME);
      console.log('✅ Current user fetched:', user);
      
      // Update stored user data if needed
      sessionStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error: unknown) {
      console.error('❌ Get current user error:', error);
      
      if (error instanceof Error && (error as { status?: number }).status === 401) {
        // Clear tokens on 401
        this.clearTokens();
        throw new SessionExpiredError();
      }
      throw error;
    }
  },

  async refreshToken(): Promise<string> {
    console.log('🔄 Attempting token refresh...');
    
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('❌ No refresh token found');
      throw new SessionExpiredError();
    }

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('❌ Token refresh failed with status:', response.status);
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      const newAccessToken = data.accessToken;

      if (!newAccessToken) {
        console.error('❌ No access token in refresh response');
        throw new Error('Invalid refresh response');
      }

      // Store new token
      sessionStorage.setItem('accessToken', newAccessToken);
      console.log('✅ Token refreshed successfully');
      
      return newAccessToken;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      this.logout();
      throw new SessionExpiredError();
    }
  },

  logout(): void {
    console.log('🚪 Logging out...');
    
    // Clear all stored data
    this.clearTokens();
    
    // Optional: Call logout API if available
    try {
      apiClient.post(API_ENDPOINTS.LOGOUT).catch(console.error);
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Redirect to login
    window.location.href = '/login';
  },

  clearTokens(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    console.log('🧹 Tokens cleared from sessionStorage');
  },

  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('accessToken');
    const isAuthenticated = !!token;
    console.log('🔐 Authentication check:', { isAuthenticated, hasToken: !!token });
    return isAuthenticated;
  },

  getAccessToken(): string | null {
    return sessionStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken');
  },

  getStoredUser(): User | null {
    try {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('❌ Error parsing stored user:', error);
      return null;
    }
  },

  async demoLogin(): Promise<AuthResponse> {
    console.log('🎯 Attempting demo login...');
    return this.login({
      email: 'superadmin@crm.local',
      password: 'ChangeMe123!',
    });
  },

  // Utility method to check token expiration (basic check)
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      // Basic JWT expiration check (you might want to use a proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
      return true;
    }
  },
};