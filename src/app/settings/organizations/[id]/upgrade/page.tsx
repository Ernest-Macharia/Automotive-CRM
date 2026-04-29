'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OrganizationUpgradeRedirectRoute() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string | undefined;

  useEffect(() => {
    if (!organizationId) {
      router.replace('/settings/organizations');
      return;
    }

    router.replace(`/settings/organizations/${encodeURIComponent(organizationId)}/edit?tab=subscription`);
  }, [organizationId, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Opening plan and subscription settings...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

