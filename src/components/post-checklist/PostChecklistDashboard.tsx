'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  BarChart3,
  Calendar,
  User,
  Car,
  Wrench,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Loader2,
  ThumbsUp,
  ShieldCheck,
  Award
} from 'lucide-react';
import { postChecklistService, PostChecklist, ChecklistItemStatus } from '@/services/postChecklistService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

export default function PostChecklistDashboard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [checklists, setChecklists] = useState<PostChecklist[]>([]);
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
    avgCompletion: 0,
    needsAttention: 0
  });

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const data = await postChecklistService.getAllPostChecklists();
      setChecklists(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading post-checklists:', error);
      showToast('Failed to load post-checklists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (checklists: PostChecklist[]) => {
    const total = checklists.length;
    const approved = checklists.filter(c => c.approved).length;
    const pending = total - approved;
    const needsAttention = checklists.filter(c => 
      c.overallCondition === 'needs_attention'
    ).length;
    
    let totalCompletion = 0;
    for (const checklist of checklists) {
      try {
        const stats = await postChecklistService.getChecklistCompletionRate(checklist._id);
        totalCompletion += stats.completionPercentage;
      } catch (error) {
        console.error('Error calculating completion for checklist:', checklist._id, error);
      }
    }
    
    const avgCompletion = total > 0 ? Math.round(totalCompletion / total) : 0;

    setStats({ total, approved, pending, avgCompletion, needsAttention });
  };

  const filteredChecklists = checklists.filter(checklist => {
    if (filterStatus === 'approved' && !checklist.approved) return false;
    if (filterStatus === 'pending' && checklist.approved) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        checklist.notes?.toLowerCase().includes(searchLower) ||
        checklist.recommendations?.toLowerCase().includes(searchLower) ||
        checklist.inspectionItems.some(item => 
          item.item.toLowerCase().includes(searchLower) ||
          item.remarks?.toLowerCase().includes(searchLower)
        ) ||
        (typeof checklist.vehicleId === 'object' && (
          checklist.vehicleId.licensePlate?.toLowerCase().includes(searchLower) ||
          checklist.vehicleId.make?.toLowerCase().includes(searchLower) ||
          checklist.vehicleId.model?.toLowerCase().includes(searchLower)
        )) ||
        (typeof checklist.jobCardId === 'object' && (
          checklist.jobCardId.jobTitle?.toLowerCase().includes(searchLower)
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
    if (!confirm('Are you sure you want to delete this post-checklist?')) return;

    try {
      await postChecklistService.deletePostChecklist(id);
      showToast('Post-checklist deleted successfully', 'success');
      loadChecklists();
    } catch (error) {
      console.error('Error deleting post-checklist:', error);
      showToast('Failed to delete post-checklist', 'error');
    }
  };

  const handleApproveChecklist = async (id: string) => {
    try {
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      await postChecklistService.approvePostChecklist(id, approvedBy);
      showToast('Post-checklist approved successfully', 'success');
      loadChecklists();
    } catch (error) {
      console.error('Error approving post-checklist:', error);
      showToast('Failed to approve post-checklist', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedChecklists.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedChecklists.length} selected post-checklist(s)?`)) return;

    try {
      const deletePromises = selectedChecklists.map(id => 
        postChecklistService.deletePostChecklist(id)
      );
      await Promise.all(deletePromises);
      showToast(`${selectedChecklists.length} post-checklist(s) deleted successfully`, 'success');
      setSelectedChecklists([]);
      loadChecklists();
    } catch (error) {
      console.error('Error bulk deleting post-checklists:', error);
      showToast('Failed to delete selected post-checklists', 'error');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedChecklists.length === 0) return;
    if (!confirm(`Are you sure you want to approve ${selectedChecklists.length} selected post-checklist(s)?`)) return;

    try {
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      const approvePromises = selectedChecklists.map(id => 
        postChecklistService.approvePostChecklist(id, approvedBy)
      );
      await Promise.all(approvePromises);
      showToast(`${selectedChecklists.length} post-checklist(s) approved successfully`, 'success');
      setSelectedChecklists([]);
      loadChecklists();
    } catch (error) {
      console.error('Error bulk approving post-checklists:', error);
      showToast('Failed to approve selected post-checklists', 'error');
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getStatusBadge = (approved: boolean) => {
    return approved ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
        <Award className="w-3 h-3 mr-1" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const getConditionBadge = (condition?: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      excellent: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        label: 'Excellent'
      },
      satisfactory: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Satisfactory'
      },
      needs_attention: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Needs Attention'
      },
      poor: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Poor'
      }
    };

    const configItem = config[condition || ''] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Not Rated'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${configItem.bg} ${configItem.text}`}>
        {configItem.label}
      </span>
    );
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
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
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
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Post-Service Checklists</h1>
              <p className="text-blue-100 text-sm">Manage post-service quality inspections</p>
            </div>
          </div>

          <Link
            href="/post-checklist/create"
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
            { label: 'Total Checklists', value: stats.total, icon: ClipboardList, color: 'text-teal-600' },
            { label: 'Approved', value: stats.approved, icon: Award, color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
            { label: 'Needs Attention', value: stats.needsAttention, icon: AlertTriangle, color: 'text-red-600' },
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

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search checklists, notes, or vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
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
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Award className="h-4 w-4" />
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
              <ClipboardList className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No Post-Checklists Found</h3>
              <p className="text-gray-600 text-sm mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No checklists match your search criteria.'
                  : 'Create your first post-service checklist to get started.'}
              </p>
              <Link
                href="/post-checklist/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
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
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Checklist
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle & Job
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
                      Status & Condition
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredChecklists.map((checklist) => {
                    const isExpanded = expandedChecklist === checklist._id;
                    const vehicleInfo = typeof checklist.vehicleId === 'object' ? checklist.vehicleId : null;
                    const jobCardInfo = typeof checklist.jobCardId === 'object' ? checklist.jobCardId : null;
                    const completedItems = checklist.inspectionItems.filter(i => i.status === ChecklistItemStatus.COMPLETED).length;
                    const completionPercentage = checklist.inspectionItems.length > 0
                      ? Math.round((completedItems / checklist.inspectionItems.length) * 100)
                      : 0;

                    return (
                      <>
                        <tr key={checklist._id} className={`hover:bg-gray-50 ${checklist.approved ? 'bg-emerald-50/20' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedChecklists.includes(checklist._id)}
                              onChange={() => handleSelectChecklist(checklist._id)}
                              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              disabled={checklist.approved}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                                {checklist.approved && (
                                  <Award className="h-3.5 w-3.5 text-emerald-500" />
                                )}
                                Post-Service #{checklist._id.slice(-6)}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {checklist.notes?.substring(0, 50) || 'No notes'}
                                {checklist.notes && checklist.notes.length > 50 && '...'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1 text-sm">
                              <div className="font-medium text-gray-900">
                                {vehicleInfo?.make} {vehicleInfo?.model}
                                {vehicleInfo?.licensePlate && ` (${vehicleInfo.licensePlate})`}
                              </div>
                              {jobCardInfo && (
                                <div className="text-xs text-gray-500">
                                  {jobCardInfo.jobTitle || 'Job Card'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{formatDate(checklist.createdAt as string)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {typeof checklist.inspectedBy === 'object' 
                                ? `${checklist.inspectedBy.firstName?.charAt(0)}. ${checklist.inspectedBy.lastName}`
                                : 'Inspector'
                              }
                            </div>
                            {checklist.approved && checklist.approvedAt && (
                              <div className="text-xs text-emerald-600 mt-0.5">
                                ✓ Approved {formatDate(checklist.approvedAt as string)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(checklist.approved)}
                              {getConditionBadge(checklist.overallCondition)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full max-w-[120px]">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span className="font-medium">{completionPercentage}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    checklist.approved ? 'bg-emerald-500' : 'bg-teal-500'
                                  }`}
                                  style={{ width: `${completionPercentage}%` }}
                                />
                              </div>
                              {checklist.approved && completionPercentage === 100 && (
                                <div className="text-xs text-emerald-600 mt-0.5 text-center">
                                  ✓ Verified
                                </div>
                              )}
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
                                href={`/post-checklist/${checklist._id}`}
                                className="p-1.5 rounded hover:bg-gray-100"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5 text-teal-600" />
                              </Link>
                              {!checklist.approved ? (
                                <button
                                  onClick={() => handleApproveChecklist(checklist._id)}
                                  className="p-1.5 rounded hover:bg-emerald-100"
                                  title="Approve"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                                </button>
                              ) : (
                                <div className="p-1.5 text-emerald-600" title="Approved and locked">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <button
                                onClick={() => handleDeleteChecklist(checklist._id)}
                                className="p-1.5 rounded hover:bg-red-100"
                                title="Delete"
                                disabled={checklist.approved}
                              >
                                <Trash2 className={`h-3.5 w-3.5 ${checklist.approved ? 'text-gray-400' : 'text-red-600'}`} />
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
                                  <h4 className="font-medium text-gray-900 mb-2">Inspection Summary</h4>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total Items:</span>
                                      <span className="font-medium">{checklist.inspectionItems.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Completed:</span>
                                      <span className={`font-medium ${checklist.approved ? 'text-emerald-600' : 'text-green-600'}`}>
                                        {completedItems}
                                        {checklist.approved && ' ✓ Verified'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Incomplete:</span>
                                      <span className="font-medium text-yellow-600">
                                        {checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.INCOMPLETE).length}
                                      </span>
                                    </div>
                                  </div>
                                  {checklist.approved && (
                                    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded">
                                      <div className="flex items-center gap-1.5 text-emerald-800 text-xs">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        <span>This checklist is approved and locked</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                                  <div className="space-y-1">
                                    {vehicleInfo && (
                                      <div>Vehicle: {vehicleInfo.make} {vehicleInfo.model}</div>
                                    )}
                                    {jobCardInfo && (
                                      <div>Job: {jobCardInfo.jobTitle || 'N/A'}</div>
                                    )}
                                    {checklist.approvedBy && (
                                      <div className="text-emerald-700">
                                        Approved by: {typeof checklist.approvedBy === 'object' 
                                          ? `${checklist.approvedBy.firstName} ${checklist.approvedBy.lastName}`
                                          : checklist.approvedBy}
                                      </div>
                                    )}
                                    {checklist.approvedAt && (
                                      <div className="text-emerald-700">
                                        Approved on: {formatDateTime(checklist.approvedAt as string)}
                                      </div>
                                    )}
                                    {checklist.recommendations && (
                                      <div className="mt-2">
                                        <span className="font-medium">Recommendations:</span>
                                        <div className="text-gray-600">{checklist.recommendations.substring(0, 100)}...</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                                  <div className="space-y-2">
                                    {!checklist.approved && (
                                      <Link
                                        href={`/post-checklist/${checklist._id}/edit`}
                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                        Edit Checklist
                                      </Link>
                                    )}
                                    <Link
                                      href={`/post-checklist/${checklist._id}`}
                                      className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Full Details
                                    </Link>
                                    {jobCardInfo && (
                                      <Link
                                        href={`/jobcards/${jobCardInfo._id}`}
                                        className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800"
                                      >
                                        <Wrench className="h-3.5 w-3.5" />
                                        View Job Card
                                      </Link>
                                    )}
                                    {checklist.approved && (
                                      <div className="text-xs text-emerald-600 p-1.5 bg-emerald-50 rounded">
                                        ✓ Approved checklist is ready for customer delivery
                                      </div>
                                    )}
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