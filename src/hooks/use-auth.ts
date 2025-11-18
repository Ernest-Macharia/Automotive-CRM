// src/hooks/use-auth.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AxiosResponse } from 'axios';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  roleName: string;
}

interface User {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  requiresPasswordChange: boolean;
}

interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresPasswordChange: boolean;
}

export function useAuth() {
  const login = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
  });

  const register = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/register', userData);
      return response.data;
    },
  });

  const logout = async () => {
    await apiClient.post('/auth/logout');
    window.location.href = '/login';
  };

  return { 
    login, 
    register, 
    logout 
  };
}