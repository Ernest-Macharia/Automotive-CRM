// src/lib/api/types.ts
export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  status: number;
  success: boolean;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}