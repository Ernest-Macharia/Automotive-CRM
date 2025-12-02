'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building, Phone, Eye, EyeOff, Car } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Implement registration API call
      // const response = await authService.register(formData);
      
      // For now, simulate successful registration
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <div className="mx-auto w-full max-w-md lg:w-96">
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

              <h2 className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>Start your free trial</h2>
              <p className="mt-2 text-sm" style={{ color: '#666666' }}>
                Already have an account?{' '}
                <Link href="/auth/login" style={{
                  color: '#E65C00',
                  fontWeight: '600'
                }} className="hover:opacity-80 transition-opacity">
                  Sign in here
                </Link>
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4" style={{
                backgroundColor: 'rgba(255, 51, 0, 0.1)',
                border: '1px solid rgba(255, 51, 0, 0.2)',
                borderRadius: '0.75rem'
              }}>
                <p className="text-sm" style={{ color: '#FF3300' }}>{error}</p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                        First Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5" style={{ color: '#666666' }} />
                        </div>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            border: '1px solid #CCCCCC',
                            borderRadius: '0.75rem',
                            color: '#1A1A1A'
                          }}
                          className="block w-full pl-10 pr-3 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                          placeholder="John"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                        Last Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5" style={{ color: '#666666' }} />
                        </div>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            border: '1px solid #CCCCCC',
                            borderRadius: '0.75rem',
                            color: '#1A1A1A'
                          }}
                          className="block w-full pl-10 pr-3 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </div>

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
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid #CCCCCC',
                          borderRadius: '0.75rem',
                          color: '#1A1A1A'
                        }}
                        className="block w-full pl-10 pr-3 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                      Company Name (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5" style={{ color: '#666666' }} />
                      </div>
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid #CCCCCC',
                          borderRadius: '0.75rem',
                          color: '#1A1A1A'
                        }}
                        className="block w-full pl-10 pr-3 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                        placeholder="Your Company"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5" style={{ color: '#666666' }} />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid #CCCCCC',
                          borderRadius: '0.75rem',
                          color: '#1A1A1A'
                        }}
                        className="block w-full pl-10 pr-3 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                      Password
                    </label>
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
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid #CCCCCC',
                          borderRadius: '0.75rem',
                          color: '#1A1A1A'
                        }}
                        className="block w-full pl-10 pr-12 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                        placeholder="At least 8 characters"
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
                    <p className="mt-2 text-xs" style={{ color: '#666666' }}>
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5" style={{ color: '#666666' }} />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid #CCCCCC',
                          borderRadius: '0.75rem',
                          color: '#1A1A1A'
                        }}
                        className="block w-full pl-10 pr-12 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" style={{ color: '#666666' }} />
                        ) : (
                          <Eye className="h-5 w-5" style={{ color: '#666666' }} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        style={{
                          color: '#E65C00'
                        }}
                        className="h-4 w-4 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="terms" style={{ color: '#1A1A1A' }}>
                        I agree to the{' '}
                        <a href="/terms" style={{
                          color: '#E65C00',
                          fontWeight: '600'
                        }} className="hover:opacity-80">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" style={{
                          color: '#E65C00',
                          fontWeight: '600'
                        }} className="hover:opacity-80">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
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
                      className="w-full flex justify-center items-center py-3 px-4 shadow-sm text-sm font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating account...
                        </>
                      ) : (
                        'Start 14-Day Free Trial'
                      )}
                    </button>
                  </div>
                </form>
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
            <div className="max-w-lg">
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

              <h3 className="text-4xl font-bold mb-4" style={{ color: '#1A1A1A' }}>Transform Your Automotive Business</h3>

              <p className="text-lg mb-8" style={{ color: '#666666' }}>
                Join thousands of dealerships and service centers using MAG CRM to increase efficiency, boost sales, and deliver outstanding customer experiences.
              </p>

              <div className="space-y-6">
                {[
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
                ].map((feature, index) => {
                  const getIcon = (type: string) => {
                    switch(type) {
                      case 'calendar':
                        return (
                          <svg className="h-5 w-5" style={{ color: '#E65C00' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        );
                      case 'users':
                        return (
                          <svg className="h-5 w-5" style={{ color: '#E65C00' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.205a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        );
                      case 'headphones':
                        return (
                          <svg className="h-5 w-5" style={{ color: '#E65C00' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        );
                      case 'zap':
                        return (
                          <svg className="h-5 w-5" style={{ color: '#E65C00' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        );
                      default:
                        return (
                          <svg className="h-5 w-5" style={{ color: '#E65C00' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        );
                    }
                  };

                  return (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mr-4" style={{
                        backgroundColor: 'rgba(230, 92, 0, 0.1)'
                      }}>
                        {getIcon(feature.icon)}
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: '#1A1A1A' }}>{feature.title}</h4>
                        <p className="text-sm" style={{ color: '#666666' }}>{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}