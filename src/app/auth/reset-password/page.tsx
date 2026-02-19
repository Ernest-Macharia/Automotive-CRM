'use client';

import React from 'react';
import Link from 'next/link';
import { Car } from 'lucide-react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ResetPasswordPage() {
  return (
    
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password below."
      logo={
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VIN17x CRM</h1>
            <p className="text-sm text-gray-600">Automotive Excellence</p>
          </div>
        </div>
      }
      featureTitle="Secure Password Reset"
      featureDescription="Create a strong new password to secure your account."
      backgroundGradient="from-blue-50 via-white to-indigo-50"
      accentColor="blue"
      showBackButton={true}
      backButtonHref="/auth/login"
      backButtonText="Back to login"
      hideRightColumn={true}
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}