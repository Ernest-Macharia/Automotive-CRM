// src/app/(dashboard)/layout.tsx
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}