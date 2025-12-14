'use client';

import KPIDashboard from '@/components/kpi/KPIDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <KPIDashboard />
    </ProtectedRoute>
  );
}