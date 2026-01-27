'use client';

import HrIncidents from '@/components/hr/HrIncidents';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <HrIncidents />
    </ProtectedRoute>
  );
}