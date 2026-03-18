'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticatedTo?: string;
}

export default function PublicRoute({ 
  children, 
  redirectAuthenticatedTo = '/dashboard'
}: PublicRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getUser();

      // If authenticated and trying to access public pages
      if (isAuthenticated) {
        // Allow access to force-change-password
        if (pathname.includes('/force-change-password')) {
          setIsChecking(false);
          return;
        }
        
        // Check if user needs to change password
        if (user?.requiresPasswordChange) {
          router.push('/auth/force-change-password');
          return;
        }
        
        // Redirect to dashboard
        router.push(redirectAuthenticatedTo);
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router, redirectAuthenticatedTo]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}