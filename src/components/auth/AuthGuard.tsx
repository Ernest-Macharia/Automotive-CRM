'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
  publicPaths?: string[];
}

export default function AuthGuard({ 
  children, 
  publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/unauthorized']
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublicPath = publicPaths.includes(pathname);
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated && !isPublicPath) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && pathname === '/auth/login') {
      router.push('/dashboard');
      return;
    }
  }, [pathname, router, publicPaths]);

  return <>{children}</>;
}