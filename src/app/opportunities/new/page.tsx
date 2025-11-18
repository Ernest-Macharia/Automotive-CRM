// app/opportunities/new/page.tsx
'use client';

import { useState } from 'react';
import { CreateOpportunityModal } from '@/components/opportunities/CreateOpportunityModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PipelineStats {
  totalDeals: number;
  myDeals: number;
  pipelineValue: number;
  winRate: number;
}

interface StageCount {
  name: string;
  count: number;
  percentage: string;
}

interface ApiBlueprint {
  _id: string;
  name: string;
  module: string;
  stages: Array<{
    name: string;
    order: number;
    allowedRoles: string[];
    entryActions: unknown[];
    exitActions: unknown[];
    _id: string;
  }>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiOpportunity {
<<<<<<< HEAD
  _id: string;
  assignedTo?: { name: string } | null;
=======
  assignedTo?: { name: string; id: string; email: string } | null;
>>>>>>> 32eb1c7d6ef9be0504317ae62fcd903b186c9ac3
  status?: string;
  quotes?: Array<{ totalAmount: number }>;
  amount?: number;
}

export default function NewOpportunityPage() {
  const [open, setOpen] = useState(true);

  const { data: pipelineStats, isLoading: statsLoading } = useQuery({
    queryKey: ['opportunities-stats'],
    queryFn: async (): Promise<PipelineStats> => {
      try {
<<<<<<< HEAD
        const opportunitiesResponse = await api.opportunities.list();
        const opportunities = opportunitiesResponse as unknown as ApiOpportunity[];
=======
        const opportunities = await api.opportunities.list();
>>>>>>> 32eb1c7d6ef9be0504317ae62fcd903b186c9ac3
        const opportunitiesArray = Array.isArray(opportunities) ? opportunities : [];
        
        const totalDeals = opportunitiesArray.length;
<<<<<<< HEAD
        const myDeals = opportunitiesArray.filter(opp => 
          opp.assignedTo && typeof opp.assignedTo === 'object' && 'name' in opp.assignedTo && opp.assignedTo.name
        ).length;
=======
>>>>>>> 32eb1c7d6ef9be0504317ae62fcd903b186c9ac3
        
        const myDeals = opportunitiesArray.filter(opp => {
          const assignedTo = (opp as any)?.assignedTo;
          return assignedTo && typeof assignedTo === 'object' && 'name' in assignedTo;
        }).length;
        
        const pipelineValue = opportunitiesArray.reduce((sum, opp: any) => {
          const amount = opp?.quotes?.[0]?.totalAmount || opp?.amount || 0;
          return sum + amount;
        }, 0);

<<<<<<< HEAD
        const wonDeals = opportunitiesArray.filter(opp => opp.status === 'won' || opp.status === 'closed_won').length;
=======
        const wonDeals = opportunitiesArray.filter((opp: any) => opp?.status === 'won').length;
>>>>>>> 32eb1c7d6ef9be0504317ae62fcd903b186c9ac3
        const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

        return {
          totalDeals,
          myDeals,
          pipelineValue,
          winRate
        };
      } catch (error) {
        console.error('Failed to fetch pipeline stats:', error);
        return { totalDeals: 0, myDeals: 0, pipelineValue: 0, winRate: 0 };
      }
    },
  });

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      window.history.back();
    }, 300);
  };

  const handleSuccess = (id: string) => {
    window.location.href = `/opportunities/${id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Deals
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create New Deal</h1>
                  <p className="text-sm text-gray-500">Add a new opportunity to your sales pipeline</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Real Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Real Pipeline Stats */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Pipeline Overview</h3>
                {statsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Target className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Total Deals</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {pipelineStats?.totalDeals || 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <Target className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Pipeline Value</div>
                        <div className="text-sm font-semibold text-gray-900">
                          KES {(pipelineStats?.pipelineValue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <Target className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Win Rate</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {pipelineStats?.winRate || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <Target className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">My Open Deals</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {pipelineStats?.myDeals || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <PipelineStages />
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white shadow-sm border border-gray-200">
              <CreateOpportunityModal
                open={open}
                onClose={handleClose}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineStages() {
  const { data: blueprints, isLoading } = useQuery({
    queryKey: ['blueprints'],
    queryFn: () => api.blueprints.list(),
  });

  const { data: opportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => api.opportunities.list(),
  });

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Pipeline Stages</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  // Safely handle blueprint data with proper type checking
  const blueprintsData = blueprints as unknown as ApiBlueprint[] | undefined;
  const opportunitiesData = opportunities as unknown as ApiOpportunity[] | undefined;

  // Get the active opportunities blueprint
  const opportunityBlueprint = blueprintsData?.find((bp: ApiBlueprint) => 
    bp.module === 'opportunities' && bp.active
  );

  // Calculate stage counts from real opportunities
  const stageCounts: StageCount[] = opportunityBlueprint?.stages?.map((stage) => {
    const stageOpportunities = opportunitiesData?.filter((opp: ApiOpportunity) => 
      opp.status === stage.name
=======
  const opportunityBlueprint = (blueprints as Blueprint[])?.find((bp: Blueprint) => 
    bp.module === 'opportunities' && bp.active
  );

  const stageCounts: StageCount[] = opportunityBlueprint?.stages?.map((stage: { name: string }) => {
    const stageOpportunities = (opportunities as any[])?.filter((opp: any) => 
      opp?.status === stage.name
>>>>>>> 32eb1c7d6ef9be0504317ae62fcd903b186c9ac3
    ) || [];
    
    const totalCount = opportunitiesData?.length || 0;
    
    return {
      name: stage.name,
      count: stageOpportunities.length,
      percentage: totalCount > 0 ? 
        Math.round((stageOpportunities.length / totalCount) * 100) + '%' : '0%'
    };
  }) || [];

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Pipeline Stages</h3>
      <div className="space-y-3">
        {stageCounts.map((stage: StageCount, index: number) => (
          <div key={stage.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${
                index === 0 ? 'bg-blue-500' :
                index === 1 ? 'bg-purple-500' :
                index === 2 ? 'bg-indigo-500' :
                index === 3 ? 'bg-orange-500' :
                'bg-green-500'
              }`}></div>
              <span className="text-sm text-gray-700 capitalize">
                {stage.name.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-gray-900">{stage.count}</div>
              <div className="text-xs text-gray-500">{stage.percentage}</div>
            </div>
          </div>
        ))}
        
        {stageCounts.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            No pipeline stages configured
          </div>
        )}
      </div>
    </div>
  );
}