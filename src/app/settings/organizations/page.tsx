// apps/settings/organizations/page.tsx
'use client';

import OrganizationManagementPage from '@/components/settings/organizations/OrganizationManagementPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function OrganizationsRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <OrganizationManagementPage />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}