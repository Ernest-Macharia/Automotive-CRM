// components/auth/ProtectedRoute.tsx (updated version)
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
      const isAuthenticated = authService.isAuthenticated();
      
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      try {
        const user = authService.getUser();
        
        if (!user) {
          router.push('/auth/login');
        } else {
          // Check role if required
          if (requiredRole && !requiredRole.includes(user.role)) {
            router.push('/unauthorized');
            return;
          }
          
          // Check permissions if required
          if (requiredPermissions && user.permissions) {
            const hasPermission = requiredPermissions.some(permission => 
              user.permissions?.includes(permission)
            );
            
            if (!hasPermission) {
              router.push('/unauthorized');
              return;
            }
          }
          
          // If both role and permissions are required, check both
          if (requiredRole && requiredPermissions) {
            const hasRole = requiredRole.includes(user.role);
            const hasPermission = requiredPermissions.some(permission => 
              user.permissions?.includes(permission)
            );
            
            if (!hasRole && !hasPermission) {
              router.push('/unauthorized');
              return;
            }
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
          <div className="w-16 h-16 border-4 border-[#E65C00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#CCCCCC]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}