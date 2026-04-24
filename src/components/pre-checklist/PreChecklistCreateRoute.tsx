'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import DiamondRimsPreChecklistCreatePage from '@/components/pre-checklist/DiamondRimsPreChecklistCreatePage';
import HeadlightPreChecklistCreatePage from '@/components/pre-checklist/HeadlightPreChecklistCreatePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function PreChecklistCreateRoute() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [debug, setDebug] = useState<any>({});

  const checklistId = params?.id as string;
  const mode = checklistId ? 'edit' : 'create';
  
  // Get clientType from URL parameters
  const clientType = searchParams.get('clientType');
  const opportunityId = searchParams.get('opportunityId');
  const workOrderId = searchParams.get('workOrderId');
  const source = searchParams.get('source');

  // Log all params for debugging
  useEffect(() => {
    
    setDebug({
      mode,
      checklistId,
      clientType,
      opportunityId,
      workOrderId,
      source,
      url: window.location.href
    });
  }, [clientType, mode, checklistId, opportunityId, workOrderId, source]);

  // Handle edit mode with invalid ID
  if (mode === 'edit' && (!checklistId || checklistId === 'undefined')) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Checklist ID</h3>
            <p className="text-gray-600 mb-4">The pre-checklist ID is invalid or missing.</p>
            <button
              onClick={() => router.push('/pre-checklist')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Pre-Checklists
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show debug info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Rendering component for clientType:', clientType);
  }

  // Render Eagle Lights form if clientType is eagle-lights
  if (clientType === 'eagle-lights') {
    return (
      <ProtectedRoute>
        <HeadlightPreChecklistCreatePage 
          mode={mode}
          checklistId={checklistId}
        />
      </ProtectedRoute>
    );
  }
  return (
    <ProtectedRoute>
      <DiamondRimsPreChecklistCreatePage 
        mode={mode}
        checklistId={checklistId}
      />
    </ProtectedRoute>
  );
}
