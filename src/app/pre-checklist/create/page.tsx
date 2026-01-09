'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import PreChecklistCreatePage from '@/components/pre-checklist/PreChecklistCreatePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function PreChecklistCreateRoute() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const checklistId = params?.id as string;
  const mode = checklistId ? 'edit' : 'create';

  // Check for required parameters
  useEffect(() => {
    if (mode === 'create') {
      const opportunityId = searchParams.get('opportunityId');
      const workOrderId = searchParams.get('workOrderId');
      
      if (!opportunityId && !workOrderId) {
        console.error('Missing required parameters for pre-checklist creation');
        // You might want to redirect or show an error
        // router.push('/orders/work-orders');
      }
    }
  }, [mode, searchParams, router]);

  if (mode === 'edit' && (!checklistId || checklistId === 'undefined')) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Checklist ID</h3>
            <p className="text-gray-600 mb-4">The pre-checklist ID is invalid or missing.</p>
            <button
              onClick={() => router.push('/prechecklists')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Pre-Checklists
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PreChecklistCreatePage 
        mode={mode}
        checklistId={checklistId}
      />
    </ProtectedRoute>
  );
}