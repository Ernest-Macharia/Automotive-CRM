'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, Lock, Eye, EyeOff, Car, Shield, 
  Sparkles, Zap, CheckCircle, ArrowRight,
  TrendingUp, Users, Target, Globe
} from 'lucide-react';
import Link from 'next/link';
import {
  authService,
  AuthenticationError,
  NetworkError,
} from '@/services/authService';

import type { LoginData } from '@/services/types/auth';

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);
      window.location.href = '/dashboard';
      
    } catch (err: unknown) {
      console.error('Login failed:', err);
      
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error name:', err.name);
      }
      
      if (err instanceof AuthenticationError) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err instanceof NetworkError) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError('Network error. Please check if the server is running.');
        } else if (errorMessage.includes('404')) {
          setError('API endpoint not found. Please check server configuration.');
        } else {
          setError(err.message || 'Login failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      let response;
      if (typeof authService.demoLogin === 'function') {
        response = await authService.demoLogin();
      } else {
        response = await authService.login({
          email: 'superadmin@crm.local',
          password: 'ChangeMe123!',
        });
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Demo login failed:', err);
      setError('Demo login failed. Please try manual login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 -left-20 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column - Login Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <Car className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      MAG CRM
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">Automotive Excellence Platform</p>
                  </div>
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  Welcome back
                </h2>
                <p className="text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link 
                    href="/auth/register" 
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center gap-1"
                  >
                    Start your free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-1.5 bg-red-100 rounded-lg">
                      <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.342 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 lg:p-8 shadow-xl">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-white/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Link 
                        href="/auth/forgot-password" 
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="block w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-white/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(s => !s)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign in to your account</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white/80 backdrop-blur-sm text-gray-500">Or try a demo</span>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Try Demo Account</span>
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Use: superadmin@crm.local / Testme123!
                    </p>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Your data is securely encrypted and protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Features & Benefits */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="relative">
                {/* Decorative background */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 blur-xl"></div>
                <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-gradient-to-tr from-pink-400 to-orange-500 rounded-full opacity-10 blur-xl"></div>

                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-8 shadow-xl">
                  <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-6">
                      <Zap className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Drive Your Business Forward
                    </h3>
                    <p className="text-gray-600">
                      Join automotive professionals using MAG CRM to streamline operations and boost sales
                    </p>
                  </div>

                  <div className="space-y-6">
                    {[
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
                    ].map((feature, index) => (
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

                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          95%
                        </div>
                        <div className="text-xs text-gray-500">Customer Satisfaction</div>
                      </div>
                      <div className="h-8 w-px bg-gray-200"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          40%
                        </div>
                        <div className="text-xs text-gray-500">Faster Conversions</div>
                      </div>
                      <div className="h-8 w-px bg-gray-200"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          24/7
                        </div>
                        <div className="text-xs text-gray-500">Support Available</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile features section (hidden on desktop) */}
      <div className="lg:hidden mt-8 px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
            Why Choose MAG CRM?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'AI-powered lead scoring',
              'Centralized customer data',
              'Real-time analytics',
              'Mobile optimized'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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