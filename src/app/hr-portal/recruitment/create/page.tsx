'use client';

import HrRecruitment from '@/components/hr/HrRecruitment';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function KPIReportsPage() {
  return (
    <ProtectedRoute>
      <HrRecruitment />
    </ProtectedRoute>
  );
}