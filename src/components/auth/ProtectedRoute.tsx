'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  requiredPermissions?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  requiredPermissions 
}: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = authService.isAuthenticated();
        
        if (!isAuthenticated) {
          router.push('/auth/login');
          return;
        }

        let user = authService.getUser(); // Use let instead of const
        
        if (!user) {
          const refreshedUser = await authService.getCurrentUser(); // Try to refresh user data
          user = refreshedUser;
          
          if (!user) {
            router.push('/auth/login');
            return;
          }
        }

        // Check if user needs to change password
        if (user.requiresPasswordChange) {
          router.push('/auth/force-change-password');
          return;
        }
        
        const userRole =
          user.roleName ||
          (typeof user.role === 'object' && user.role !== null ? user.role.name : user.role) ||
          '';
        const effectivePermissions = Array.from(
          new Set([
            ...(Array.isArray(user.permissions) ? user.permissions : []),
            ...(Array.isArray(user.rolePermissions) ? user.rolePermissions : []),
            ...(Array.isArray(user.additionalPermissions) ? user.additionalPermissions : []),
            ...(Array.isArray(user.directPermissions) ? user.directPermissions : []),
          ]),
        );

        // Check role if required
        if (requiredRole && !requiredRole.includes(userRole)) {
          router.push('/unauthorized');
          return;
        }
        
        // Check permissions if required
        if (requiredPermissions && requiredPermissions.length > 0) {
          const hasPermission = requiredPermissions.some(permission => 
            effectivePermissions.includes(permission)
          );
          
          if (!hasPermission) {
            router.push('/unauthorized');
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole, requiredPermissions]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
