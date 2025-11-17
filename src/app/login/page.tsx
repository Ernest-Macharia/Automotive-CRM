// src/app/auth/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Car, Shield } from 'lucide-react';
import Link from 'next/link';
import {
  authService,
  LoginData,
  AuthenticationError,
  NetworkError,
} from '@/services/authService';

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
      // ✅ SECURE: Use sessionStorage instead of localStorage
      const response = await authService.login(formData);
      
      // Save to sessionStorage (cleared when browser closes)
      sessionStorage.setItem('accessToken', response.accessToken);
      sessionStorage.setItem('refreshToken', response.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('🔐 Login successful - sessionStorage used:', response.user);
      
      // Navigate to dashboard
      router.push('/');
    } catch (err: unknown) {
      console.error('Login failed:', err);
      // Clear sessionStorage on error
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');

      if (err instanceof AuthenticationError) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err instanceof NetworkError) {
        setError('Network connection error. Please check your internet connection.');
      } else if (err instanceof Error && (err as Error).message.includes('Internal server error')) {
        setError('Server temporarily unavailable. Please try again in a few moments.');
      } else if (err instanceof Error) {
        setError((err as Error).message || 'Login failed. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
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
      
      // ✅ SECURE: Use sessionStorage
      sessionStorage.setItem('accessToken', response.accessToken);
      sessionStorage.setItem('refreshToken', response.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('🔐 Demo login successful - sessionStorage used:', response.user);
      router.push('/');
    } catch (err: unknown) {
      console.error('Demo login failed:', err);
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
      setError('Demo login failed. Please try manual login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="flex min-h-screen">
        {/* Left side - Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo and Header */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">MAG CRM</h1>
                  <p className="text-sm text-gray-500">Automotive Excellence</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                  Start your free trial
                </Link>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                </div>
                <div>
                  <span className="text-red-700 text-sm block">{error}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <div className="mt-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Email Field */}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/50"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Link href="/forgot-password" className="text-sm text-orange-600 hover:text-orange-500 font-medium transition-colors">
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/50"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me for 30 days
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Signing in...
                        </>
                      ) : (
                        'Sign in to your account'
                      )}
                    </button>
                  </div>

                  {/* Demo Login Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      disabled={isLoading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Try Demo Account
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">Use: superadmin@crm.local / ChangeMe123!</p>
                  </div>
                </form>
              </div>

              {/* Security Notice */}
              <div className="mt-6 flex items-center justify-center text-center">
                <Shield className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-xs text-gray-500">Your data is securely encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Hero Section */}
        <div className="hidden lg:block relative flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10" />
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="max-w-lg text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8">
                <Car className="h-12 w-12 text-white" />
              </div>

              <h3 className="text-4xl font-bold text-gray-900 mb-4">Drive Your Business Forward</h3>

              <p className="text-lg text-gray-600 mb-8">
                Join thousands of automotive professionals using MAG CRM to streamline their operations, boost sales, and deliver exceptional customer experiences.
              </p>

              {/* Features List */}
              <div className="space-y-4 text-left bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-3 text-center">Why Choose MAG CRM?</h4>
                {[
                  'Manage customers & vehicles effortlessly',
                  'Track service history & appointments',
                  'Generate estimates & invoices quickly',
                  'Boost customer satisfaction & retention',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}