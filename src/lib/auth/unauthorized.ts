export function handleUnauthorizedRedirect(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  if (!window.location.pathname.startsWith('/auth/login')) {
    window.location.href = '/auth/login';
  }
}
