'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Plus, Filter, CalendarDays, Search, MoreVertical, Phone, MessageCircle } from 'lucide-react';
import { useState } from 'react';

type StageId = 'new' | 'contacted' | 'qualified' | 'quotation' | 'won' | 'lost';

type Lead = {
  id: string;
  customerName: string;
  vehicle: string;
  budget: string;
  stage: StageId;
  lastActivity: string;
  source?: string;
  tags?: string[];
  advisor?: string;
  avatarColor?: string;
};

const stages: { id: StageId; label: string; count: number; pastelClass: string; borderColor: string }[] = [
  { id: 'new', label: 'New', count: 2, pastelClass: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'contacted', label: 'Contacted', count: 1, pastelClass: 'bg-purple-50', borderColor: 'border-purple-200' },
  { id: 'qualified', label: 'Qualified', count: 1, pastelClass: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'quotation', label: 'Quotation', count: 1, pastelClass: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: 'won', label: 'Won', count: 1, pastelClass: 'bg-green-50', borderColor: 'border-green-200' },
  { id: 'lost', label: 'Lost', count: 0, pastelClass: 'bg-rose-50', borderColor: 'border-rose-200' },
];

const leads: Lead[] = [
  {
    id: '1',
    customerName: 'John Mwangi',
    vehicle: 'Toyota Mark X',
    budget: 'Ksh 45,000',
    stage: 'new',
    lastActivity: '2 hours ago',
    source: 'Facebook Lead',
    tags: ['Sedan', 'Follow-up'],
    avatarColor: 'bg-blue-100 text-blue-600',
  },
  {
    id: '2',
    customerName: 'Sarah Omondi',
    vehicle: 'Honda Fit',
    budget: 'Ksh 25,000',
    stage: 'new',
    lastActivity: 'Just now',
    source: 'Website',
    tags: ['Hatchback'],
    avatarColor: 'bg-purple-100 text-purple-600',
  },
  {
    id: '3',
    customerName: 'David Kimani',
    vehicle: 'Toyota Premio',
    budget: 'Ksh 35,000',
    stage: 'contacted',
    lastActivity: '5 hours ago',
    source: 'Walk-in',
    avatarColor: 'bg-amber-100 text-amber-600',
  },
  {
    id: '4',
    customerName: 'Mercy Wanjiru',
    vehicle: 'Subaru Forester',
    budget: 'Ksh 30,000',
    stage: 'qualified',
    lastActivity: '1 day ago',
    source: 'Referral',
    tags: ['High Intent', 'SUV'],
    avatarColor: 'bg-green-100 text-green-600',
  },
  {
    id: '5',
    customerName: 'Ali Hussein',
    vehicle: 'Mazda Demio',
    budget: 'Ksh 650,000',
    stage: 'quotation',
    lastActivity: '3 days ago',
    source: 'Website',
    tags: ['Quote #7890'],
    avatarColor: 'bg-orange-100 text-orange-600',
  },
  {
    id: '6',
    customerName: 'Peter Otieno',
    vehicle: 'Mitsubishi Outlander',
    budget: 'Ksh 1,200,000',
    stage: 'won',
    lastActivity: '4 days ago',
    source: 'Showroom',
    tags: ['Paid', 'Delivered'],
    avatarColor: 'bg-emerald-100 text-emerald-600',
  },
];

function OpportunitiesContent() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/30">
      <div className="p-4 md:p-6">
        <div className="mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Opportunities</h1>
              <p className="text-gray-500 text-sm mt-1">Track and manage your leads through the sales pipeline</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full md:w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
                  <CalendarDays className="h-4 w-4" />
                  Today
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-sm transition-all">
                  <Plus className="h-4 w-4" />
                  New Lead
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-600">
              Sort: Stage
            </div>
            <div className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-600">
              Owner: All
            </div>
            <div className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-600">
              Status: Active
            </div>
            <div className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-600">
              Source: All
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-6">
        <div className="kanban-container">
          <div className="flex gap-4 md:gap-6 pb-4 min-w-max">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={leads.filter((l) => l.stage === stage.id)}
              />
            ))}
            <div className="flex-shrink-0 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  stage,
  leads,
}: {
  stage: (typeof stages)[number];
  leads: Lead[];
}) {
  const getStageColor = (stageId: StageId) => {
    switch (stageId) {
      case 'new': return 'from-blue-400 to-blue-500';
      case 'contacted': return 'from-purple-400 to-purple-500';
      case 'qualified': return 'from-amber-400 to-amber-500';
      case 'quotation': return 'from-orange-400 to-orange-500';
      case 'won': return 'from-green-400 to-green-500';
      case 'lost': return 'from-rose-400 to-rose-500';
    }
  };

  return (
    <div className={`flex-shrink-0 w-72 md:w-80 flex flex-col rounded-2xl ${stage.pastelClass} border ${stage.borderColor} p-4 h-[calc(100vh-280px)] min-h-[500px]`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${getStageColor(stage.id)}`} />
          <h3 className="font-semibold text-gray-800">{stage.label}</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-600">
            {leads.length}
          </span>
        </div>
        <button className="p-1 hover:bg-white/50 rounded-lg transition-colors">
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <button className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/50 py-2.5 text-sm text-gray-500 hover:bg-white hover:border-gray-400 transition-colors">
        <Plus className="h-4 w-4" />
        Add Lead
      </button>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No leads in this stage</div>
            <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
              + Add first lead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const getStageColor = (stage: StageId) => {
    switch (stage) {
      case 'new': return 'bg-gradient-to-r from-blue-400 to-blue-500';
      case 'contacted': return 'bg-gradient-to-r from-purple-400 to-purple-500';
      case 'qualified': return 'bg-gradient-to-r from-amber-400 to-amber-500';
      case 'quotation': return 'bg-gradient-to-r from-orange-400 to-orange-500';
      case 'won': return 'bg-gradient-to-r from-green-400 to-green-500';
      case 'lost': return 'bg-gradient-to-r from-rose-400 to-rose-500';
    }
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${lead.avatarColor || 'bg-gray-100 text-gray-600'}`}>
            {lead.customerName.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">{lead.customerName}</h4>
            <p className="text-gray-500 text-xs">{lead.vehicle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${getStageColor(lead.stage)}`} />
          <span className="text-xs font-medium text-gray-700">{lead.budget}</span>
        </div>
      </div>
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-lg bg-gray-50 text-gray-600 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <span className="font-medium">Last activity:</span> {lead.lastActivity}
          {lead.source && (
            <span className="ml-2">• Source: {lead.source}</span>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-green-50 rounded-lg text-green-500 transition-colors">
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <ProtectedRoute>
      <OpportunitiesContent />
    </ProtectedRoute>
  );
}