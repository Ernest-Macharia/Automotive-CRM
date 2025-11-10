// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Car, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { authService, LoginData, AuthenticationError, NetworkError } from '@/services/authService';

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authService.login(formData);
      router.push('/');
    } catch (error: any) {
      // Only log actual errors to console, not expected states like invalid credentials
      if (!(error instanceof AuthenticationError)) {
        console.error('Login error:', error);
      }
      
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await authService.login({
        email: "superadmin@crm.local",
        password: "ChangeMe123!"
      });
      router.push('/');
    } catch (error: any) {
      if (!(error instanceof AuthenticationError)) {
        console.error('Demo login error:', error);
      }
      setError(error.message);
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
              
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                  Start your free trial
                </Link>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`mt-4 p-4 border rounded-xl flex items-start space-x-3 ${
                error.includes('Invalid credentials') 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  error.includes('Invalid credentials') ? 'text-yellow-600' : 'text-red-500'
                }`} />
                <div>
                  <span className={`text-sm block ${
                    error.includes('Invalid credentials') ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {error}
                  </span>
                  {error.includes('Invalid credentials') && (
                    <p className="text-yellow-600 text-xs mt-1">
                      Try the demo account or check your credentials
                    </p>
                  )}
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/50"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>
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
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Use: superadmin@crm.local / ChangeMe123!
                    </p>
                  </div>
                </form>
              </div>

              {/* Security Notice */}
              <div className="mt-6 flex items-center justify-center text-center">
                <Shield className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-xs text-gray-500">
                  Your data is securely encrypted and protected
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Hero Section */}
        <div className="hidden lg:block relative flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10"></div>
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="max-w-lg text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8">
                <Car className="h-12 w-12 text-white" />
              </div>
              
              <h3 className="text-4xl font-bold text-gray-900 mb-4">
                Drive Your Business Forward
              </h3>
              
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
                  'Boost customer satisfaction & retention'
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