'use client';

import React from 'react';
import Link from 'next/link';
import { Car, Shield, Zap, Target, Users, TrendingUp, Globe } from 'lucide-react';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';
import AuthLayout from '@/components/auth/AuthLayout';
import PublicRoute from '@/components/auth/PublicRoute';

export default function LoginPage() {
  const features = [
    {
      icon: <Target className="h-5 w-5" />,
      color: 'from-blue-500 to-blue-600',
      title: 'Smart Lead Management',
      description: 'Track and convert leads with AI-powered scoring'
    },
    {
      icon: <Users className="h-5 w-5" />,
      color: 'from-purple-500 to-purple-600',
      title: 'Customer Experience',
      description: 'Deliver exceptional service with centralized customer data'
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'from-green-500 to-green-600',
      title: 'Growth Analytics',
      description: 'Make data-driven decisions with real-time insights'
    },
    {
      icon: <Globe className="h-5 w-5" />,
      color: 'from-amber-500 to-amber-600',
      title: 'Unified Platform',
      description: 'Manage everything from sales to service in one place'
    }
  ];

  return (
    <PublicRoute>
    <AuthLayout
      title="Welcome back"
      subtitle={
        <>
          Don&apos;t have an account?{' '}
          <Link 
            href="/auth/register" 
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center gap-1"
          >
            Start your free trial
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </>
      }
     logo={
  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
    <div className="p-4 bg-transparent rounded-2xl flex items-center justify-center">
      <Image
        src="/maglogo.png"
        alt="MAG CRM Logo"
        width={48}
        height={48}
        className="object-contain"
        priority
      />
    </div>
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        MAG CRM
      </h1>
      <p className="text-gray-600 text-sm mt-1">
        Automotive Excellence Platform
      </p>
    </div>
  </div>
}

      features={features}
      stats={[
        { value: '95%', label: 'Customer Satisfaction' },
        { value: '40%', label: 'Faster Conversions' },
        { value: '24/7', label: 'Support Available' }
      ]}
      featureTitle="Drive Your Business Forward"
      featureDescription="Join automotive professionals using MAG CRM to streamline operations and boost sales"
    >
      <LoginForm showDemoButton={true} />
    </AuthLayout>
    </PublicRoute>
  );
}