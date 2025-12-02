'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const { authService } = await import('@/services/authService');
        
        const publicPaths = [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/unauthorized'
        ];
        
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
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <html lang="en">
        <body className={`${inter.className} min-h-screen flex items-center justify-center bg-[#0B0B0B]`}>
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-[#CCCCCC] text-sm">Loading MAG CRM...</p>
            <p className="text-[#666666] text-xs mt-1">Please wait while we load your dashboard</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#0B0B0B] text-[#CCCCCC] min-h-screen`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}