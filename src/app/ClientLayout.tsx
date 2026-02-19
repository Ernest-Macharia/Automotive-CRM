'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  /* ---------------------------
     AUTH GUARD
  ----------------------------*/
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { authService } = await import('@/services/authService');

        const publicPaths = [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/unauthorized',
        ];

        const isPublicPath = publicPaths.includes(pathname);
        const isAuthenticated = authService.isAuthenticated();

        if (!isAuthenticated && !isPublicPath) {
          router.replace('/auth/login');
          return;
        }

        if (isAuthenticated && pathname === '/auth/login') {
          router.replace('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  /* ---------------------------
     RESPONSIVE SIDEBAR
  ----------------------------*/
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // open on desktop, closed on mobile
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const isAuthPage = pathname?.startsWith('/auth');

  /* ---------------------------
     LOADING STATE (AUTH)
  ----------------------------*/
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/30">
        <div className="text-center">
          <LoadingSpinner />
          {/* <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading VIN17x CRM...</p>
          <p className="text-gray-500 text-xs mt-1">
            Please wait while we load your dashboard
          </p> */}
        </div>
      </div>
    );
  }

  /* ---------------------------
     AUTH PAGES (NO SIDEBAR)
  ----------------------------*/
  if (isAuthPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  /* ---------------------------
     MAIN APP LAYOUT
  ----------------------------*/
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/30">
      {/* Overlay for mobile */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:z-auto
          transition-transform duration-300 ease-in-out
          lg:flex-shrink-0
          ${isMobile ? 'shadow-2xl' : ''}
        `}
      >
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Main Content */}
      <main
        className="
          flex-1 h-full min-w-0
          transition-all duration-300
          w-full overflow-hidden
          flex flex-col
        "
      >
        {/* Mobile menu button */}
        {isMobile && !sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="lg:hidden fixed top-4 left-4 z-20 w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto pt-4 lg:pt-0 pb-4">
          {children}
        </div>
      </main>
    </div>
  );
}
