'use client';

import HRPerformancePlans from '@/components/hr/HrPerformancePlans';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <HRPerformancePlans />
    </ProtectedRoute>
  );
}