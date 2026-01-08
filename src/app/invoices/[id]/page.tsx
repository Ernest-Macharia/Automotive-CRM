'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InvoiceDetailPage from '@/components/invoices/InvoiceDetailPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function InvoiceDetailRoute() {
  const params = useParams();
  const router = useRouter();

  const invoiceId = params?.id as string;

  useEffect(() => {
    if (!invoiceId || invoiceId === 'undefined') {
      console.error('Invalid invoice ID detected, redirecting...');
      router.push('/invoices');
    }
  }, [invoiceId, router]);

  if (!invoiceId || invoiceId === 'undefined') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <InvoiceDetailPage id={invoiceId} />
    </ProtectedRoute>
  );
}