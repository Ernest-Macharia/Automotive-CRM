import { useState, useEffect } from 'react';
import { authService, type AuthRole } from '@/services/authService';
import { userService, User, type UserRole, createUserPermissionChecker } from '@/services/settings/userService';
import { ROLES } from '@/services/settings/roleService';

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

  const normalizeRole = (role: AuthRole | string | undefined, roleName?: string, roleDisplayName?: string): UserRole | string => {
    if (!role) {
      return roleName || 'unknown';
    }

    if (typeof role === 'string') {
      return role;
    }

    return {
      _id: role._id,
      id: role.id || role._id,
      name: role.name || roleName || 'unknown',
      display_name: role.display_name || roleDisplayName || role.name || roleName || 'Unknown',
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
    };
  };

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedUser = authService.getUser();
      
      if (!storedUser && !authService.getToken()) {
        setUser(null);
        return;
      }

      const authUser = await authService.refreshUserData().catch(() => storedUser);

      if (!authUser) {
        setUser(null);
        return;
      }

      let fullUser: User | null = null;
      
      try {
        fullUser = await userService.getUserById(authUser.id);
      } catch (err) {
        console.warn('Could not fetch full user data, using auth user data', err);
      }

      if (fullUser) {
        setUser(fullUser);
      } else {
        const minimalUser: User = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name || `${authUser.firstName} ${authUser.lastName || ''}`.trim(),
          role: normalizeRole(
            authUser.roleData || authUser.role,
            authUser.roleName,
            authUser.roleDisplayName || authUser.display_name,
          ),
          permissions: authUser.permissions || [],
          additionalPermissions: authUser.additionalPermissions || [],
          active: authUser.isActive,
          requiresPasswordChange: authUser.requiresPasswordChange || false,
          organizationId: authUser.organizationId,
          organizationName: authUser.organizationName,
          organization: authUser.organization,
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
