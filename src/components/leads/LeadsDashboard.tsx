'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, Sparkles } from 'lucide-react';
import { leadService, Lead, LeadsResponse } from '@/services/leadService';
import LeadStats from './LeadStats';
import LeadFilters from './LeadFilters';
import LeadList from './LeadList';
import { useToast } from '@/contexts/ToastContext';

interface LeadsDashboardProps {
  initialLeads?: Lead[];
  initialStats?: any;
}

export default function LeadsDashboard({ 
  initialLeads = [], 
  initialStats = null 
}: LeadsDashboardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(!initialLeads.length);
  const [stats, setStats] = useState<any>(initialStats);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    type: '',
    lisStatus: '',
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response: LeadsResponse = await leadService.getAllLeads({
        ...filters,
        limit: 50,
        sort: 'createdAt:desc'
      });
      
      setLeads(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      showToast('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await leadService.getLeadStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    if (!initialLeads.length) {
      fetchLeads();
    }
    if (!initialStats) {
      fetchStats();
    }
  }, [filters]);

  const handleDelete = async (leadId: string, leadName: string) => {
    if (!confirm(`Are you sure you want to delete lead "${leadName}"?`)) {
      return;
    }
    
    try {
      const response = await leadService.deleteLead(leadId);
      showToast(response.message || 'Lead deleted successfully', 'success');
      fetchLeads();
    } catch (error) {
      console.error('Failed to delete lead:', error);
      showToast('Failed to delete lead', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compact Header - Same height as MAG CRM sidebar header */}
      <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Leads Management</h1>
            <p className="text-blue-100 text-xs">Manage and track your potential customers</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/leads/create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-white/90 transition-all shadow-sm text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Lead
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Stats Cards with Skeletal Loading */}
          {loading && !stats ? (
            <LeadStatsSkeleton />
          ) : (
            <LeadStats stats={stats} />
          )}

          {/* Filters Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg p-4 md:p-6">
            <LeadFilters 
              filters={filters} 
              onFilterChange={setFilters}
              onApply={fetchLeads}
            />
          </div>

          {/* Leads List Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-purple-50/20">
              <h2 className="text-base md:text-lg font-semibold text-gray-800">Leads List</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">Recent leads and their status</p>
            </div>
            <LeadList 
              leads={leads} 
              loading={loading} 
              onDelete={handleDelete}
              onRefresh={fetchLeads}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 md:gap-4">
            <button
              onClick={() => router.push('/leads/create')}
              className="inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow text-sm md:text-base"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Add New Lead
            </button>
            
            <button className="inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-3 bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 rounded-lg font-medium hover:bg-white transition-colors text-sm md:text-base">
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Export to CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeletal Loading Components
function LeadStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded-full w-24 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}