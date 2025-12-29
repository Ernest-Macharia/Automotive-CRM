'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EditBlueprintPage from '@/components/settings/blueprints/EditBlueprintPage';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import { useParams } from 'next/navigation';

export default function EditBlueprintRoute() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <EditBlueprintPage blueprintId={params.id as string} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}