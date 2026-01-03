'use client';

import CreateProfilePage from '@/components/settings/profiles/CreateProfilePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function CreateProfileRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <CreateProfilePage />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}