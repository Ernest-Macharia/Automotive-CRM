'use client';

import CreateUserPage from '@/components/settings/users/CreateUserPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateUserRoute() {
  return (
    <ProtectedRoute>
      <CreateUserPage />
    </ProtectedRoute>
  );
}