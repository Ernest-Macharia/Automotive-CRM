// src/components/layout/layout-wrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import { DashboardLayout } from './dashboard-layout';

const publicRoutes = ['/login', '/register', '/forgot-password'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Remove trailing slash and normalize
  const cleanPath = pathname?.replace(/\/$/, '') || '';
  const isPublicRoute = publicRoutes.includes(cleanPath);

  console.log('LayoutWrapper - pathname:', pathname, 'cleanPath:', cleanPath, 'isPublicRoute:', isPublicRoute);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}