'use client';

import HRDashboardPage from '@/components/hr/HrPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <HRDashboardPage />
    </ProtectedRoute>
  );
}