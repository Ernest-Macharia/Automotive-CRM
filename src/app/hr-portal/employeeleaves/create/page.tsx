'use client';

import EmployeeLeaveRequests from '@/components/hr/EmployeeLeaveRequests';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <EmployeeLeaveRequests />
    </ProtectedRoute>
  );
}