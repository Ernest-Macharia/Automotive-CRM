// app/leads/details/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import LeadDetail from '@/components/leads/LeadDetail';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LeadDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadId = searchParams.get('id');

  if (!leadId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Lead Selected</h3>
            <p className="text-gray-600 mb-6">Please select a lead from the list to view details.</p>
            <button
              onClick={() => router.push('/leads')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Back to Leads
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <LeadDetail 
        leadId={leadId}
        onBack={() => router.push('/leads')}
      />
    </ProtectedRoute>
  );
}