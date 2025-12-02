// Session management utilities

export const session = {
  // Get item from sessionStorage
  get: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(key);
    }
    return null;
  },

  // Set item in sessionStorage
  set: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  },

  // Remove item from sessionStorage
  remove: (key: string): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  },

  // Clear all auth items
  clearAuth: (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
    }
  },

  // Get user data
  getUser: (): any => {
    if (typeof window !== 'undefined') {
      const userStr = sessionStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  // Set user data
  setUser: (user: any): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  },
};

// Check if running on client side
export const isClient = typeof window !== 'undefined';

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (isClient) {
    return !!sessionStorage.getItem('accessToken');
  }
  return false;
};