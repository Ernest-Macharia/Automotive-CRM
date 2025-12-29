'use client';

import CreateUserPage from '@/components/settings/users/CreateUserPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function CreateUserRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <CreateUserPage />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}