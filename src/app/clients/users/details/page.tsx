'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserProfilePage from '@/components/users/UserProfilePage';
import { Loader2 } from 'lucide-react';

function UserDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get('id');
    
    if (!id) {
      console.error('No user ID provided in query parameters');
      router.push('/clients');
      return;
    }
    
    setUserId(id);
    setIsLoading(false);
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <UserProfilePage 
      userId={userId}
      initialEditMode={false}
      onBack={() => router.push('/clients')}
    />
  );
}

export default function UserDetailsRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading page...</p>
          </div>
        </div>
      }>
        <UserDetailsContent />
      </Suspense>
    </ProtectedRoute>
  );
}