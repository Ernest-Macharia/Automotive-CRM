'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PermissionDetail from '@/components/settings/permissions/PermissionDetail';

export default function PermissionDetailPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <PermissionDetail permissionId={params.id as string} />
    </ProtectedRoute>
  );
}