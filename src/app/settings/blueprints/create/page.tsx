'use client';

import CreateBlueprintPage from '@/components/settings/blueprints/CreateBlueprintPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateBlueprintRoute() {
  return (
    <ProtectedRoute>
      <CreateBlueprintPage />
    </ProtectedRoute>
  );
}