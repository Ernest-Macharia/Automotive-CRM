// services/authService.ts
import { apiClient } from '@/lib/api/client';
import { LoginData, AuthResponse, User } from './types/auth';

// Error classes moved from separate declarations
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

interface LoginApiResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

interface MeApiResponse {
  user: User;
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

  // Store tokens and user data
  private storeAuthData(accessToken: string, refreshToken: string, user: User): void {
    // Only store on client side
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(this.TOKEN_KEY, accessToken);
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));

      apiClient.setTokens(accessToken, refreshToken);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      apiClient.clearTokens();
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  getUser(): User | null {
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
      
      this.storeAuthData(response.access_token, response.refresh_token, response.user);
      
      return {
        token: response.access_token,
        refreshToken: response.refresh_token,
        user: response.user,
        expiresIn: response.expires_in
      };
      
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      } else if (error.status === 401) {
        throw new AuthenticationError('Invalid email or password');
      } else if (error.message?.includes('Network') || error.message?.includes('CORS')) {
        throw new NetworkError('Cannot connect to server. Check internet connection and CORS settings.');
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
    console.log(`🔄 Auth service mock mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
}

export const authService = new AuthService();

// Initialize with mock mode
authService.setMockMode(true);