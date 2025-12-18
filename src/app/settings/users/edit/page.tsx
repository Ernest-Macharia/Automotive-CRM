'use client';

import { useSearchParams } from 'next/navigation';
import EditUserPage from '@/components/settings/users/EditUserPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function EditUserRoute() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  
  if (!userId) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">No User Selected</h1>
          <p>Please select a user to edit.</p>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <EditUserPage userId={userId} />
    </ProtectedRoute>
  );
}