'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PermissionsList from '@/components/settings/permissions/PermissionsList';

export default function PermissionsPage() {
  return (
    <ProtectedRoute>
      <PermissionsList />
    </ProtectedRoute>
  );
}