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

export interface RegisterData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  companyName?: string;
  phone?: string;
  agreeToTerms: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword?: string;
}

export interface ForceChangePasswordData {
  newPassword: string;
  confirmPassword?: string;
  token?: string;
}

export interface LoginApiResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
  requiresPasswordChange: boolean;
}

export interface RegisterApiResponse {
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

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface EmailStatusResponse {
  status: 'active' | 'inactive';
  message?: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';
  private useMock = false;
  private refreshPromise: Promise<string> | null = null;

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  private validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private validateLoginData(data: LoginData): void {
    if (!this.validateEmail(data.email)) {
      throw new ValidationError('Please enter a valid email address');
    }
    if (!data.password || data.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }
  }

  private validateRegisterData(data: RegisterData): void {
    if (!data.firstName || data.firstName.trim().length < 2) {
      throw new ValidationError('First name must be at least 2 characters long');
    }
    
    if (!this.validateEmail(data.email)) {
      throw new ValidationError('Please enter a valid email address');
    }
    
    if (!this.validatePassword(data.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
      );
    }
    
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }
    
    if (data.phone && !this.validatePhone(data.phone)) {
      throw new ValidationError('Please enter a valid phone number');
    }
    
    if (!data.agreeToTerms) {
      throw new ValidationError('You must agree to the terms and conditions');
    }
  }

  private storeAuthData(accessToken: string, refreshToken: string, user: FrontendUser, rememberMe?: boolean): void {
    if (typeof window === 'undefined') return;
    
    try {
      if (rememberMe) {
        // Store in localStorage for persistent login
        localStorage.setItem(this.TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      } else {
        // Store in sessionStorage for session-only
        sessionStorage.setItem(this.TOKEN_KEY, accessToken);
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  private mapBackendUserToFrontend(backendUser: BackendUser): FrontendUser {
    const nameParts = backendUser.email.split('@')[0].split('.');
    const firstName = nameParts[0] || backendUser.email.split('@')[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      id: backendUser.sub,
      email: backendUser.email,
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      lastName: lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1) : undefined,
      role: backendUser.role,
      permissions: backendUser.permissions,
      requiresPasswordChange: backendUser.requiresPasswordChange,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
      if (parts.length !== 3) return false;
      
      // Check token expiration
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch (error) {
      return false;
    }
  }

  async refreshUserData(): Promise<FrontendUser | null> {
    try {
      const response = await apiClient.get<MeApiResponse>('/auth/me');
      if (response.user) {
        const userStr = JSON.stringify(response.user);
        sessionStorage.setItem(this.USER_KEY, userStr);
        localStorage.setItem(this.USER_KEY, userStr);
        return response.user;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
          throw new AuthenticationError('No refresh token available');
        }

        const response = await apiClient.post<{ refreshToken: string }, RefreshTokenResponse>('/auth/refresh', {
          refreshToken
        });

        const currentUser = this.getUser();
        const backendUser = currentUser ? {
          sub: currentUser.id,
          email: currentUser.email,
          role: currentUser.role,
          permissions: currentUser.permissions || [],
          requiresPasswordChange: currentUser.requiresPasswordChange || false
        } : {
          sub: '',
          email: '',
          role: 'user' as const,
          permissions: [],
          requiresPasswordChange: false
        };

        const frontendUser = this.mapBackendUserToFrontend(backendUser);
        
        this.storeAuthData(
          response.accessToken,
          response.refreshToken,
          frontendUser
        );

        return response.accessToken;
      } catch (error: any) {
        this.clearAuthData();
        throw new AuthenticationError('Session expired. Please login again.');
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  getUser(): FrontendUser | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = this.getToken();
    return !!token && this.isTokenValid(token);
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      this.validateLoginData(data);
      
      const response = await apiClient.post<LoginData, LoginApiResponse>('/auth/login', data);
      
      if (!response.accessToken) {
        throw new Error('No access token received from server');
      }
      
      const frontendUser = this.mapBackendUserToFrontend(response.user);
      
      this.storeAuthData(response.accessToken, response.refreshToken, frontendUser, data.rememberMe);
      
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

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      this.validateRegisterData(data);
      
      const { confirmPassword, agreeToTerms, ...registerData } = data;
      
      const response = await apiClient.post<typeof registerData, RegisterApiResponse>('/auth/register', registerData);
      
      if (!response.accessToken) {
        throw new Error('No access token received from server');
      }
      
      const frontendUser = this.mapBackendUserToFrontend(response.user);
      
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
      } else if (error.status === 400) {
        throw new ValidationError(error.message || 'Invalid registration data');
      } else if (error.status === 409) {
        throw new ValidationError('Email already registered');
      } else if (error.message?.includes('Network') || error.message?.includes('CORS') || error.message?.includes('fetch')) {
        throw new NetworkError('Cannot connect to server. Please check: 1) Server is running, 2) CORS is enabled, 3) Network connection');
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.');
      }
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      if (!this.validateEmail(email)) {
        throw new ValidationError('Please enter a valid email address');
      }
      
      await apiClient.post('/auth/forgot-password', { email });
      
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      } else if (error.status === 404) {
        throw new ValidationError('No account found with this email');
      } else {
        throw new Error(error.message || 'Failed to send reset email. Please try again.');
      }
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      if (!this.validatePassword(newPassword)) {
        throw new ValidationError(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }
      
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword
      });
      
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      } else if (error.status === 400) {
        throw new ValidationError('Invalid or expired reset token');
      } else {
        throw new Error(error.message || 'Failed to reset password. Please try again.');
      }
    }
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      if (!this.validatePassword(data.newPassword)) {
        throw new ValidationError(
          'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }
      
      if (data.newPassword !== data.confirmNewPassword) {
        throw new ValidationError('New passwords do not match');
      }
      
      await apiClient.patch('/auth/change-password', data);
      
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      } else if (error.status === 400) {
        throw new ValidationError('Current password is incorrect');
      } else {
        throw new Error(error.message || 'Failed to change password. Please try again.');
      }
    }
  }

