'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BlueprintDetailsPage from '@/components/settings/blueprints/BlueprintDetailsPage';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import { useParams } from 'next/navigation';

export default function BlueprintDetailsRoute() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <BlueprintDetailsPage blueprintId={params.id as string} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}