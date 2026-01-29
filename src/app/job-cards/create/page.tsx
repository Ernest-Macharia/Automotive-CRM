'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DiamondRimsJobCardCreate from '@/components/job-cards/DiamondRimsJobCardCreate';

export default function CreateJobCardPage() {
  return (
    <ProtectedRoute>
      <DiamondRimsJobCardCreate />
    </ProtectedRoute>
  );
}