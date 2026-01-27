'use client';

import HrPolicies from '@/components/hr/HrPolicies';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <HrPolicies />
    </ProtectedRoute>
  );
}