'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import WebFormBuilderPage from '@/components/settings/webforms/WebFormBuilderPage';

export default function WebFormBuilderRoute() {
  const params = useParams();

  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <WebFormBuilderPage id={params.id as string} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}
