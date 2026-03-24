import { clearStoredAuth } from './tokenStorage';

export function handleUnauthorizedRedirect(): void {
  if (typeof window === 'undefined') return;

  clearStoredAuth();

  if (!window.location.pathname.startsWith('/auth/login')) {
    window.location.href = '/auth/login';
  }
}
