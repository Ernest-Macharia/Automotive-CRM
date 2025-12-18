'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EditBlueprintPage from '@/components/settings/blueprints/EditBlueprintPage';

export default function EditBlueprintRoute() {
  return (
    <ProtectedRoute>
      <EditBlueprintPage />
    </ProtectedRoute>
  );
}