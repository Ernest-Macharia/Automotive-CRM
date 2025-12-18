'use client';

import UserManagementPage from '@/components/settings/users/UserManagementPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function UsersRoute() {
  return (
    <ProtectedRoute>
      <UserManagementPage />
    </ProtectedRoute>
  );
}