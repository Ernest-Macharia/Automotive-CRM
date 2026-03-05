'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import HrWelfarePrograms from '@/components/hr/HrWelfarePrograms';

interface PageProps {
  params: {
    programId: string;
  };
}

export default function HrWelfareDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <HrWelfarePrograms programId={params.programId} />
    </ProtectedRoute>
  );
}
