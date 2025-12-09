import { apiClient } from '@/lib/api/client';

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

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface BackendUser {
  sub: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'superadmin';
  permissions: string[];
  requiresPasswordChange: boolean;
}

export interface FrontendUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'admin' | 'manager' | 'user' | 'superadmin';
  avatar?: string;
  companyId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
  requiresPasswordChange?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginApiResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
  requiresPasswordChange: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: FrontendUser;
  expiresIn: number;
}

interface MeApiResponse {
  user: FrontendUser;
}

class AuthService {
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';
  private useMock = true;

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  private validateLoginData(data: LoginData): void {
    if (!this.validateEmail(data.email)) {
      throw new ValidationError('Please enter a valid email address');
    }
    if (!this.validatePassword(data.password)) {
      throw new ValidationError('Password must be at least 6 characters long');
    }
  }

  private storeAuthData(accessToken: string, refreshToken: string, user: FrontendUser): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(this.TOKEN_KEY, accessToken);
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
      
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  async validateCurrentUser(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }

      const user = this.getUser();
      if (!user) {
        return false;
      }

      try {
        const response = await apiClient.get<{ valid: boolean; user?: any }>('/auth/validate');
        return response.valid;
      } catch (error) {
        return this.isTokenValid(token);
      }
      
    } catch (error) {
      console.error('Error validating user:', error);
      return false;
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3;
    } catch (error) {
      return false;
    }
  }

  async refreshUserData(): Promise<FrontendUser | null> {
    try {
      const response = await apiClient.get<MeApiResponse>('/auth/me');
      if (response.user) {
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        return response.user;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  getUser(): FrontendUser | null {
    if (typeof window !== 'undefined') {
      const userStr = sessionStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!this.getToken();
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      this.validateLoginData(data);
      
      const response = await apiClient.post<LoginData, LoginApiResponse>('/auth/login', data);

      
      if (!response.accessToken) {
        throw new Error('No access token received from server');
      }
      
      const frontendUser: FrontendUser = {
        id: response.user.sub,
        email: response.user.email,
        firstName: response.user.email.split('@')[0],
        role: response.user.role,
        permissions: response.user.permissions,
        requiresPasswordChange: response.user.requiresPasswordChange,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.storeAuthData(response.accessToken, response.refreshToken, frontendUser);
      
      return {
        token: response.accessToken,
        refreshToken: response.refreshToken,
        user: frontendUser,
        expiresIn: 86400,
      };
      
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      } else if (error.status === 401) {
        throw new AuthenticationError('Invalid email or password');
      } else if (error.message?.includes('Network') || error.message?.includes('CORS') || error.message?.includes('fetch')) {
        throw new NetworkError('Cannot connect to server. Please check: 1) Server is running, 2) CORS is enabled, 3) Network connection');
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  }

  async demoLogin(): Promise<AuthResponse> {
    const demoData: LoginData = {
      email: 'superadmin@crm.local',
      password: 'ChangeMe123!'
    };
    return this.login(demoData);
  }

  async logout(): Promise<void> {
    try {
      if (!this.useMock) {
        await apiClient.post('/auth/logout', {});
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  setMockMode(enabled: boolean): void {
    this.useMock = enabled;
  }
}

export const authService = new AuthService();

authService.setMockMode(false);