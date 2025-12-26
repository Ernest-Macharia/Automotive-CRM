'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import JobCardEdit from '@/components/job-cards/JobCardEdit';

export default function EditJobCardPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <JobCardEdit jobCardId={params.id as string} />
    </ProtectedRoute>
  );
}