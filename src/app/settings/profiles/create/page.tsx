'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';

export default function CreateProfileRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Employee Profile</h2>
            <p className="text-gray-600 mb-8">
              Profile onboarding is handled from User Management in this environment. Create the user
              first, then continue profile updates from Employee Profiles.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/settings/users/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Create User
              </Link>

              <Link
                href="/settings/profiles"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-4 w-4" />
                Employee Profiles
              </Link>

              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
              </Link>
            </div>
          </div>
        </div>
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}

