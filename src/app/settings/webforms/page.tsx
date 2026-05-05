'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import WebFormsDashboard from '@/components/settings/webforms/WebFormsDashboard';

export default function WebFormsRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <WebFormsDashboard />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}
