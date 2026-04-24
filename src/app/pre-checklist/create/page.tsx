'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import DiamondRimsPreChecklistCreatePage from '@/components/pre-checklist/DiamondRimsPreChecklistCreatePage';
import HeadlightPreChecklistCreatePage from '@/components/pre-checklist/HeadlightPreChecklistCreatePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AlertCircle, ArrowRight, Sparkles, Car } from 'lucide-react';

export default function PreChecklistCreatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const checklistId = params?.id as string;
  const mode = checklistId ? 'edit' : 'create';
  
  // Get clientType from URL parameters
  const clientType = searchParams.get('clientType');
  const opportunityId = searchParams.get('opportunityId');
  const workOrderId = searchParams.get('workOrderId');

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

  // Show loading if no clientType in create mode
  if (mode === 'create' && !clientType) {
    const handleSelectChecklistType = (selectedType: 'diamond-rims' | 'eagle-lights') => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('clientType', selectedType);
      router.push(`/pre-checklist/create?${params.toString()}`);
    };

    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 flex items-center justify-center px-6">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Create Pre-Checklist</h3>
              <p className="text-gray-600">Pick checklist type to continue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSelectChecklistType('diamond-rims')}
                className="text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Car className="h-5 w-5 text-purple-700" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Diamond Rims</h4>
                <p className="text-sm text-gray-600">Rims and tire intake checklist</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectChecklistType('eagle-lights')}
                className="text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <AlertCircle className="h-5 w-5 text-blue-700" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Eagle Lights</h4>
                <p className="text-sm text-gray-600">Headlight service intake checklist</p>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
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
