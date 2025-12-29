'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EditPermission from '@/components/settings/permissions/EditPermission';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function EditPermissionPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <EditPermission permissionId={params.id as string} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}