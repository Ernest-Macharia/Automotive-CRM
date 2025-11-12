'use client';

import { useState, useCallback } from 'react';
import { Plus, Search, Filter, MoreVertical, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useOpportunities, useUpdateOpportunity } from '@/hooks/useOpportunities';
import { Opportunity } from '@/types/opportunity';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface KanbanColumnProps {
  id: string;
  title: string;
  opportunities: Opportunity[];
  onDragEnd: (id: string) => void;
}

function KanbanColumn({ id, title, opportunities, onDragEnd }: KanbanColumnProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onDragEnd(over.id); // Update status to this column
    }
  };

  return (
    <Card className="w-80 flex-shrink-0">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge variant="secondary">{opportunities.length}</Badge>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={opportunities.map((opp) => opp.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 min-h-[200px]">
              {opportunities.map((opportunity) => (
                <KanbanCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}

function KanbanCard({ opportunity }: { opportunity: Opportunity }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: opportunity.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateMutation = useUpdateOpportunity();

  const handleDelete = async () => {
    if (confirm('Delete this opportunity?')) {
      await updateMutation.mutateAsync({ id: opportunity.id, data: { status: 'deleted' } }); // Or use delete hook
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-4 cursor-grab active:cursor-grabbing">
      <CardContent className="space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-gray-900 line-clamp-1">{opportunity.subject}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/opportunities/${opportunity.id}`}>View</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/opportunities/${opportunity.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{opportunity.customerName}</p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(opportunity.value || 0)}</span>
          <span>{new Date(opportunity.createdAt).toLocaleDateString('en-KE')}</span>
        </div>
        <Badge className={getStatusColor(opportunity.status)} variant="secondary">
          {opportunity.status}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: opportunities = [], isLoading, error } = useOpportunities();
  const updateMutation = useUpdateOpportunity();

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch = opp.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          opp.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || opp.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Group by status (like Zoho stages)
  const columns = filteredOpportunities.reduce((acc, opp) => {
    const columnId = opp.status || 'open';
    if (!acc[columnId]) acc[columnId] = { title: columnId.toUpperCase(), opportunities: [] };
    acc[columnId].opportunities.push(opp);
    return acc;
  }, {} as Record<string, { title: string; opportunities: Opportunity[] }>);

  const statusOptions = ['all', 'open', 'in_progress', 'won', 'lost'];

  const handleDragEnd = useCallback((newStatus: string, opportunityId: string) => {
    updateMutation.mutateAsync({ id: opportunityId, data: { status: newStatus as Opportunity['status'] } });
  }, [updateMutation]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error loading opportunities</h2>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities Pipeline</h1>
          <p className="text-gray-600">Drag cards to update stages</p>
        </div>
        <Link
          href="/opportunities/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Opportunity
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Stages' : status.replace('_', ' ')}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : Object.keys(columns).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No opportunities</div>
            <Button asChild>
              <Link href="/opportunities/new">Create your first opportunity</Link>
            </Button>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {Object.entries(columns).map(([status, column]) => (
              <KanbanColumn
                key={status}
                id={status}
                title={column.title}
                opportunities={column.opportunities}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}