'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import HrRecruitment from '@/components/hr/HrRecruitment';

interface PageProps {
  params: {
    candidateId: string;
  };
}

export default function HrRecruitmentDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <HrRecruitment candidateId={params.candidateId} />
    </ProtectedRoute>
  );
}
