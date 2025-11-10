import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export function useAuth() {
  const login = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
  });

  const logout = async () => {
    await apiClient.post('/auth/logout');
    window.location.href = '/login';
  };

  return { login, logout };
}