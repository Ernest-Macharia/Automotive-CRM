'use client';

import React from 'react';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';
import PublicRoute from '@/components/auth/PublicRoute';

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 mt-1">
        
        <div className="flex items-center mb-4 w-full max-w-md px-6">
          {/* <div className="p-4 bg-transparent rounded-2xl flex items-center justify-center mr-3">
            <Image
              src="/maglogo.png"
              alt="VIN17x CRM Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div> */}

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-6">
              VIN17x CRM
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Automotive Excellence Platform
            </p>
          </div>
        </div>

        <div className="w-full max-w-md px-6 py-8 bg-white rounded-2xl shadow-lg mt-2">
          <LoginForm showDemoButton={true} />
        </div>
      </div>
    </PublicRoute>
  );
}
