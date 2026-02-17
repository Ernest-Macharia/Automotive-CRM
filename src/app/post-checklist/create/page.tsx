'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import DiamondRimsPostChecklistCreatePage from '@/components/post-checklist/DiamondRimsPostChecklistCreatePage';
import HeadlightPostChecklistCreatePage from '@/components/post-checklist/HeadlightPostChecklistCreatePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AlertCircle } from 'lucide-react';

export default function PostChecklistCreatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const checklistId = params?.id as string;
  const mode = checklistId ? 'edit' : 'create';
  
  const clientType = searchParams.get('clientType');
  const opportunityId = searchParams.get('opportunityId');
  const workOrderId = searchParams.get('workOrderId');

  useEffect(() => {
    if (mode === 'create') {
      if (!opportunityId && !workOrderId) {
        console.error('Missing required parameters for post-checklist creation');
      }
    }
  }, [mode, opportunityId, workOrderId]);

  useEffect(() => {
    console.log('=== Post-Checklist Create Page ===');
    console.log('Mode:', mode);
    console.log('ClientType:', clientType);
    console.log('URL:', window.location.href);
  }, [clientType, mode]);

  if (mode === 'edit' && (!checklistId || checklistId === 'undefined')) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Checklist ID</h3>
            <p className="text-gray-600 mb-4">The post-checklist ID is invalid or missing.</p>
            <button
              onClick={() => router.push('/postchecklists')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Post-Checklists
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (mode === 'create' && !clientType) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Checklist Type Selected</h3>
            <p className="text-gray-600 mb-4">Please select a post-checklist type.</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (clientType === 'eagle-lights') {
    return (
      <ProtectedRoute>
        <HeadlightPostChecklistCreatePage
          mode={mode}
          checklistId={checklistId}
        />
      </ProtectedRoute>
    );
  }

  console.log('✅ Rendering DiamondRimsPostChecklistCreatePage');
  return (
    <ProtectedRoute>
      <DiamondRimsPostChecklistCreatePage 
        mode={mode}
        checklistId={checklistId}
      />
    </ProtectedRoute>
  );
}