'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import JobCardsList from '@/components/job-cards/JobCardsList';

export default function JobCardsPage() {
  return (
    <ProtectedRoute>
      <JobCardsList />
    </ProtectedRoute>
  );
}