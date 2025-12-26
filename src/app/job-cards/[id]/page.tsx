'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import JobCardDetail from '@/components/job-cards/JobCardDetail';

export default function JobCardDetailPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <JobCardDetail jobCardId={params.id as string} />
    </ProtectedRoute>
  );
}