// apps/settings/organizations/create/page.tsx
'use client';

import CreateOrganizationPage from '@/components/settings/organizations/CreateOrganizationPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function CreateOrganizationRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <CreateOrganizationPage />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}