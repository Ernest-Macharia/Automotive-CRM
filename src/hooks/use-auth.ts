// src/hooks/use-auth.ts
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { LoginData, RegisterData, AuthResponse } from '@/services/authService';

export function useAuth() {
  const login = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      return await authService.login(credentials);
    },
  });

  const register = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      // ✅ FIXED: Use the actual register service method instead of login
      return await authService.register(userData);
    },
  });

  const logout = async () => {
    await authService.logout();
  };

  return { 
    login, 
    register, 
    logout 
  };
}