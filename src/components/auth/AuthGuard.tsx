'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
  publicPaths?: string[];
}

export default function AuthGuard({ 
  children, 
  publicPaths = [
    '/auth/login', 
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/unauthorized'
  ]
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  const normalizePath = (value?: string | null) => {
    if (!value) return '/';
    const normalized = value.trim();
    if (normalized === '/') return normalized;
    return normalized.replace(/\/+$/, '') || '/';
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      const normalizedPathname = normalizePath(pathname);
      
      const isPublicPath = publicPaths.some(path => 
        normalizedPathname === path || normalizedPathname.startsWith(`${path}/`)
      );
      
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getUser();

      // If not authenticated and trying to access protected route
      if (!isAuthenticated && !isPublicPath) {
        router.push('/auth/login');
        return;
      }

      // If authenticated and trying to access auth pages (except force-change-password)
      if (isAuthenticated && normalizedPathname.startsWith('/auth/')) {
        // Allow access to force-change-password
        if (normalizedPathname.includes('/force-change-password')) {
          setIsChecking(false);
          return;
        }
        
        // Check if user needs to change password
        if (user?.requiresPasswordChange) {
          router.push('/auth/force-change-password');
          return;
        }
        
        // Redirect authenticated users away from other auth pages
        router.push('/dashboard');
        return;
      }

      // If user needs password change but not on force-change-password page
      if (
        isAuthenticated &&
        user?.requiresPasswordChange &&
        !normalizedPathname.includes('/force-change-password')
      ) {
        router.push('/auth/force-change-password');
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router, publicPaths]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
