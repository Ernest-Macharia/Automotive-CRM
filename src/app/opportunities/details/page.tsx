'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import OpportunityDetailsPage from '@/components/opportunities/OpportunityDetailsPage';
import { useSearchParams } from 'next/navigation';

export default function OpportunityDetailsRoute() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Opportunity ID Required</h2>
              <p className="text-gray-600 mb-6">
                Please provide an opportunity ID in the URL
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <OpportunityDetailsPage opportunityId={id} />
    </ProtectedRoute>
  );
}