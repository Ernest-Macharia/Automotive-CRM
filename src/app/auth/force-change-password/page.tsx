'use client';

import React from 'react';
import { Car } from 'lucide-react';
import ForceChangePasswordForm from '@/components/auth/ForceChangePasswordForm';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ForceChangePasswordPage() {
  return (
    <AuthLayout
      title="Change Your Password"
      subtitle="For security reasons, you must change your password before continuing."
      logo={
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MAG CRM</h1>
            <p className="text-sm text-gray-600">Automotive Excellence</p>
          </div>
        </div>
      }
      featureTitle="Security First"
      featureDescription="We prioritize your account security by requiring periodic password updates."
      backgroundGradient="from-blue-50 via-white to-indigo-50"
      accentColor="blue"
      hideRightColumn={true}
    >
      <ForceChangePasswordForm />
    </AuthLayout>
  );
}