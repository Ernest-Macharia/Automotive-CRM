'use client';

import UserManagementPage from '@/components/settings/users/UserManagementPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function UsersRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <UserManagementPage />
      </SettingsLayoutWrapper>
      
    </ProtectedRoute>
  );
}