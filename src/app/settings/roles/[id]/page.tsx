'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function RoleDetailsRedirectRoute() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string | undefined;

  useEffect(() => {
    if (!roleId) {
      router.replace('/settings/permissions');
      return;
    }

    router.replace(`/settings/permissions?roleId=${encodeURIComponent(roleId)}`);
  }, [roleId, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Opening role permissions...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

