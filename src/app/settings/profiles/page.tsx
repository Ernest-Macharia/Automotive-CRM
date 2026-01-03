'use client';

import ProfileManagementPage from '@/components/settings/profiles/ProfileManagementPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function ProfilesRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <ProfileManagementPage />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}