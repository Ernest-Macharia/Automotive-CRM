// src/components/opportunities/OpportunityKanbanBoard.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Building, MoreHorizontal, Calendar, User, Mail, Phone, FileText } from 'lucide-react';

// ────────────────────────────────────────────────────────────────
// FIXED TYPES - MATCHING YOUR ACTUAL API STRUCTURE
// ────────────────────────────────────────────────────────────────
interface ApiOpportunity {
  _id: string;
  type: string;
  subject: string;
  status: string; // This is string in your API, not OpportunityStatus
  customer: {
    name: string;
    _id: string;
    email?: string;
    phone?: string;
    companyName?: string;
  };
  vehicles: Array<{
    registrationNumber?: string;
    make?: string;
    model?: string;
    year?: number;
  }>;
  quotes: Array<{
    totalAmount?: number;
    status?: string;
    items?: unknown[];
  }>;
  assignedTo?: unknown;
  jobCards: unknown[];
  waivers: unknown[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface BlueprintStage {
  name: string;
  order: number;
  allowedRoles: string[];
  entryActions: unknown[];
  exitActions: unknown[];
  _id: string;
}

interface ApiBlueprint {
  _id: string;
  name: string;
  module: string;
  stages: BlueprintStage[];
  createdBy: unknown;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// ────────────────────────────────────────────────────────────────
// FIXED KANBAN CARD - NO TYPE ERRORS
// ────────────────────────────────────────────────────────────────
function KanbanCard({ opportunity }: { opportunity: ApiOpportunity }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: opportunity._id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const percentage = useMemo(() => {
    const map: Record<string, number> = {
      'new': 10,
      'qualified': 30,
      'proposal': 60,
      'proposal_sent': 70,
      'won': 100,
      'lost': 0,
      'closed': 0,
    };
    return map[opportunity.status.toLowerCase()] ?? null;
  }, [opportunity.status]);

  // Safe amount calculation
  const amount = useMemo(() => {
    if (!opportunity.quotes || opportunity.quotes.length === 0) return 0;
    
    // Use the latest quote with amount
    const quotesWithAmount = opportunity.quotes.filter((quote): quote is { totalAmount: number } => 
      quote.totalAmount !== undefined && quote.totalAmount > 0
    );
    
    if (quotesWithAmount.length === 0) return 0;
    
    // Return the latest quote amount
    return quotesWithAmount[quotesWithAmount.length - 1].totalAmount;
  }, [opportunity.quotes]);

  const formattedDate = useMemo(() => {
    return format(new Date(opportunity.createdAt), 'dd/MM/yy');
  }, [opportunity.createdAt]);

  const assignedUserName = useMemo(() => {
    if (!opportunity.assignedTo) return 'Unassigned';
    
    // Safe type checking for assignedTo
    if (typeof opportunity.assignedTo === 'object' && opportunity.assignedTo !== null && 'name' in opportunity.assignedTo) {
      return (opportunity.assignedTo as { name: string }).name || 'Assigned';
    }
    
    return 'Assigned';
  }, [opportunity.assignedTo]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 cursor-grab active:cursor-grabbing group relative"
    >
      <Card className="p-3 shadow-sm hover:shadow-md border border-gray-200 rounded-lg bg-white">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="h-3 w-3 text-gray-500" />
          </button>
        </div>

        <div className="flex justify-between items-start mb-2 pr-6">
          <h4 className="font-semibold text-sm text-gray-900 flex-1 pr-2">
            {opportunity.subject}
          </h4>
          {percentage !== null && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {percentage}%
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5">
            <Building className="h-3 w-3 text-gray-500" />
            <p className="text-xs text-gray-600">{opportunity.customer.name}</p>
          </div>
          
          {(opportunity.customer.email || opportunity.customer.phone) && (
            <div className="flex items-center gap-1.5">
              {opportunity.customer.email ? (
                <Mail className="h-3 w-3 text-gray-400" />
              ) : (
                <Phone className="h-3 w-3 text-gray-400" />
              )}
              <p className="text-xs text-gray-500 truncate">
                {opportunity.customer.email || opportunity.customer.phone}
              </p>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-gray-400" />
            <p className="text-xs text-gray-500 truncate">{assignedUserName}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
            {opportunity.vehicles[0]?.registrationNumber || 'No vehicle'}
          </Badge>
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-900">
              {amount > 0 ? `KES ${amount.toLocaleString()}` : 'No amount'}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// FIXED MAIN BOARD - NO TYPE ERRORS
// ────────────────────────────────────────────────────────────────
export function OpportunityKanbanBoard() {
  const queryClient = useQueryClient();
  const [stages, setStages] = useState<Record<string, ApiOpportunity[]>>({});
  const [blueprint, setBlueprint] = useState<ApiBlueprint | null>(null);
  const [userRole] = useState<string>('sales');

  // Fixed queries with proper typing
  const { data: opportunities = [], isLoading: oppLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async (): Promise<ApiOpportunity[]> => {
      const response = await api.opportunities.list();
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: blueprints = [], isLoading: bpLoading } = useQuery({
    queryKey: ['blueprints'],
    queryFn: async (): Promise<ApiBlueprint[]> => {
      const response = await api.blueprints.list();
      const data = Array.isArray(response) ? response : [];
      
      // Transform to ensure active field exists
      return data.map((bp: unknown) => ({
        ...(bp as Omit<ApiBlueprint, 'active'>),
        active: (bp as { active?: boolean }).active ?? false
      }));
    },
  });

  // Fixed blueprint selection - no sync state updates
  useEffect(() => {
    if (blueprints.length > 0) {
      const timer = setTimeout(() => {
        const activeBlueprints = blueprints.filter((bp: ApiBlueprint) => 
          bp.module === 'opportunities' && bp.active
        );
        
        const mostRecentBlueprint = activeBlueprints.sort((a: ApiBlueprint, b: ApiBlueprint) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        
        setBlueprint(mostRecentBlueprint || activeBlueprints[0] || null);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [blueprints]);

  // Fixed stage grouping - no sync state updates
  useEffect(() => {
    if (opportunities.length > 0 && blueprint) {
      const timer = setTimeout(() => {
        const newStages: Record<string, ApiOpportunity[]> = {};
        
        blueprint.stages.forEach((stage: BlueprintStage) => {
          const stageKey = stage.name.toLowerCase();
          newStages[stage.name] = opportunities.filter((opportunity: ApiOpportunity) => 
            opportunity.status.toLowerCase() === stageKey
          );
        });
        
        setStages(newStages);
      }, 0);
      
      return () => clearTimeout(timer);
    } else {
      // Clear stages when no data
      setStages({});
    }
  }, [opportunities, blueprint]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  // Fixed mutation - properly typed status
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.opportunities.update(id, { status } as Partial<ApiOpportunity>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Opportunity moved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Not allowed');
    },
  });

  // Fixed drag handler with proper typing
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const fromStage = Object.keys(stages).find((stageName) =>
      stages[stageName]?.some((o) => o._id === active.id)
    );

    const toStageName = over.id as string;

    if (!fromStage || fromStage === toStageName) return;

    const targetStage = blueprint?.stages.find((s) => s.name === toStageName);
    if (!targetStage) return;

    const opportunity = stages[fromStage]?.find((o) => o._id === active.id);
    if (!opportunity) return;

    // Fixed role checking
    const userRolesMap: Record<string, string[]> = {
      sales: ['sales'],
      sales_manager: ['sales', 'management'],
      sales_director: ['sales', 'management'],
      admin: ['admin'],
      management: ['management']
    };

    const userAllowedRoles = userRolesMap[userRole] || [];
    const hasPermission = targetStage.allowedRoles.some((role: string) => 
      userAllowedRoles.includes(role)
    );

    if (!hasPermission) {
      toast.error(`Only ${targetStage.allowedRoles.join(', ')} can move to ${toStageName}`);
      return;
    }

    updateMutation.mutate({ id: opportunity._id, status: toStageName.toLowerCase() });
  };

  // Fixed utility functions
  const getTotal = (stage: string): number =>
    stages[stage]?.reduce((sum, o) => {
      const amount = o.quotes?.[0]?.totalAmount || 0;
      return sum + amount;
    }, 0) || 0;

  const getCount = (stage: string): number => stages[stage]?.length || 0;

  const getWinRate = (stage: string): number | null => {
    const name = stage.toLowerCase();
    if (name.includes('won')) return 100;
    if (name.includes('lost')) return 0;
    return null;
  };

  const getStageColors = (name: string): string => {
    const n = name.toLowerCase();
    const map: Record<string, string> = {
      'new': 'bg-blue-50 border-l-blue-400 text-blue-900',
      'qualified': 'bg-purple-50 border-l-purple-400 text-purple-900',
      'proposal': 'bg-indigo-50 border-l-indigo-400 text-indigo-900',
      'proposal_sent': 'bg-indigo-50 border-l-indigo-400 text-indigo-900',
      'won': 'bg-green-50 border-l-green-400 text-green-900',
      'lost': 'bg-red-50 border-l-red-400 text-red-900',
      'closed': 'bg-gray-50 border-l-gray-400 text-gray-900',
    };
    return map[n] || 'bg-gray-50 border-l-gray-400 text-gray-900';
  };

  const totalOpportunities = Object.values(stages).reduce((sum, stage) => sum + stage.length, 0);

  // Loading state
  if (oppLoading || bpLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="text-center py-10 text-gray-500">
        No active workflow
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6">
        {blueprint.stages.map((stage: BlueprintStage) => {
          const list = stages[stage.name] || [];
          const total = getTotal(stage.name);
          const count = getCount(stage.name);
          const winRate = getWinRate(stage.name);
          const colors = getStageColors(stage.name);

          return (
            <div key={stage.name} id={stage.name} className="flex-shrink-0 w-72">
              <div className={`relative mb-3 p-3 rounded-md border-l-4 ${colors}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 capitalize">
                      {stage.name.replace(/_/g, ' ')}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-gray-800">{count}</span>
                      {total > 0 && (
                        <span className="text-sm font-medium text-gray-700">
                          KES {total.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {winRate !== null && (
                    <div
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        winRate === 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {winRate}%
                    </div>
                  )}
                </div>
                {totalOpportunities > 0 && (
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(count / totalOpportunities) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-2 min-h-96">
                <SortableContext items={list.map(o => o._id)} strategy={verticalListSortingStrategy}>
                  {list.map(opp => (
                    <KanbanCard key={opp._id} opportunity={opp} />
                  ))}
                </SortableContext>
                {list.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500">Drop here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}