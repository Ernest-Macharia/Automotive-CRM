'use client';

import SettingsDashboard from '@/components/settings/SettingsDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <SettingsDashboard />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}