// src/hooks/use-auth.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

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
      // ✅ FIX: Remove the generic type or use AxiosResponse
      const response = await apiClient.post('/auth/login', credentials);
      
      // Handle the unknown type properly
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data as AuthResponse;
      }
      
      throw new Error('Invalid response format');
    },
  });

  const register = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      // ✅ FIX: Remove the generic type or use AxiosResponse
      const response = await apiClient.post('/auth/register', userData);
      
      // Handle the unknown type properly
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data as AuthResponse;
      }
      
      throw new Error('Invalid response format');
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