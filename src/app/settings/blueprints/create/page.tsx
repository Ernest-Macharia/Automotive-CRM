'use client';

import CreateBlueprintPage from '@/components/settings/blueprints/CreateBlueprintPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function CreateBlueprintRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <CreateBlueprintPage />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}