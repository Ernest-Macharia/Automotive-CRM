'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { profileService } from '@/services/settings/profileService';
import { Loader2 } from 'lucide-react';

export default function MyProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        // Try to get the user's profile
        const profile = await profileService.getMyProfile();
        
        // Profile exists - view it
        router.push(`/my-profile/${profile.id}`);
        
      } catch {
        // No profile exists - create one
        router.push('/my-profile/create');
      }
    };

    checkUserProfile();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading your profile...</p>
      </div>
    </div>
  );
}
