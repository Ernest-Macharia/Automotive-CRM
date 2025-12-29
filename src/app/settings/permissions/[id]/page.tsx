'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PermissionDetail from '@/components/settings/permissions/PermissionDetail';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function PermissionDetailPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <PermissionDetail permissionId={params.id as string} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}