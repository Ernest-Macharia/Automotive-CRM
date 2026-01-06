'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QuoteDetailPage from '@/components/quotes/QuoteDetailPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function QuoteDetailRoute() {
  const params = useParams();
  const router = useRouter();

  const quoteId = params?.id as string;

  useEffect(() => {
    if (!quoteId || quoteId === 'undefined') {
      console.error('Invalid quote ID detected, redirecting...');
      router.push('/quotes');
    }
  }, [quoteId, router]);

  if (!quoteId || quoteId === 'undefined') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Loading quote...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <QuoteDetailPage id={quoteId} />
    </ProtectedRoute>
  );
}