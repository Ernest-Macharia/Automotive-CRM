// apps/settings/organizations/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import OrganizationDetailsPage from '@/components/settings/organizations/OrganizationDetailsPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function OrganizationDetailsRoute() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  
  useEffect(() => {
    if (!organizationId) {
      router.push('/settings/organizations');
    }
  }, [organizationId, router]);
  
  if (!organizationId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <OrganizationDetailsPage organizationId={organizationId} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}