'use client';

import CreateLeadPage from '@/components/opportunities/CreateLeadPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateLeadRoute() {
  return (
    <ProtectedRoute>
      <CreateLeadPage />
    </ProtectedRoute>
  );
}