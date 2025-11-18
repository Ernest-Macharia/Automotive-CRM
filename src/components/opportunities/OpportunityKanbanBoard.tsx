// src/components/opportunities/OpportunityKanbanBoard.tsx
'use client';

import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  Building, Calendar, User, Mail, Phone, 
  Eye, Edit, Trash2, Download,
  Target, Check
} from 'lucide-react';
import type { Opportunity, Blueprint, BlueprintStage, OpportunityStatus } from '@/lib/api/types';

// ────────────────────────────────────────────────────────────────
// INTERFACES
// ────────────────────────────────────────────────────────────────
interface OpportunityKanbanBoardProps {
  sortBy?: string;
  sortOrder?: string;
}

// Local interface that matches your actual API response
interface ApiBlueprint {
  _id: string;
  name: string;
  module: string;
  stages: BlueprintStage[];
  active: boolean; // ✅ Your API uses 'active' not 'isActive'
  createdAt: string;
  updatedAt: string;
}

// ────────────────────────────────────────────────────────────────
// KENYAN CURRENCY FORMATTER
// ────────────────────────────────────────────────────────────────
const formatKenyanShilling = (amount: number): string => {
  if (amount === 0) return 'No amount';
  return `KES ${amount.toLocaleString('en-KE')}`;
};

