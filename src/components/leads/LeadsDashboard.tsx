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
      await leadService.deleteLead(leadId);
      showToast('Lead deleted successfully', 'success');
      fetchLeads(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete lead:', error);
      showToast('Failed to delete lead', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Leads Management</h1>
              <p className="text-blue-100 mt-1">Manage and track your potential customers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/leads/create')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Lead
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <LeadStats stats={stats} />

      {/* Filters Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-6">
        <LeadFilters 
          filters={filters} 
          onFilterChange={setFilters}
          onApply={fetchLeads}
        />
      </div>

      {/* Leads List Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-purple-50/20">
          <h2 className="text-lg font-semibold text-gray-800">Leads List</h2>
          <p className="text-sm text-gray-600 mt-1">Recent leads and their status</p>
        </div>
        <LeadList 
          leads={leads} 
          loading={loading} 
          onDelete={handleDelete}
          onRefresh={fetchLeads}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => router.push('/leads/create')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow"
        >
          <Plus className="h-4 w-4" />
          Add New Lead
        </button>
        
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 rounded-lg font-medium hover:bg-white transition-colors">
          <Download className="h-4 w-4" />
          Export to CSV
        </button>
      </div>
    </div>
  );
}