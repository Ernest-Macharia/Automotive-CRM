'use client';

import BlueprintsManagementPage from '@/components/settings/blueprints/BlueprintsManagementPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function BlueprintsRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <BlueprintsManagementPage />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}