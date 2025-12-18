'use client';

import BlueprintsManagementPage from '@/components/settings/blueprints/BlueprintsManagementPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function BlueprintsRoute() {
  return (
    <ProtectedRoute>
      <BlueprintsManagementPage />
    </ProtectedRoute>
  );
}