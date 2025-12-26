'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import JobCardCreate from '@/components/job-cards/JobCardCreate';

export default function CreateJobCardPage() {
  return (
    <ProtectedRoute>
      <JobCardCreate />
    </ProtectedRoute>
  );
}