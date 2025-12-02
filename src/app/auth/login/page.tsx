'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Car, Shield } from 'lucide-react';
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
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #fef6f2 0%, #ffffff 50%, #fff7ed 100%)'
    }}>
      <div className="flex min-h-screen">
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-8">
                <div className="w-12 h-12" style={{
                  background: 'linear-gradient(to right, #E65C00, #C44A00)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px -5px rgba(230, 92, 0, 0.3)'
                }}>
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>MAG CRM</h1>
                  <p className="text-sm" style={{ color: '#666666' }}>Automotive Excellence</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>Welcome back</h2>
              <p className="mt-2 text-sm" style={{ color: '#666666' }}>
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" style={{
                  color: '#E65C00',
                  fontWeight: '600'
                }} className="hover:opacity-80 transition-opacity">
                  Start your free trial
                </Link>
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4" style={{
                backgroundColor: '#FF3300',
                color: 'white',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 51, 0, 0.2)'
              }}>
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm block">{error}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1rem',
                border: '1px solid rgba(230, 92, 0, 0.1)',
                padding: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5" style={{ color: '#666666' }} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid #CCCCCC',
                          borderRadius: '0.75rem',
                          color: '#1A1A1A'
                        }}
                        className="block w-full pl-10 pr-3 py-3 placeholder-gray-400 focus:outline-none transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#1A1A1A' }}>
                        Password
                      </label>
                      <Link href="/auth/forgot-password" style={{
                        color: '#E65C00',
                        fontWeight: '500'
                      }} className="hover:opacity-80 transition-opacity">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5" style={{ color: '#666666' }} />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, password: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid #CCCCCC',
                          borderRadius: '0.75rem',
                          color: '#1A1A1A'
                        }}
                        className="block w-full pl-10 pr-12 py-3 placeholder-gray-400 focus:outline-none transition-all"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" style={{ color: '#666666' }} />
                        ) : (
                          <Eye className="h-5 w-5" style={{ color: '#666666' }} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      style={{
                        color: '#E65C00'
                      }}
                      className="h-4 w-4 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: '#1A1A1A' }}>
                      Remember me
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{
                        background: 'linear-gradient(to right, #E65C00, #C44A00)',
                        color: 'white',
                        borderRadius: '0.75rem',
                        border: 'none',
                        padding: '0.75rem 1rem'
                      }}
                      className="w-full flex justify-center items-center py-3 px-4 shadow-sm text-sm font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
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

                  <div>
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      disabled={isLoading}
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #CCCCCC',
                        color: '#1A1A1A',
                        borderRadius: '0.75rem'
                      }}
                      className="w-full flex justify-center items-center py-3 px-4 shadow-sm text-sm font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gray-50"
                    >
                      Try Demo Account
                    </button>
                    <p className="text-xs text-center mt-2" style={{ color: '#666666' }}>Use: superadmin@crm.local / Testme123!</p>
                  </div>
                </form>
              </div>

              <div className="mt-6 flex items-center justify-center text-center">
                <Shield className="h-4 w-4 mr-2" style={{ color: '#10B981' }} />
                <p className="text-xs" style={{ color: '#666666' }}>Your data is securely encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block relative flex-1">
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(230, 92, 0, 0.1) 0%, rgba(196, 74, 0, 0.1) 100%)'
          }} />
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="max-w-lg text-center">
              <div className="w-24 h-24 mx-auto mb-8" style={{
                background: 'linear-gradient(to right, #E65C00, #C44A00)',
                borderRadius: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 25px 50px -12px rgba(230, 92, 0, 0.5)'
              }}>
                <Car className="h-12 w-12 text-white" />
              </div>

              <h3 className="text-4xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Drive Your Business Forward</h3>

              <p className="text-lg mb-8" style={{ color: '#666666' }}>
                Join thousands of automotive professionals using MAG CRM to streamline their operations, boost sales, and deliver exceptional customer experiences.
              </p>

              <div style={{
                textAlign: 'left',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(230, 92, 0, 0.1)'
              }}>
                <h4 className="font-semibold mb-3 text-center" style={{ color: '#1A1A1A' }}>Why Choose MAG CRM?</h4>
                {[
                  'Manage customers & vehicles effortlessly',
                  'Track service history & appointments',
                  'Generate estimates & invoices quickly',
                  'Boost customer satisfaction & retention',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div className="w-6 h-6 mr-3 flex-shrink-0" style={{
                      backgroundColor: '#D1FAE5',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg className="w-3 h-3" style={{ color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm" style={{ color: '#1A1A1A' }}>{feature}</span>
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