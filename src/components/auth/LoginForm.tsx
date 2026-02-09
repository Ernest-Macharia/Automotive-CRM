'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  authService,
  LoginData,
  AuthenticationError,
  NetworkError,
  ValidationError,
} from '@/services/authService';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showDemoButton?: boolean;
}

type FieldErrors = Partial<Record<'email' | 'password', string>>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateLoginClient(data: LoginData): {
  ok: boolean;
  formError?: string;
  fieldErrors: FieldErrors;
} {
  const fieldErrors: FieldErrors = {};

  const email = (data.email || '').trim();
  const password = data.password || '';

  if (!email) fieldErrors.email = 'Please enter your email address.';
  else if (!isValidEmail(email))
    fieldErrors.email = 'That email looks invalid. Example: name@company.com';

  if (!password) fieldErrors.password = 'Please enter your password.';
  else if (password.length < 6)
    fieldErrors.password = 'Password must be at least 6 characters.';

  const ok = Object.keys(fieldErrors).length === 0;
  return {
    ok,
    fieldErrors,
    formError: ok ? undefined : 'Please fix the highlighted fields and try again.',
  };
}

/**
 * Convert any thrown error into a safe, descriptive frontend message.
 * IMPORTANT: Do NOT show raw backend messages here.
 */
function toUserFriendlyError(err: unknown): string {
  if (err instanceof ValidationError) return err.message;
  if (err instanceof AuthenticationError)
    return 'Invalid email or password. Please check your credentials and try again.';
  if (err instanceof NetworkError)
    return 'We couldn’t reach the server. Check your internet connection (or VPN) and try again.';
  return 'We couldn’t sign you in. Please try again in a moment.';
}

export default function LoginForm({
  onSuccess,
  onError,
  showDemoButton = true,
}: LoginFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // banner (top) error
  const [error, setError] = useState('');

  // field-level errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const canSubmit = useMemo(() => {
    return !isLoading;
  }, [isLoading]);

  const updateField = <K extends keyof LoginData>(key: K, value: LoginData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));

    // clear banner on edit
    if (error) setError('');

    // clear field error for that field as user types
    if (key === 'email' || key === 'password') {
      setFieldErrors(prev => {
        const next = { ...prev };
        // delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Frontend-first validation
    const check = validateLoginClient(formData);
    if (!check.ok) {
      setFieldErrors(check.fieldErrors);
      setError(check.formError || 'Please check your details and try again.');
      onError?.(check.formError || 'Please check your details and try again.');
      return;
    }

    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const resp = await authService.login({
        ...formData,
        email: formData.email.trim(),
      });

      if (resp.user.requiresPasswordChange) {
        router.push('/auth/force-change-password');
        return;
      }

      if (onSuccess) onSuccess();
      else window.location.href = '/dashboard';
    } catch (err: unknown) {
      const msg = toUserFriendlyError(err);

      // Make auth errors feel “descriptive” with field hints
      if (err instanceof AuthenticationError) {
        setFieldErrors({
          email: 'Check your email address.',
          password: 'Check your password.',
        });
      }

      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const resp = await authService.demoLogin();

      if (resp.user.requiresPasswordChange) {
        router.push('/auth/force-change-password');
        return;
      }

      router.push('/dashboard');
    } catch {
      const msg = 'Demo login failed. Please try manual login.';
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {/* Email */}
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
              autoComplete="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={isLoading}
              placeholder="Enter your email"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className={[
                'block w-full pl-10 pr-3 py-3 rounded-xl border bg-white text-gray-900 placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                fieldErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200',
                isLoading ? 'opacity-75' : '',
              ].join(' ')}
            />
          </div>

          {fieldErrors.email && (
            <p id="email-error" className="mt-2 text-sm text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
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
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              disabled={isLoading}
              placeholder="Enter your password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className={[
                'block w-full pl-10 pr-12 py-3 rounded-xl border bg-white text-gray-900 placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                fieldErrors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200',
                isLoading ? 'opacity-75' : '',
              ].join(' ')}
            />

            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(s => !s)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </button>
          </div>

          {fieldErrors.password && (
            <p id="password-error" className="mt-2 text-sm text-red-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={!!formData.rememberMe}
            onChange={(e) => updateField('rememberMe', e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in to your account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="text-xs text-center text-gray-500 mt-2">
            Use: superadmin@crm.local / Testme123!
          </p>
        </div>
      </form>
    </div>
  );
}
