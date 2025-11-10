// src/components/layout/layout-wrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import { DashboardLayout } from './dashboard-layout';

const publicRoutes = ['/login', '/register', '/forgot-password'];

export function LayoutWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname || '');

  console.log('LayoutWrapper - pathname:', pathname, 'isPublicRoute:', isPublicRoute);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}