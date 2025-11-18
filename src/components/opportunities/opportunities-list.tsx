// src/components/opportunities/opportunities-list.tsx
'use client';

import { useOpportunities } from '@/hooks/useOpportunities';
import { OpportunityCard } from './opportunity-card';
import type { Opportunity } from '@/types/opportunity';

export function OpportunitiesList() {
  const { data: opportunities, isLoading, error } = useOpportunities();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle error state gracefully
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="text-red-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load opportunities</h3>
        <p className="text-gray-600 mb-4">There was an error fetching your opportunities data.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Handle empty state gracefully
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
        <p className="text-gray-600 mb-4">Get started by creating your first opportunity</p>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          Create Opportunity
        </button>
      </div>
    );
  }

  // Normal state - render opportunities
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">
        <div className="col-span-4">Opportunity</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Value</div>
        <div className="col-span-2">Actions</div>
      </div>
      
      {/* List */}
      <div className="divide-y divide-gray-200">
        {opportunities.map((opportunity: Opportunity) => (
          <OpportunityCard 
            key={opportunity.id} 
            opportunity={opportunity} // ✅ Pass the full opportunity object directly
          />
        ))}
      </div>
    </div>
  );
}