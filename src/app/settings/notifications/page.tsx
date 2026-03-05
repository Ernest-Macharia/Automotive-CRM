'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NotificationsPage from '@/components/settings/notifications/NotificationsPage';

export default function SettingsNotificationsRoute() {
  return (
    <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>
  );
}
