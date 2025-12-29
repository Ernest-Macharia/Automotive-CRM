'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PermissionsList from '@/components/settings/permissions/PermissionsList';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function PermissionsPage() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <PermissionsList />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}