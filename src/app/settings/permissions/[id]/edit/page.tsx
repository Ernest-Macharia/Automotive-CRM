'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EditPermission from '@/components/settings/permissions/EditPermission';

export default function EditPermissionPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <EditPermission permissionId={params.id as string} />
    </ProtectedRoute>
  );
}