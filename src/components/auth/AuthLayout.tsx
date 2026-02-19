'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface FeatureItem {
  icon: ReactNode;
  color: string;
  title: string;
  description: string;
}

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: ReactNode;
  logo: ReactNode;
  features?: FeatureItem[]; // Changed from ReactNode to FeatureItem[]
  featureTitle?: string;
  featureDescription?: string;
  backgroundGradient?: string;
  accentColor?: 'blue' | 'orange' | 'green' | 'purple';
  showBackButton?: boolean;
  backButtonHref?: string;
  backButtonText?: string;
  hideRightColumn?: boolean;
  stats?: Array<{ value: string; label: string }>;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  logo,
  features,
  featureTitle,
  featureDescription,
  backgroundGradient = 'from-blue-50 via-white to-purple-50',
  accentColor = 'blue',
  showBackButton = false,
  backButtonHref = '/auth/login',
  backButtonText = 'Back to login',
  hideRightColumn = false,
  stats,
}: AuthLayoutProps) {
  const accentColorClasses = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  }[accentColor];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundGradient}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 -left-20 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className={`w-full max-w-7xl grid ${hideRightColumn ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-8 lg:gap-12`}>
          
          {/* Left Column - Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                {showBackButton && (
                  <Link href={backButtonHref} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {backButtonText}
                  </Link>
                )}
                
                {logo}
                
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  {title}
                </h2>
                <div className="text-gray-600">
                  {subtitle}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-xl">
                {children}
              </div>
            </div>
          </div>

          {/* Right Column - Features & Benefits */}
          {!hideRightColumn && features && (
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full max-w-lg">
                <div className="relative">
                  {/* Decorative background */}
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 blur-xl"></div>
                  <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-gradient-to-tr from-pink-400 to-orange-500 rounded-full opacity-10 blur-xl"></div>

                  <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-xl">
                    {featureTitle && featureDescription && (
                      <div className="text-center mb-8">
                        <div className={`inline-flex p-4 bg-gradient-to-br ${accentColorClasses} rounded-2xl shadow-lg mb-6`}>
                          <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {featureTitle}
                        </h3>
                        <p className="text-gray-600">
                          {featureDescription}
                        </p>
                      </div>
                    )}

                    {features && (
                      <div className="space-y-6">
                        {features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                            <div className={`flex-shrink-0 p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-sm group-hover:shadow transition-shadow`}>
                              <div className="text-white">
                                {feature.icon}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {feature.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {stats && stats.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-6">
                          {stats.map((stat, index) => (
                            <React.Fragment key={index}>
                              <div className="text-center">
                                <div className={`text-2xl font-bold bg-gradient-to-r ${accentColorClasses} bg-clip-text text-transparent`}>
                                  {stat.value}
                                </div>
                                <div className="text-xs text-gray-500">{stat.label}</div>
                              </div>
                              {index < stats.length - 1 && (
                                <div className="h-8 w-px bg-gray-200"></div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile features section */}
      {!hideRightColumn && features && (
        <div className="lg:hidden mt-8 px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {featureTitle || 'Why Choose VIN17x CRM?'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`p-1.5 bg-gradient-to-br ${feature.color} rounded-lg shadow-sm`}>
                    <div className="text-white h-4 w-4">
                      {feature.icon}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for animated blobs */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}