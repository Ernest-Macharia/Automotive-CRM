'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EditOpportunityPage from '@/components/opportunities/EditOpportunityPage';

export default function EditOpportunityRoute() {
  return (
    <ProtectedRoute>
      <EditOpportunityPage />
    </ProtectedRoute>
  );
}