// ────────────────────────────────────────────────────────────────
// ENHANCED KANBAN CARD WITH BETTER TYPOGRAPHY
// ────────────────────────────────────────────────────────────────
function KanbanCard({ 
  opportunity, 
  isSelected = false,
  onSelect,
  onQuickActions 
}: { 
  opportunity: Opportunity;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onQuickActions?: (action: string, opportunity: Opportunity) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity._id,
  });

  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    opacity: isDragging ? 0.5 : 1 
  };

  const percentage = useMemo(() => {
    const map: Record<string, number> = {
      'new': 15,
      'qualified': 35,
      'proposal': 65,
      'proposal_sent': 75,
      'negotiation': 85,
      'won': 100,
      'lost': 0,
      'open': 25,
      'in_progress': 50,
      'closed': 0,
    };
    return map[opportunity.status] ?? 25;
  }, [opportunity.status]);

  const amount = useMemo(() => {
    if (!opportunity.quotes || opportunity.quotes.length === 0) return 0;
    
    // ✅ FIX: Use the actual Quote type
    const lastQuote = opportunity.quotes[opportunity.quotes.length - 1];
    return lastQuote?.totalAmount || 0;
  }, [opportunity.quotes]);

  const formattedDate = useMemo(() => {
    return format(new Date(opportunity.createdAt), 'MMM dd');
  }, [opportunity.createdAt]);

  const assignedUserName = useMemo(() => {
    if (!opportunity.assignedTo) return 'Unassigned';
    return `${opportunity.assignedTo.firstName} ${opportunity.assignedTo.lastName}`;
  }, [opportunity.assignedTo]);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(!isSelected);
  };

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickActions?.(action, opportunity);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-3 cursor-grab active:cursor-grabbing group relative ${
        isSelected ? 'ring-2 ring-orange-500 rounded-lg shadow-md' : 'hover:shadow-sm'
      } transition-all duration-200`}
    >
      <Card className="p-3 shadow-xs border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
        {/* Checkbox - Enhanced Visibility */}
        <div 
          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 z-10 transition-opacity"
          onClick={handleCheckboxClick}
        >
          <div 
            className={`w-5 h-5 border-2 rounded-md flex items-center justify-center cursor-pointer transition-all ${
              isSelected 
                ? 'bg-orange-500 border-orange-500 text-white shadow-sm' 
                : 'border-gray-400 bg-white hover:border-orange-500 hover:bg-orange-50'
            }`}
          >
            {isSelected && <Check className="w-3 h-3" />}
          </div>
        </div>

        {/* Quick Actions - Larger & More Visible */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button 
            onClick={(e) => handleAction('view', e)}
            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => handleAction('edit', e)}
            className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
            title="Edit Opportunity"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Enhanced Typography */}
        <div className="pr-10">
          {/* Header - Larger & Bolder */}
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-gray-900 line-clamp-2 flex-1 pr-2 text-sm leading-tight">
              {opportunity.subject}
            </h4>
            <Badge 
              variant="outline" 
              className={`text-xs font-semibold ${
                percentage >= 80 ? 'bg-green-100 text-green-800 border-green-300' :
                percentage >= 50 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                'bg-orange-100 text-orange-800 border-orange-300'
              }`}
            >
              {percentage}%
            </Badge>
          </div>

          {/* Customer Info - Better Spacing & Typography */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800 truncate">
                {opportunity.customer.name}
              </span>
            </div>
            
            {(opportunity.customer.email || opportunity.customer.phone) && (
              <div className="flex items-center gap-2">
                {opportunity.customer.email ? (
                  <Mail className="w-4 h-4 text-gray-500" />
                ) : (
                  <Phone className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-600 truncate">
                  {opportunity.customer.email || opportunity.customer.phone}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 truncate font-medium">
                {assignedUserName}
              </span>
            </div>
          </div>

          {/* Progress Bar - Thicker & More Visible */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                percentage >= 80 ? 'bg-green-500' :
                percentage >= 50 ? 'bg-blue-500' :
                'bg-orange-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Footer - Enhanced Readability */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <Badge 
              variant="secondary" 
              className="bg-gray-100 text-gray-800 text-xs font-medium border border-gray-300"
            >
              {opportunity.vehicles[0]?.registrationNumber || 'No vehicle'}
            </Badge>
            <div className="text-right">
              <div className="font-bold text-gray-900 text-sm">
                {formatKenyanShilling(amount)}
              </div>
              <div className="text-gray-600 text-xs flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// ENHANCED KANBAN BOARD WITH BETTER TYPOGRAPHY
// ────────────────────────────────────────────────────────────────
export function OpportunityKanbanBoard({ 
  sortBy = 'created_date', 
  sortOrder = 'desc' 
}: OpportunityKanbanBoardProps) {
  const queryClient = useQueryClient();
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);

  // Fetch data
  const { data: opportunities = [], isLoading: oppLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async (): Promise<Opportunity[]> => {
      const response = await api.opportunities.list();
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: blueprints = [], isLoading: bpLoading } = useQuery({
    queryKey: ['blueprints'],
    queryFn: async (): Promise<Blueprint[]> => {
      const response = await api.blueprints.list();
      return Array.isArray(response) ? response : [];
    },
  });

  // Enhanced sorting and filtering
  const sortedAndFilteredOpportunities = useMemo(() => {
    const sorted = [...opportunities];
    
    // Apply sorting
    switch (sortBy) {
      case 'amount':
        sorted.sort((a, b) => {
          const aAmount = a.quotes?.[0]?.totalAmount || 0;
          const bAmount = b.quotes?.[0]?.totalAmount || 0;
          return sortOrder === 'asc' ? aAmount - bAmount : bAmount - aAmount;
        });
        break;
      case 'customer_name':
        sorted.sort((a, b) => {
          const aName = a.customer.name.toLowerCase();
          const bName = b.customer.name.toLowerCase();
          return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
        });
        break;
      case 'subject':
        sorted.sort((a, b) => {
          const aSubject = a.subject.toLowerCase();
          const bSubject = b.subject.toLowerCase();
          return sortOrder === 'asc' ? aSubject.localeCompare(bSubject) : bSubject.localeCompare(aSubject);
        });
        break;
      case 'updated_date':
        sorted.sort((a, b) => {
          const aDate = new Date(a.updatedAt).getTime();
          const bDate = new Date(b.updatedAt).getTime();
          return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
        });
        break;
      case 'created_date':
      default:
        sorted.sort((a, b) => {
          const aDate = new Date(a.createdAt).getTime();
          const bDate = new Date(b.createdAt).getTime();
          return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
        });
        break;
    }
    
    return sorted;
  }, [opportunities, sortBy, sortOrder]);

  // ✅ FIXED: Blueprint and stage logic - use 'active' instead of 'isActive'
  const blueprint = useMemo(() => {
    if (blueprints.length > 0) {
      // Convert to ApiBlueprint type to access 'active' field
      const blueprintsData = blueprints as unknown as ApiBlueprint[];
      const activeBlueprint = blueprintsData.find((bp: ApiBlueprint) => 
        bp.module === 'opportunities' && bp.active // ✅ Changed from isActive to active
      );
      return activeBlueprint || null;
    }
    return null;
  }, [blueprints]);

  const stages = useMemo(() => {
    if (sortedAndFilteredOpportunities.length > 0 && blueprint) {
      const newStages: Record<string, Opportunity[]> = {};
      blueprint.stages.forEach((stage: BlueprintStage) => {
        newStages[stage.name] = sortedAndFilteredOpportunities.filter((opportunity: Opportunity) => 
          opportunity.status === stage.name.toLowerCase()
        );
      });
      return newStages;
    }
    return {};
  }, [sortedAndFilteredOpportunities, blueprint]);

  // Selection handlers
  const handleOpportunitySelect = (opportunityId: string, selected: boolean) => {
    setSelectedOpportunities(prev => 
      selected ? [...prev, opportunityId] : prev.filter(id => id !== opportunityId)
    );
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedOpportunities.length === 0) return;
    
    if (confirm(`Delete ${selectedOpportunities.length} selected opportunities?`)) {
      try {
        await Promise.all(selectedOpportunities.map(id => api.opportunities.delete(id)));
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        setSelectedOpportunities([]);
        toast.success('Opportunities deleted successfully');
   
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error('Failed to delete opportunities');
      }
    }
  };

  const handleBulkExport = () => {
    if (selectedOpportunities.length === 0) {
      toast.error('Please select opportunities to export');
      return;
    }
    toast.success(`Exporting ${selectedOpportunities.length} opportunities`);
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  // ✅ FIX: Use proper status type
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OpportunityStatus }) =>
      api.opportunities.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Opportunity status updated');
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const fromStage = Object.keys(stages).find(stageName =>
      stages[stageName]?.some(o => o._id === active.id)
    );

    const toStageName = over.id as string;
    if (!fromStage || fromStage === toStageName) return;

    const opportunity = stages[fromStage]?.find(o => o._id === active.id);
    if (opportunity) {
      // ✅ FIX: Ensure status is valid OpportunityStatus
      const validStatus = toStageName.toLowerCase() as OpportunityStatus;
      updateMutation.mutate({ id: opportunity._id, status: validStatus });
    }
  };

  // Utility functions
  const getTotal = (stage: string): number =>
    stages[stage]?.reduce((sum, o) => sum + (o.quotes?.[0]?.totalAmount || 0), 0) || 0;

  const getCount = (stage: string): number => stages[stage]?.length || 0;

  const getStageColors = (name: string): string => {
    const map: Record<string, string> = {
      'new': 'bg-blue-100 border-l-blue-500 text-blue-900',
      'qualified': 'bg-purple-100 border-l-purple-500 text-purple-900',
      'proposal': 'bg-indigo-100 border-l-indigo-500 text-indigo-900',
      'proposal_sent': 'bg-indigo-100 border-l-indigo-500 text-indigo-900',
      'negotiation': 'bg-orange-100 border-l-orange-500 text-orange-900',
      'won': 'bg-green-100 border-l-green-500 text-green-900',
      'lost': 'bg-red-100 border-l-red-500 text-red-900',
      'open': 'bg-blue-100 border-l-blue-500 text-blue-900',
      'in_progress': 'bg-yellow-100 border-l-yellow-500 text-yellow-900',
      'closed': 'bg-gray-100 border-l-gray-500 text-gray-900',
    };
    return map[name.toLowerCase()] || 'bg-gray-100 border-l-gray-500 text-gray-900';
  };

  const totalOpportunities = Object.values(stages).reduce((sum, stage) => sum + stage.length, 0);

  if (oppLoading || bpLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600">
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="font-medium">No workflow configured</p>
          <p className="text-sm text-gray-500 mt-1">Please set up an opportunity workflow</p>
          <Button 
            className="mt-3" 
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Bulk Actions Bar */}
      {selectedOpportunities.length > 0 && (
        <div className="bg-orange-100 border-b border-orange-300 px-4 py-2 flex items-center gap-3 shrink-0">
          <span className="text-sm font-bold text-orange-900">
            {selectedOpportunities.length} selected
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleBulkDelete}
            className="h-7 text-sm font-medium text-red-700 border-red-400 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleBulkExport}
            className="h-7 text-sm font-medium text-gray-700 border-gray-400 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <button 
            onClick={() => setSelectedOpportunities([])}
            className="text-sm font-medium text-orange-700 hover:text-orange-900 ml-auto"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Enhanced Kanban Board */}
      <div className="flex-1 min-h-0 p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full overflow-x-auto pb-2">
            {blueprint.stages.map((stage: BlueprintStage) => {
              const list = stages[stage.name] || [];
              const total = getTotal(stage.name);
              const count = getCount(stage.name);
              const colors = getStageColors(stage.name);

              return (
                <div key={stage.id || stage.name} className="shrink-0 w-72">
                  {/* Enhanced Stage Header */}
                  <div className={`mb-3 p-3 rounded-lg border-l-4 ${colors} shadow-sm`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-sm capitalize">
                        {stage.name.replace(/_/g, ' ')}
                      </h3>
                      <Badge variant="secondary" className="bg-white text-gray-800 font-bold text-sm">
                        {count}
                      </Badge>
                    </div>
                    {total > 0 && (
                      <div className="text-sm font-semibold text-gray-700">
                        {formatKenyanShilling(total)}
                      </div>
                    )}
                    {totalOpportunities > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${(count / totalOpportunities) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Enhanced Stage Content */}
                  <div className="bg-gray-50 rounded-lg border border-gray-300 h-full overflow-y-auto shadow-inner">
                    <SortableContext items={list.map(o => o._id)} strategy={verticalListSortingStrategy}>
                      {list.map(opp => (
                        <KanbanCard 
                          key={opp._id}
                          opportunity={opp}
                          isSelected={selectedOpportunities.includes(opp._id)}
                          onSelect={(selected) => handleOpportunitySelect(opp._id, selected)}
                          onQuickActions={(action, opp) => {
                            if (action === 'view') window.open(`/opportunities/${opp._id}`, '_blank');
                            if (action === 'edit') window.open(`/opportunities/${opp._id}/edit`, '_blank');
                          }}
                        />
                      ))}
                    </SortableContext>
                    
                    {list.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Target className="w-8 h-8 mx-auto mb-2 opacity-60" />
                        <p className="text-sm font-medium">No opportunities</p>
                        <p className="text-xs text-gray-400 mt-1">Drop cards here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
}