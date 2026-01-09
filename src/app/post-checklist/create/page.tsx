'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import PostChecklistCreatePage from '@/components/post-checklist/PostChecklistCreatePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function PostChecklistCreateRoute() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const checklistId = params?.id as string;
  const mode = checklistId ? 'edit' : 'create';

  // Check for required parameters
  useEffect(() => {
    if (mode === 'create') {
      const opportunityId = searchParams.get('opportunityId');
      const jobCardId = searchParams.get('jobCardId');
      
      if (!opportunityId) {
        console.error('Missing opportunity ID for post-checklist creation');
        // You might want to redirect or show an error
        // router.push('/opportunities');
      }
      
      if (!jobCardId) {
        console.error('Missing job card ID for post-checklist creation');
        // You might want to redirect or show an error
        // router.push('/job-cards');
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
            <p className="text-gray-600 mb-4">The post-checklist ID is invalid or missing.</p>
            <button
              onClick={() => router.push('/postchecklists')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Post-Checklists
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PostChecklistCreatePage 
        mode={mode}
        checklistId={checklistId}
      />
    </ProtectedRoute>
  );
}