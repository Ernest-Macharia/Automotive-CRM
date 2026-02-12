// hooks/useCurrentUser.ts
import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { userService, User, createUserPermissionChecker } from '@/services/settings/userService';
import { roleService, ROLES } from '@/services/settings/roleService';

interface UseCurrentUserReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isTechnician: boolean;
  isAdmin: boolean;
  isManagement: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get frontend user from auth service
      const authUser = authService.getUser();
      
      if (!authUser) {
        setUser(null);
        return;
      }

      // Transform auth user to match our User interface
      // First try to get full user data from userService
      let fullUser: User | null = null;
      
      try {
        // Try to fetch the complete user data from userService
        fullUser = await userService.getUserById(authUser.id);
      } catch (err) {
        console.warn('Could not fetch full user data, using auth user data', err);
      }

      if (fullUser) {
        setUser(fullUser);
      } else {
        // Create a minimal user object from auth data
        const minimalUser: User = {
          id: authUser.id,
          email: authUser.email,
          name: `${authUser.firstName} ${authUser.lastName || ''}`.trim(),
          role: authUser.role,
          permissions: authUser.permissions || [],
          active: authUser.isActive,
        //   requiresPasswordChange: authUser.requiresPasswordChange || false,
          createdAt: authUser.createdAt,
          updatedAt: authUser.updatedAt,
        };
        setUser(minimalUser);
      }
    } catch (err) {
      console.error('Error loading current user:', err);
      setError(err instanceof Error ? err : new Error('Failed to load user'));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = async () => {
    await loadUser();
  };

  // Role checks using userService
  const isTechnician = user ? userService.getUserRoleName(user) === ROLES.TECHNICIAN : false;
  const isAdmin = user ? userService.getUserRoleName(user) === ROLES.ADMIN : false;
  const isManagement = user ? userService.getUserRoleName(user) === ROLES.MANAGEMENT : false;

  // Permission check helpers
  const permissionChecker = user ? createUserPermissionChecker(user) : null;

  const hasPermission = (permission: string): boolean => {
    return permissionChecker?.hasPermission(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissionChecker?.hasAnyPermission(permissions) || false;
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissionChecker?.hasAllPermissions(permissions) || false;
  };

  return {
    user,
    isLoading,
    error,
    isTechnician,
    isAdmin,
    isManagement,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshUser,
  };
}