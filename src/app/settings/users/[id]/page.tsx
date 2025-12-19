'use client';

import { useParams, useRouter } from 'next/navigation';
import UserDetailsPage from '@/components/settings/users/UserDetailsPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function UserDetailsRoute() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  if (!userId) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">No User Selected</h1>
          <p>Please select a user to view details.</p>
          <button
            onClick={() => router.push('/settings/users')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Users List
          </button>
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