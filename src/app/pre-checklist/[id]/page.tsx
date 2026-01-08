'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PreChecklistDetailPage from '@/components/pre-checklist/PreChecklistDetailPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PreChecklistDetailRoute() {
  const params = useParams();
  const router = useRouter();

  const checklistId = params?.id as string;

  useEffect(() => {
    if (!checklistId || checklistId === 'undefined') {
      console.error('Invalid pre-checklist ID detected, redirecting...');
      router.push('/orders/work-orders');
    }
  }, [checklistId, router]);

  if (!checklistId || checklistId === 'undefined') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Loading pre-checklist...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PreChecklistDetailPage id={checklistId} />
    </ProtectedRoute>
  );
}