'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import HREmployeeLeaves from '@/components/hr/HrEmployeeLeaves';

interface PageProps {
  params: {
    profileId: string;
  };
}

export default function HrLeaveDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <HREmployeeLeaves profileId={params.profileId} />
    </ProtectedRoute>
  );
}
