'use client';

import HREmployeeLeaves from '@/components/hr/HrEmployeeLeaves';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <HREmployeeLeaves />
    </ProtectedRoute>
  );
}