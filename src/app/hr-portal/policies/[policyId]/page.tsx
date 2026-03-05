'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import HrPolicies from '@/components/hr/HrPolicies';

interface PageProps {
  params: {
    policyId: string;
  };
}

export default function HrPolicyDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <HrPolicies policyId={params.policyId} />
    </ProtectedRoute>
  );
}
