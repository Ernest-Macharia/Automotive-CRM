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