'use client';

import { useSearchParams } from 'next/navigation';
import UserDetailsPage from '@/components/settings/users/UserDetailsPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function UserDetailsRoute() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  
  if (!userId) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">No User Selected</h1>
          <p>Please select a user to view details.</p>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <UserDetailsPage userId={userId} />
    </ProtectedRoute>
  );
}