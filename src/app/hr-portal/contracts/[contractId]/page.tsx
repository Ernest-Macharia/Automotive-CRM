'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import HREmployeeContracts from '@/components/hr/HrEmployeeContracts';

interface PageProps {
  params: {
    contractId: string;
  };
}

export default function HrContractDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <HREmployeeContracts contractId={params.contractId} />
    </ProtectedRoute>
  );
}