  async forceChangePassword(data: ForceChangePasswordData): Promise<void> {
    try {
      if (!this.validatePassword(data.newPassword)) {
        throw new ValidationError(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }
      
      if (data.newPassword !== data.confirmPassword) {
        throw new ValidationError('Passwords do not match');
      }
      
      await apiClient.patch('/auth/force-change-password', data);
      
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      } else {
        throw new Error(error.message || 'Failed to change password. Please try again.');
      }
    }
  }

  async getCurrentUser(): Promise<FrontendUser> {
    try {
      const response = await apiClient.get<MeApiResponse>('/auth/me');
      const user = response.user;
      
      // Update stored user data
      const userStr = JSON.stringify(user);
      sessionStorage.setItem(this.USER_KEY, userStr);
      localStorage.setItem(this.USER_KEY, userStr);
      
      return user;
    } catch (error: any) {
      if (error.status === 401) {
        this.clearAuthData();
        throw new AuthenticationError('Session expired. Please login again.');
      }
      throw error;
    }
  }

  async checkEmailStatus(): Promise<EmailStatusResponse> {
    try {
      const response = await apiClient.get<EmailStatusResponse>('/auth/email-status');
      return response;
    } catch (error) {
      return {
        status: 'inactive',
        message: 'Email service is not available'
      };
    }
  }

  private getErrorStatus(error: any): number | undefined {
    return error?.status ?? error?.response?.status;
  }

  private getBackendMessage(error: any): string | undefined {
    // common shapes: error.message, error.response.data.message, etc
    return (
      error?.response?.data?.message ??
      error?.data?.message ??
      error?.message
    );
  }

  private isNetworkIssue(error: any): boolean {
    const msg = String(error?.message ?? '');
    return (
      msg.includes('Network') ||
      msg.includes('CORS') ||
      msg.includes('fetch') ||
      msg.includes('Failed to fetch') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ETIMEDOUT')
    );
  }


  async demoLogin(): Promise<AuthResponse> {
    const demoData: LoginData = {
      email: 'superadmin@crm.local',
      password: 'Testme123!',
      rememberMe: false
    };
    return this.login(demoData);
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
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