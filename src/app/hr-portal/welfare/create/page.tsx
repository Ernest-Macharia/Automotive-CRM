'use client';

import HrWelfarePrograms from '@/components/hr/HrWelfarePrograms';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <HrWelfarePrograms />
    </ProtectedRoute>
  );
}