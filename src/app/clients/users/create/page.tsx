'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreateUserPage from '@/components/users/CreateUserPage';

export default function CreateUserRoute() {
  return (
    <ProtectedRoute>
      <CreateUserPage />
    </ProtectedRoute>
  );
}
