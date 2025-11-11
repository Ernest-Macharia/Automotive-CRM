// src/services/authService.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/** Typed Errors **/
export class AuthenticationError extends Error {
  status = 401;
  constructor(message?: string) {
    super(message ?? 'Invalid credentials');
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends Error {
  constructor(message?: string) {
    super(message ?? 'Network error occurred');
    this.name = 'NetworkError';
  }
}

export const authService = {
  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const res = await apiClient.post<LoginData, AuthResponse>(
        API_ENDPOINTS.LOGIN,
        credentials
      );

      // Validate response shape defensively
      if (!res || !res.accessToken || !res.refreshToken || !res.user) {
        throw new Error('Malformed auth response from server');
      }

      // Persist tokens in client layer
      apiClient.setTokens(res.accessToken, res.refreshToken);

      return res;
    } catch (err: unknown) {
      // Normalize known ApiError shape thrown by ApiClient
      if (err instanceof Error) {
        // ApiClient attaches status on Error when HTTP error occurred
        const maybeStatus = (err as any).status as number | undefined;

        if (maybeStatus === 401) {
          throw new AuthenticationError(err.message ?? 'Invalid credentials');
        }

        // Detect network errors (ApiClient returns Error with message including 'Network')
        if (err.message?.toString().toLowerCase().includes('network')) {
          throw new NetworkError(err.message);
        }

        // rethrow other errors
        throw err;
      }
      // unknown non-Error
      throw new Error('An unexpected error occurred during login');
    }
  },

  async getCurrentUser(): Promise<User> {
    // Backend may use GET or POST for this route; adjust accordingly.
    // Based on your swagger earlier, this endpoint exists; ensure API_ENDPOINTS.GET_ME is correct.
    return apiClient.get<User>(API_ENDPOINTS.GET_ME);
  },

  logout(): void {
    apiClient.clearTokens();
  },

  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  },

  // convenience: demo login (only for development)
  async demoLogin(): Promise<AuthResponse> {
    return this.login({
      email: 'superadmin@crm.local',
      password: 'ChangeMe123!',
    });
  },
};
