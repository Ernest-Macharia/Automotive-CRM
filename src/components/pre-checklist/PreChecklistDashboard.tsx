'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  PlusCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  BarChart3,
  Calendar,
  User,
  Car,
  Tag,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { preChecklistService, PreChecklist } from '@/services/preChecklistService';
import { postChecklistService, PostChecklist } from '@/services/postChecklistService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

export default function PreChecklistDashboard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [checklists, setChecklists] = useState<PreChecklist[]>([]);
  const [postChecklists, setPostChecklists] = useState<PostChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formsPanelFilter, setFormsPanelFilter] = useState<'all' | 'pre' | 'post'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [sortField, setSortField] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedChecklists, setSelectedChecklists] = useState<string[]>([]);
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    withFaults: 0,
    avgCompletion: 0
  });

  const getActionErrorMessage = (error: unknown, fallback: string): string => {
    const raw = String((error as any)?.message || '').trim();
    if (!raw) return fallback;

    const withoutPrefix = raw.replace(/^API Error \(\d{3}\):\s*/i, '').trim();
    if (!withoutPrefix) return fallback;

    if (withoutPrefix.startsWith('{')) {
      try {
        const parsed = JSON.parse(withoutPrefix);
        const parsedMessage = parsed?.message || parsed?.error;
        if (parsedMessage) {
          return String(parsedMessage);
        }
      } catch {
        // Keep normalized text.
      }
    }

    return withoutPrefix;
  };

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const [preResult, postResult] = await Promise.allSettled([
        preChecklistService.getAllPreChecklists(),
        postChecklistService.getAllPostChecklists(),
      ]);

      if (preResult.status === 'fulfilled') {
        setChecklists(preResult.value);
        calculateStats(preResult.value);
      } else {
        console.error('Error loading pre-checklists:', preResult.reason);
        showToast('Failed to load pre-checklists', 'error');
        setChecklists([]);
        calculateStats([]);
      }

      if (postResult.status === 'fulfilled') {
        setPostChecklists(postResult.value);
      } else {
        console.error('Error loading post-checklists:', postResult.reason);
        setPostChecklists([]);
      }
    } catch (error) {
      console.error('Error loading checklist forms:', error);
      showToast('Failed to load checklist forms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (checklists: PreChecklist[]) => {
    const total = checklists.length;
    const approved = checklists.filter(c => c.approved).length;
    const pending = total - approved;
    const withFaults = checklists.filter(c => 
      c.inspectionItems.some(item => item.status === 'fault')
    ).length;
    
    let totalCompletion = 0;
    checklists.forEach(checklist => {
      const okItems = checklist.inspectionItems.filter(item => item.status === 'ok').length;
      const completion = checklist.inspectionItems.length > 0 
        ? (okItems / checklist.inspectionItems.length) * 100 
        : 0;
      totalCompletion += completion;
    });
    const avgCompletion = total > 0 ? Math.round(totalCompletion / total) : 0;

    setStats({ total, approved, pending, withFaults, avgCompletion });
  };

  const filteredChecklists = checklists.filter(checklist => {
    if (filterStatus === 'approved' && !checklist.approved) return false;
    if (filterStatus === 'pending' && checklist.approved) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        checklist.remarks?.toLowerCase().includes(searchLower) ||
        (Array.isArray(checklist.tags) && checklist.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        checklist.inspectionItems.some(item => 
          item.item.toLowerCase().includes(searchLower) ||
          item.remarks?.toLowerCase().includes(searchLower)
        ) ||
        (typeof checklist.vehicleId === 'object' && (
          checklist.vehicleId.registrationNumber?.toLowerCase().includes(searchLower) ||
          checklist.vehicleId.make?.toLowerCase().includes(searchLower) ||
          checklist.vehicleId.model?.toLowerCase().includes(searchLower)
        )) ||
        (typeof checklist.opportunityId === 'object' && (
          checklist.opportunityId.subject?.toLowerCase().includes(searchLower) ||
          checklist.opportunityId.customer?.name?.toLowerCase().includes(searchLower)
        ));
      
      if (!matchesSearch) return false;
    }

    return true;
  }).sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (!aValue || !bValue) return 0;
    
    const aDate = new Date(aValue as string).getTime();
    const bDate = new Date(bValue as string).getTime();
    
    return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
  });

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pre-checklist?')) return;

    try {
      await preChecklistService.deletePreChecklist(id);
      showToast('Pre-checklist deleted successfully', 'success');
      loadChecklists();
    } catch (error) {
      console.error('Error deleting pre-checklist:', error);
      showToast(getActionErrorMessage(error, 'Failed to delete pre-checklist'), 'error');
    }
  };

  const handleApproveChecklist = async (id: string) => {
    try {
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      await preChecklistService.approvePreChecklist(id, approvedBy);
      showToast('Pre-checklist approved successfully', 'success');
      loadChecklists();
    } catch (error) {
      console.error('Error approving pre-checklist:', error);
      showToast('Failed to approve pre-checklist', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedChecklists.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedChecklists.length} selected pre-checklist(s)?`)) return;

    try {
      const deletePromises = selectedChecklists.map(id => 
        preChecklistService.deletePreChecklist(id)
      );
      await Promise.all(deletePromises);
      showToast(`${selectedChecklists.length} pre-checklist(s) deleted successfully`, 'success');
      setSelectedChecklists([]);
      loadChecklists();
    } catch (error) {
      console.error('Error bulk deleting pre-checklists:', error);
      showToast(getActionErrorMessage(error, 'Failed to delete selected pre-checklists'), 'error');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedChecklists.length === 0) return;
    if (!confirm(`Are you sure you want to approve ${selectedChecklists.length} selected pre-checklist(s)?`)) return;

    try {
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      const approvePromises = selectedChecklists.map(id => 
        preChecklistService.approvePreChecklist(id, approvedBy)
      );
      await Promise.all(approvePromises);
      showToast(`${selectedChecklists.length} pre-checklist(s) approved successfully`, 'success');
      setSelectedChecklists([]);
      loadChecklists();
    } catch (error) {
      console.error('Error bulk approving pre-checklists:', error);
      showToast('Failed to approve selected pre-checklists', 'error');
    }
  };

  const handleSelectAll = () => {
    if (selectedChecklists.length === filteredChecklists.length) {
      setSelectedChecklists([]);
    } else {
      setSelectedChecklists(filteredChecklists.map(c => c._id));
    }
  };

  const handleSelectChecklist = (id: string) => {
    setSelectedChecklists(prev =>
      prev.includes(id)
        ? prev.filter(checklistId => checklistId !== id)
        : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const resolveEntityName = (value: unknown, fallback = 'Unlinked customer') => {
    if (!value || typeof value !== 'object') return fallback;
    const entity = value as any;
    return entity.customer?.name || entity.subject || entity.name || fallback;
  };

  const resolveVehicleLabel = (value: unknown, fallback = 'No vehicle') => {
    if (!value || typeof value !== 'object') return fallback;
    const entity = value as any;
    const plate = entity.registrationNumber || entity.licensePlate || entity.regNo;
    const model = [entity.make, entity.model].filter(Boolean).join(' ');
    return [model, plate && `(${plate})`].filter(Boolean).join(' ') || fallback;
  };

  const createdForms = [
    ...checklists.map((checklist) => ({
      id: checklist._id,
      type: 'pre' as const,
      label: 'Pre-Checklist',
      title:
        `${checklist.customerDetails?.firstName || ''} ${checklist.customerDetails?.lastName || ''}`.trim() ||
        resolveEntityName(checklist.opportunityId),
      vehicle:
        [checklist.carDetails?.carMake, checklist.carDetails?.carModel, checklist.carDetails?.licensePlate && `(${checklist.carDetails.licensePlate})`]
          .filter(Boolean)
          .join(' ') || resolveVehicleLabel(checklist.vehicleId),
      createdAt: checklist.createdAt || checklist.updatedAt || '',
      approved: Boolean(checklist.approved),
      href: `/pre-checklist/${checklist._id}`,
    })),
    ...postChecklists.map((checklist) => ({
      id: checklist._id,
      type: 'post' as const,
      label: 'Post-Checklist',
      title:
        checklist.customerName ||
        `${checklist.customerDetails?.firstName || ''} ${checklist.customerDetails?.lastName || ''}`.trim() ||
        resolveEntityName(checklist.opportunityId),
      vehicle:
        [checklist.vehicleDetails?.make, checklist.vehicleDetails?.model, checklist.vehicleDetails?.regNo && `(${checklist.vehicleDetails.regNo})`]
          .filter(Boolean)
          .join(' ') || resolveVehicleLabel(checklist.vehicleId),
      createdAt: String(checklist.createdAt || checklist.updatedAt || ''),
      approved: Boolean(checklist.approved),
      href: `/post-checklist/${checklist._id}`,
    })),
  ]
    .filter((form) => formsPanelFilter === 'all' || form.type === formsPanelFilter)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const getStatusBadge = (approved: boolean) => {
    return approved ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const getCompletionPercentage = (checklist: PreChecklist) => {
    const okItems = checklist.inspectionItems.filter(item => item.status === 'ok').length;
    return checklist.inspectionItems.length > 0 
      ? Math.round((okItems / checklist.inspectionItems.length) * 100) 
      : 0;
  };

  const handleSort = (field: 'createdAt' | 'updatedAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Checklist History</h1>
              <p className="text-blue-100 text-sm">Browse all created pre and post service checklists</p>
            </div>
          </div>

          <Link
            href="/pre-checklist/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-lg hover:bg-white/30 transition"
          >
            <PlusCircle className="h-4 w-4" />
            New Checklist
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Checklists', value: stats.total, icon: ClipboardCheck, color: 'text-blue-600' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
            { label: 'With Faults', value: stats.withFaults, icon: AlertCircle, color: 'text-red-600' },
            { label: 'Avg. Completion', value: `${stats.avgCompletion}%`, icon: BarChart3, color: 'text-purple-600' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Created Forms Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">All Created Forms</h2>
              <p className="text-xs text-gray-500">
                {checklists.length + postChecklists.length} form{checklists.length + postChecklists.length === 1 ? '' : 's'} created across pre and post checklists
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'pre', label: 'Pre' },
                { value: 'post', label: 'Post' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormsPanelFilter(option.value as 'all' | 'pre' | 'post')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    formsPanelFilter === option.value
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {createdForms.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No forms have been created yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {createdForms.map((form) => (
                <Link
                  key={`${form.type}-${form.id}`}
                  href={form.href}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                >
                  <div className={`p-2 rounded-lg ${form.type === 'pre' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{form.title}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        form.type === 'pre' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {form.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{form.vehicle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{formatDate(form.createdAt)}</p>
                    <p className={`text-[11px] font-medium ${form.approved ? 'text-green-600' : 'text-yellow-600'}`}>
                      {form.approved ? 'Approved' : 'Pending'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search checklists, vehicles, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-');
                    setSortField(field as 'createdAt' | 'updatedAt');
                    setSortDirection(direction as 'asc' | 'desc');
                  }}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                </select>
              </div>

              <button
                onClick={loadChecklists}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedChecklists.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm font-medium text-gray-700">
                {selectedChecklists.length} checklist{selectedChecklists.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkApprove}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checklists Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredChecklists.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardCheck className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No Pre-Checklists Found</h3>
              <p className="text-gray-600 text-sm mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No checklists match your search criteria.'
                  : 'Create your first pre-service checklist to get started.'}
              </p>
              <Link
                href="/pre-checklist/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4" />
                Create Checklist
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedChecklists.length === filteredChecklists.length && filteredChecklists.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Checklist
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Created
                        {sortField === 'createdAt' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredChecklists.map((checklist) => {
                    const isExpanded = expandedChecklist === checklist._id;
                    const completion = getCompletionPercentage(checklist);
                    const faultItems = checklist.inspectionItems.filter(item => item.status === 'fault');
                    const vehicleInfo = typeof checklist.vehicleId === 'object' ? checklist.vehicleId : null;

                    return (
                      <>
                        <tr key={checklist._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedChecklists.includes(checklist._id)}
                              onChange={() => handleSelectChecklist(checklist._id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                Pre-Service #{checklist._id.slice(-6)}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {checklist.remarks?.substring(0, 50) || 'No remarks'}
                                {checklist.remarks && checklist.remarks.length > 50 && '...'}
                              </div>
                              {Array.isArray(checklist.tags) && checklist.tags.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {checklist.tags.slice(0, 4).map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700"
                                    >
                                      <Tag className="h-3 w-3" />
                                      {tag}
                                    </span>
                                  ))}
                                  {checklist.tags.length > 4 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                                      +{checklist.tags.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {vehicleInfo ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {vehicleInfo.make} {vehicleInfo.model}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {vehicleInfo.registrationNumber || 'No plate'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {getStatusBadge(checklist.approved)}
                              {faultItems.length > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {faultItems.length} fault{faultItems.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full max-w-[120px]">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Completion</span>
                                <span className="font-medium">{completion}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    completion === 100 ? 'bg-green-500' :
                                    completion >= 50 ? 'bg-blue-500' :
                                    completion > 0 ? 'bg-yellow-500' :
                                    'bg-gray-300'
                                  }`}
                                  style={{ width: `${completion}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setExpandedChecklist(isExpanded ? null : checklist._id)}
                                className="p-1.5 rounded hover:bg-gray-100"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-gray-600" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
                                )}
                              </button>
                              <Link
                                href={`/pre-checklist/${checklist._id}`}
                                className="p-1.5 rounded hover:bg-gray-100"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-600" />
                              </Link>
                              {!checklist.approved && (
                                <button
                                  onClick={() => handleApproveChecklist(checklist._id)}
                                  className="p-1.5 rounded hover:bg-green-100"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteChecklist(checklist._id)}
                                className="p-1.5 rounded hover:bg-red-100"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total Items:</span>
                                      <span className="font-medium">{checklist.inspectionItems.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">OK Items:</span>
                                      <span className="font-medium text-green-600">
                                        {checklist.inspectionItems.filter(item => item.status === 'ok').length}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Fault Items:</span>
                                      <span className="font-medium text-red-600">{faultItems.length}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Vehicle Details</h4>
                                  {vehicleInfo && (
                                    <div className="space-y-1">
                                      {vehicleInfo.registrationNumber && (
                                        <div>Plate: {vehicleInfo.registrationNumber}</div>
                                      )}
                                      {vehicleInfo.make && vehicleInfo.model && (
                                        <div>Model: {vehicleInfo.make} {vehicleInfo.model}</div>
                                      )}
                                      {vehicleInfo.year && (
                                        <div>Year: {vehicleInfo.year}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                                  <div className="space-y-2">
                                    <Link
                                      href={`/pre-checklist/${checklist._id}/edit`}
                                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                      Edit Checklist
                                    </Link>
                                    <button
                                      onClick={() => {
                                        // Clone logic can be added here
                                      }}
                                      className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-800"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      Clone Checklist
                                    </button>
                                    <Link
                                      href={`/pre-checklist/${checklist._id}`}
                                      className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-800"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Full Details
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Placeholder */}
          {filteredChecklists.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
              Showing 1–{filteredChecklists.length} of {checklists.length} results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
