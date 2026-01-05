'use client';

import React from 'react';
import Link from 'next/link';
import { Car, Calendar, Users, Headphones, Zap } from 'lucide-react';
import RegisterForm from '@/components/auth/RegisterForm';
import AuthLayout from '@/components/auth/AuthLayout';
import PublicRoute from '@/components/auth/PublicRoute';

export default function RegisterPage() {
  const features = [
    {
      title: 'Free 14-Day Trial',
      description: 'Full access to all features. No credit card required.',
      icon: 'calendar'
    },
    {
      title: 'Unlimited Users',
      description: 'Add your entire team at no extra cost during trial.',
      icon: 'users'
    },
    {
      title: '24/7 Support',
      description: 'Get help whenever you need it from our expert team.',
      icon: 'headphones'
    },
    {
      title: 'No Setup Fees',
      description: 'Start immediately with our easy onboarding process.',
      icon: 'zap'
    }
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'calendar':
        return <Calendar className="h-5 w-5 text-orange-500" />;
      case 'users':
        return <Users className="h-5 w-5 text-orange-500" />;
      case 'headphones':
        return <Headphones className="h-5 w-5 text-orange-500" />;
      case 'zap':
        return <Zap className="h-5 w-5 text-orange-500" />;
      default:
        return <Car className="h-5 w-5 text-orange-500" />;
    }
  };

  const featureItems = features.map((feature, index) => (
    <div key={index} className="flex items-start">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mr-4 bg-orange-50">
        {getIcon(feature.icon)}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{feature.title}</h4>
        <p className="text-sm text-gray-600">{feature.description}</p>
      </div>
    </div>
  ));

  return (
    <PublicRoute>
      <AuthLayout
      title="Start your free trial"
      subtitle={
        <>
          Already have an account?{' '}
          <Link 
            href="/auth/login" 
            className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
          >
            Sign in here
          </Link>
        </>
      }
      logo={
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MAG CRM</h1>
            <p className="text-sm text-gray-600">Automotive Excellence</p>
          </div>
        </div>
      }
      features={featureItems}
      featureTitle="Transform Your Automotive Business"
      featureDescription="Join thousands of dealerships and service centers using MAG CRM to increase efficiency, boost sales, and deliver outstanding customer experiences."
      backgroundGradient="from-orange-50 via-white to-amber-50"
      accentColor="orange"
    >
      <RegisterForm />
    </AuthLayout>
    </PublicRoute>
    
  );
}