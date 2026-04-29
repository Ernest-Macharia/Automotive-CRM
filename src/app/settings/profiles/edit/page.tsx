'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LegacyProfileEditRedirectRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get('id');
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (!profileId) {
      router.replace('/settings/profiles');
      return;
    }

    const tabQuery = tab ? `?tab=${encodeURIComponent(tab)}` : '';
    router.replace(`/settings/profiles/${encodeURIComponent(profileId)}/edit${tabQuery}`);
  }, [profileId, router, tab]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Opening profile editor...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

