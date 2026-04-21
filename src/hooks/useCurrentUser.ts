import { useCallback, useEffect, useState } from 'react';
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

const USER_CACHE_TTL_MS = 2 * 60 * 1000;
const NO_TOKEN_SIGNATURE = '__no_token__';

let cachedCurrentUser: User | null | undefined;
let cachedUserAt = 0;
let cachedTokenSignature = NO_TOKEN_SIGNATURE;
let pendingUserRequest: Promise<User | null> | null = null;

const getTokenSignature = (token: string | null | undefined): string => {
  if (!token) {
    return NO_TOKEN_SIGNATURE;
  }

  return token.length <= 24 ? token : token.slice(-24);
};

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

  const buildAuthFallbackUser = (authUser: Awaited<ReturnType<typeof authService.getCurrentUser>>): User => ({
    id: authUser.id,
    email: authUser.email,
    name: authUser.name || `${authUser.firstName} ${authUser.lastName || ''}`.trim(),
    role: normalizeRole(
      authUser.roleData || authUser.role,
      authUser.roleName,
      authUser.roleDisplayName || authUser.display_name,
    ),
    roleName: authUser.roleName,
    roleDisplayName: authUser.roleDisplayName || authUser.display_name,
    display_name: authUser.roleDisplayName || authUser.display_name,
    permissions: authUser.permissions || [],
    additionalPermissions: authUser.additionalPermissions || [],
    active: authUser.isActive,
    requiresPasswordChange: authUser.requiresPasswordChange || false,
    organizationId: authUser.organizationId,
    organizationName: authUser.organizationName,
    organization:
      authUser.organization &&
      (authUser.organization.id || authUser.organization._id) &&
      authUser.organization.name
        ? {
            id: authUser.organization.id || authUser.organization._id || '',
            name: authUser.organization.name,
            slug: authUser.organization.slug,
            logo: authUser.organization.logo,
            tier: authUser.organization.tier,
          }
        : undefined,
    createdAt: authUser.createdAt,
    updatedAt: authUser.updatedAt,
  });

  const resolveUser = useCallback(async (): Promise<User | null> => {
    const storedUser = authService.getUser();
    const token = authService.getToken();

    if (!storedUser && !token) {
      return null;
    }

    const authUser = await authService.refreshUserData().catch(() => storedUser);

    if (!authUser) {
      return null;
    }

    let fullUser: User | null = null;

    try {
      fullUser = await userService.getUserById(authUser.id);
    } catch (err) {
      console.warn('Could not fetch full user data, using auth user data', err);
    }

    if (!fullUser) {
      return buildAuthFallbackUser(authUser);
    }

    const resolvedRoleName = userService.getUserRoleName(fullUser);
    const authFallbackUser = buildAuthFallbackUser(authUser);
    const authResolvedRoleName = userService.getUserRoleName(authFallbackUser);
    const fullUserPermissions = Array.isArray(fullUser.allPermissions)
      ? fullUser.allPermissions
      : fullUser.permissions || [];
    const shouldPreferAuthRole =
      (!resolvedRoleName || ['unknown', 'user'].includes(resolvedRoleName)) &&
      authResolvedRoleName &&
      !['unknown', 'user'].includes(authResolvedRoleName);

    if (resolvedRoleName && resolvedRoleName !== 'unknown' && resolvedRoleName !== 'user' && fullUserPermissions.length > 0) {
      return fullUser;
    }

    return {
      ...fullUser,
      ...authFallbackUser,
      id: fullUser.id || authUser.id,
      _id: fullUser._id,
      customId: fullUser.customId,
      name: fullUser.name || authFallbackUser.name,
      email: fullUser.email || authFallbackUser.email,
      organization: fullUser.organization || authFallbackUser.organization,
      organizationId: fullUser.organizationId || authFallbackUser.organizationId,
      organizationName: fullUser.organizationName || authFallbackUser.organizationName,
      active: fullUser.active,
      canViewSummary: fullUser.canViewSummary,
      isFirstLogin: fullUser.isFirstLogin,
      role: shouldPreferAuthRole ? authFallbackUser.role : fullUser.role || authFallbackUser.role,
      roleName: shouldPreferAuthRole
        ? authFallbackUser.roleName
        : userService.getUserRoleName({
            ...fullUser,
            ...authFallbackUser,
          } as User),
      roleDisplayName: shouldPreferAuthRole
        ? authFallbackUser.roleDisplayName
        : userService.getUserRoleDisplayName({
            ...fullUser,
            ...authFallbackUser,
          } as User),
      display_name: shouldPreferAuthRole
        ? authFallbackUser.display_name
        : userService.getUserRoleDisplayName({
            ...fullUser,
            ...authFallbackUser,
          } as User),
      permissions: Array.from(
        new Set([
          ...(Array.isArray(fullUser.permissions) ? fullUser.permissions : []),
          ...(Array.isArray(authFallbackUser.permissions) ? authFallbackUser.permissions : []),
        ])
      ),
      additionalPermissions: Array.from(
        new Set([
          ...(Array.isArray(fullUser.additionalPermissions) ? fullUser.additionalPermissions : []),
          ...(Array.isArray(authFallbackUser.additionalPermissions) ? authFallbackUser.additionalPermissions : []),
        ])
      ),
      allPermissions: Array.from(
        new Set([
          ...(Array.isArray(fullUser.allPermissions) ? fullUser.allPermissions : []),
          ...(Array.isArray(authFallbackUser.allPermissions) ? authFallbackUser.allPermissions : []),
          ...(Array.isArray(fullUser.permissions) ? fullUser.permissions : []),
          ...(Array.isArray(authFallbackUser.permissions) ? authFallbackUser.permissions : []),
        ])
      ),
      createdAt: fullUser.createdAt || authFallbackUser.createdAt,
      updatedAt: fullUser.updatedAt || authFallbackUser.updatedAt,
    };
  }, []);

  const loadUser = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentTokenSignature = getTokenSignature(authService.getToken());
      const cacheIsFresh =
        !forceRefresh &&
        cachedCurrentUser !== undefined &&
        cachedTokenSignature === currentTokenSignature &&
        Date.now() - cachedUserAt < USER_CACHE_TTL_MS;

      if (cacheIsFresh) {
        setUser(cachedCurrentUser);
        return;
      }

      if (!forceRefresh && pendingUserRequest) {
        setUser(await pendingUserRequest);
        return;
      }

      pendingUserRequest = resolveUser()
        .then((resolvedUser) => {
          cachedCurrentUser = resolvedUser;
          cachedUserAt = Date.now();
          cachedTokenSignature = currentTokenSignature;
          return resolvedUser;
        })
        .finally(() => {
          pendingUserRequest = null;
        });

      setUser(await pendingUserRequest);
    } catch (err) {
      console.error('Error loading current user:', err);
      setError(err instanceof Error ? err : new Error('Failed to load user'));

      const fallbackTokenSignature = getTokenSignature(authService.getToken());
      if (cachedCurrentUser !== undefined && cachedTokenSignature === fallbackTokenSignature) {
        setUser(cachedCurrentUser);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [resolveUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const refreshUser = useCallback(async () => {
    await loadUser(true);
  }, [loadUser]);

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
