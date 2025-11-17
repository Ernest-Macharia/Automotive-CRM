// src/app/opportunities/[id]/client-page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useOpportunity } from '@/hooks/useOpportunities';
import { OpportunityHeader } from '@/components/opportunities/opportunity-header';
import { OpportunityTabs } from '@/components/opportunities/opportunity-tabs';
import { OpportunitySkeleton } from '@/components/opportunities/opportunity-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export function OpportunityClientPage() {
  const { id } = useParams();
  
  // Use the hook with the ID from URL params
  const { data: opportunity, isLoading, error, refetch } = useOpportunity(id as string);

  // Optional: Refetch when ID changes (for dynamic routes)
  useEffect(() => {
    if (id) {
      refetch?.();
    }
  }, [id, refetch]);

  if (isLoading) return <OpportunitySkeleton />;
  
  if (error || !opportunity) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error 
              ? `Failed to load opportunity details: ${error.message || 'Unknown error'}`
              : 'Opportunity not found'
            }
          </AlertDescription>
        </Alert>
        
        {/* Show the ID that was attempted for debugging */}
        <div className="mt-4 text-sm text-gray-500">
          Attempted to load opportunity ID: {id}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <OpportunityHeader opportunity={opportunity} />
      <OpportunityTabs opportunity={opportunity} />
    </div>
  );
}