'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import HRPerformancePlans from '@/components/hr/HrPerformancePlans';

interface PageProps {
  params: {
    planId: string;
  };
}

export default function HrPerformanceDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <HRPerformancePlans planId={params.planId} />
    </ProtectedRoute>
  );
}
