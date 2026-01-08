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
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { preChecklistService, PreChecklist } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

export default function PreChecklistDashboard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [checklists, setChecklists] = useState<PreChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const data = await preChecklistService.getAllPreChecklists();
      setChecklists(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading pre-checklists:', error);
      showToast('Failed to load pre-checklists', 'error');
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
    
    // Calculate average completion
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
    // Filter by status
    if (filterStatus === 'approved' && !checklist.approved) return false;
    if (filterStatus === 'pending' && checklist.approved) return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        checklist.remarks?.toLowerCase().includes(searchLower) ||
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
      showToast('Failed to delete pre-checklist', 'error');
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
      showToast('Failed to delete selected pre-checklists', 'error');
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

  const getStatusBadge = (approved: boolean) => {
    return approved ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-600 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pre-Service Checklists</h1>
              <p className="text-blue-100">Manage vehicle pre-service inspections</p>
            </div>
          </div>

          <Link
            href="/prechecklists/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm"
          >
            <PlusCircle className="h-5 w-5" />
            New Checklist
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Checklists</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Faults</p>
                <p className="text-2xl font-bold text-red-600">{stats.withFaults}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Completion</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgCompletion}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-8 pb-6">
        <div className="bg-white rounded-xl shadow-md border p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search checklists, vehicles, or remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-');
                    setSortField(field as 'createdAt' | 'updatedAt');
                    setSortDirection(direction as 'asc' | 'desc');
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                </select>
              </div>

              <button
                onClick={loadChecklists}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedChecklists.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedChecklists.length} checklist(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkApprove}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checklists Table */}
      <div className="max-w-7xl mx-auto px-8 pb-8">
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          {filteredChecklists.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pre-Checklists Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No checklists match your search criteria.'
                  : 'No pre-service checklists have been created yet.'}
              </p>
              <Link
                href="/prechecklists/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Create Your First Checklist
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedChecklists.length === filteredChecklists.length && filteredChecklists.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Checklist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Created
                        {sortField === 'createdAt' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <tr key={checklist._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedChecklists.includes(checklist._id)}
                              onChange={() => handleSelectChecklist(checklist._id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                Pre-Service #{checklist._id.slice(-6)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {checklist.remarks?.substring(0, 50) || 'No remarks'}
                                {checklist.remarks && checklist.remarks.length > 50 && '...'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {vehicleInfo ? (
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {vehicleInfo.make} {vehicleInfo.model}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {vehicleInfo.registrationNumber || 'No plate'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">No vehicle info</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{formatDate(checklist.createdAt as string)}</div>
                            <div className="text-xs text-gray-500">
                              {typeof checklist.inspectedBy === 'object' 
                                ? `${checklist.inspectedBy.firstName?.charAt(0)}. ${checklist.inspectedBy.lastName}`
                                : 'System'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(checklist.approved)}
                              {faultItems.length > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {faultItems.length} fault{faultItems.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full max-w-xs">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Completion</span>
                                <span className="font-medium">{completion}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
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
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpandedChecklist(isExpanded ? null : checklist._id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                              <Link
                                href={`/prechecklists/${checklist._id}`}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Link>
                              {!checklist.approved && (
                                <button
                                  onClick={() => handleApproveChecklist(checklist._id)}
                                  className="p-1 hover:bg-green-100 rounded transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteChecklist(checklist._id)}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Summary</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Total Items:</span>
                                      <span className="font-medium">{checklist.inspectionItems.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">OK Items:</span>
                                      <span className="font-medium text-green-600">
                                        {checklist.inspectionItems.filter(item => item.status === 'ok').length}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Fault Items:</span>
                                      <span className="font-medium text-red-600">{faultItems.length}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Vehicle Details</h4>
                                  {vehicleInfo && (
                                    <div className="space-y-1 text-sm">
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
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
                                  <div className="space-y-2">
                                    <Link
                                      href={`/prechecklists/${checklist._id}/edit`}
                                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                      <Edit className="h-3 w-3" />
                                      Edit Checklist
                                    </Link>
                                    <button
                                      onClick={() => {
                                        // Clone logic here
                                      }}
                                      className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                                    >
                                      <FileText className="h-3 w-3" />
                                      Clone Checklist
                                    </button>
                                    <Link
                                      href={`/prechecklists/${checklist._id}`}
                                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
                                    >
                                      <Eye className="h-3 w-3" />
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

          {/* Pagination */}
          {filteredChecklists.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{' '}
                  <span className="font-medium">{filteredChecklists.length}</span> of{' '}
                  <span className="font-medium">{checklists.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}