'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Plus, Search, Filter, RefreshCw,
  Eye, Edit, Trash2, Clock, CheckCircle,
  AlertTriangle, User, Car, Calendar,
  Loader2, ChevronRight
} from 'lucide-react';
import { jobCardService } from '@/services/jobCardService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

// Skeleton Components
const SkeletonCard = () => (
  <div className="border border-gray-200 rounded-xl bg-white animate-pulse overflow-hidden flex flex-col">
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
          <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
        </div>
      </div>
      
      <div className="h-3 w-full bg-gray-200 rounded mb-4"></div>
      <div className="h-3 w-3/4 bg-gray-200 rounded mb-4"></div>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <div className="h-2 w-12 bg-gray-200 rounded"></div>
          <div className="h-2 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="h-1.5 bg-gray-300 rounded-full w-1/2"></div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <div className="px-4 py-3 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
      <div className="h-2 w-12 bg-gray-200 rounded"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export default function JobCardsList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const fetchJobCards = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      
      const response = await jobCardService.getAllJobCards(params);
      setJobCards(response || []);
    } catch (error) {
      console.error('Error fetching job cards:', error);
      showToast('Failed to load job cards', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await jobCardService.getJobCardStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchJobCards(), fetchStats()]);
      showToast('Job cards refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
    fetchStats();
  }, [fetchJobCards, fetchStats]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job card?')) return;
    
    try {
      await jobCardService.deleteJobCard(id);
      showToast('Job card deleted successfully', 'success');
      fetchJobCards();
    } catch (error) {
      console.error('Error deleting job card:', error);
      showToast('Failed to delete job card', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    return jobCardService.getPriorityColor(priority || 'medium');
  };

  const getProgressPercentage = (jobCard: any) => {
    return jobCardService.calculateCompletionPercentage(jobCard);
  };

  const getTechnicianName = (assignedTo: any) => {
    if (!assignedTo) return 'Unassigned';
    if (typeof assignedTo === 'string') return 'Loading...';
    if (assignedTo.firstName && assignedTo.lastName) {
      return `${assignedTo.firstName} ${assignedTo.lastName}`;
    }
    return 'Unassigned';
  };

  const getVehicleInfo = (vehicleId: any) => {
    if (!vehicleId) return 'No vehicle';
    if (typeof vehicleId === 'string') return 'Loading vehicle...';
    if (vehicleId.registrationNumber && vehicleId.make && vehicleId.model) {
      return `${vehicleId.make} ${vehicleId.model} (${vehicleId.registrationNumber})`;
    }
    return 'Vehicle info loading...';
  };

  const getCustomerInfo = (opportunityId: any) => {
    if (!opportunityId) return 'No customer';
    if (typeof opportunityId === 'string') return 'Loading customer...';
    if (opportunityId.customer?.name) {
      return opportunityId.customer.name;
    }
    return 'Customer info loading...';
  };

  const getPriorityText = (priority: any) => {
    if (!priority) return 'MEDIUM';
    return priority.toUpperCase();
  };

  const getStatusText = (status: any) => {
    if (!status) return 'PENDING';
    return status.toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Job Cards</h1>
              <p className="text-blue-100 text-sm">Manage work orders and service tasks</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 text-white" />
              )}
            </button>
            <Link
              href="/job-cards/create"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Job Card</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Stats Cards */}
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl p-4 border animate-pulse bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-24 bg-blue-200 rounded mb-2"></div>
                      <div className="h-8 w-16 bg-blue-300 rounded"></div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-200">
                      <div className="h-6 w-6 bg-blue-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Total Job Cards</p>
                    <p className="text-2xl font-bold text-green-800">{stats.total || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <Wrench className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">In Progress</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {stats.byStatus?.find((s: any) => s._id === 'in_progress')?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-700">Completed Today</p>
                    <p className="text-2xl font-bold text-teal-800">
                      {stats.todayCompleted || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-500/20">
                    <CheckCircle className="h-8 w-8 text-teal-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">On Hold</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {stats.byStatus?.find((s: any) => s._id === 'on_hold')?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-yellow-500/20">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Filters - Fixed */}
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/30 to-blue-50/30 flex-shrink-0">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="w-full md:max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search job cards..."
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white shadow-sm"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white shadow-sm"
                      disabled={loading}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  
                  <div className="relative">
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white shadow-sm"
                      disabled={loading}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Cards List - Scrollable */}
            <div className="p-4 md:p-6 flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : jobCards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-5">
                    <Wrench className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No job cards found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try changing your search or filters'
                      : 'Create your first job card to track service work and technician assignments.'}
                  </p>
                  <Link
                    href="/job-cards/create"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium inline-flex items-center gap-2 shadow-md transition-shadow"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Job Card
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {jobCards.map((jobCard) => (
                    <div 
                      key={jobCard._id} 
                      className="border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-gray-800 text-base truncate">{jobCard.jobTitle || 'Untitled Job'}</h3>
                          <div className="flex gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(jobCard.status)}`}>
                              {getStatusText(jobCard.status)}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(jobCard.priority)}`}>
                              {getPriorityText(jobCard.priority)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {jobCard.jobDescription || 'No description provided'}
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{getProgressPercentage(jobCard)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                              style={{ width: `${getProgressPercentage(jobCard)}%` }}
                            />
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="space-y-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5" />
                            <span className="truncate">{getVehicleInfo(jobCard.vehicleId)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>{getTechnicianName(jobCard.assignedTo)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(jobCard.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer – Actions */}
                      <div className="px-4 py-3 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          #{jobCard.jobNumber || 'N/A'}
                        </span>
                        <div className="flex gap-2">
                          <Link
                            href={`/job-cards/${jobCard._id}`}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/job-cards/${jobCard._id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(jobCard._id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          {!statsLoading && stats?.byStatus && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Job Card Status Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {stats.byStatus.map((status: any) => (
                  <div
                    key={status._id}
                    className="p-3 rounded-xl bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${
                        status._id === 'completed' ? 'bg-green-400' :
                        status._id === 'in_progress' ? 'bg-blue-400' :
                        status._id === 'on_hold' ? 'bg-yellow-400' :
                        status._id === 'cancelled' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {status._id.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">{status.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}