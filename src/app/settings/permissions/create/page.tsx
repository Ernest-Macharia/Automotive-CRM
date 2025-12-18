'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreatePermission from '@/components/settings/permissions/CreatePermission';

export default function CreatePermissionPage() {
  return (
    <ProtectedRoute>
      <CreatePermission />
    </ProtectedRoute>
  );
}