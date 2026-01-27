'use client';

import HRAlertsPanel from '@/components/hr/HrPerformancePlans';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <HRAlertsPanel />
    </ProtectedRoute>
  );
}