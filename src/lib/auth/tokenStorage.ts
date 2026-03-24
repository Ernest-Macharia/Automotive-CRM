export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

export function hasPersistentAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'));
}

export function storeAuthTokens(accessToken: string, refreshToken?: string | null): void {
  if (typeof window === 'undefined') return;

  const storage = hasPersistentAuth() ? localStorage : sessionStorage;
  storage.setItem('accessToken', accessToken);

  if (refreshToken) {
    storage.setItem('refreshToken', refreshToken);
  }
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}
