'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import OpportunitiesContent from '@/components/opportunities/OpportunitiesPage';

export default function OpportunitiesRoute() {
  return (
    <ProtectedRoute>
      <OpportunitiesContent />
    </ProtectedRoute>
  );
}