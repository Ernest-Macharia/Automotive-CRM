'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreatePermission from '@/components/settings/permissions/CreatePermission';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function CreatePermissionPage() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <CreatePermission />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}