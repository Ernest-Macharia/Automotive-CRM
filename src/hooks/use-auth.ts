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
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthResponse {
  user: User;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

export function useAuth() {
  const login = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiClient.post('/auth/login', credentials);
      return (response as any).data;
    },
  });

  const register = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiClient.post('/auth/register', userData);
      return (response as any).data;
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