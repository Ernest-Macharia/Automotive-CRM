'use client';

import CreateOpportunityPage from '@/components/opportunities/CreateOpportunityPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateOpportunityRoute() {
  return (
    <ProtectedRoute>
      <CreateOpportunityPage />
    </ProtectedRoute>
  );
}