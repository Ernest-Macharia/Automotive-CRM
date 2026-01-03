'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileDetailsPage from '@/components/settings/profiles/ProfileDetailsPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function ProfileDetailsRoute() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  
  useEffect(() => {
    if (!profileId) {
      router.push('/settings/profiles');
    }
  }, [profileId, router]);
  
  if (!profileId) {
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
        <ProfileDetailsPage profileId={profileId} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}