'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LegacyUserEditRedirectRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (!userId) {
      router.replace('/settings/users');
      return;
    }

    const tabQuery = tab ? `?tab=${encodeURIComponent(tab)}` : '';
    router.replace(`/settings/users/${encodeURIComponent(userId)}/edit${tabQuery}`);
  }, [router, tab, userId]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Opening user editor...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

