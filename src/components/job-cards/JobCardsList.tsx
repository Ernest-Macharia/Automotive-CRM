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

// --- Zoho-style Skeleton ---
const SkeletonCard = () => (
  <div className="border border-gray-200 rounded-xl bg-white animate-pulse overflow-hidden flex flex-col shadow-sm">
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
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

    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
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
      const response = await jobCardService.getAllJobCards();
      let filteredCards = response || [];
      
      if (searchTerm) {
        filteredCards = filteredCards.filter(jobCard => 
          jobCard.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jobCard.jobDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jobCard.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter !== 'all') {
        filteredCards = filteredCards.filter(jobCard => jobCard.status === statusFilter);
      }
      
      if (priorityFilter !== 'all') {
        filteredCards = filteredCards.filter(jobCard => jobCard.priority === priorityFilter);
      }
      
      setJobCards(filteredCards);
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    if (assignedTo.name) return assignedTo.name;
    if (assignedTo.firstName && assignedTo.lastName) return `${assignedTo.firstName} ${assignedTo.lastName}`;
    if (assignedTo.email) return assignedTo.email;
    return 'Unassigned';
  };

  const getVehicleInfo = (vehicleId: any) => {
    if (!vehicleId) return 'No vehicle';
    if (typeof vehicleId === 'string') return 'Loading vehicle...';
    if (vehicleId.registrationNumber && vehicleId.make && vehicleId.model) {
      return `${vehicleId.make} ${vehicleId.model} (${vehicleId.registrationNumber})`;
    }
    if (vehicleId.registrationNumber) return vehicleId.registrationNumber;
    return 'Vehicle info loading...';
  };

  const getCustomerInfo = (opportunityId: any) => {
    if (!opportunityId) return 'No customer';
    if (typeof opportunityId === 'string') return 'Loading customer...';
    if (opportunityId.customer?.name) return opportunityId.customer.name;
    if (opportunityId.companyName) return opportunityId.companyName;
    if (opportunityId.subject) return opportunityId.subject;
    return 'Customer info loading...';
  };

  const getPriorityText = (priority: any) => (priority ? priority.toUpperCase() : 'MEDIUM');
  const getStatusText = (status: any) => (status ? status.toUpperCase() : 'PENDING');

  // --- Zoho Color Palette ---
  const zohoBlue = '#2563eb';
  const zohoBlueLight = '#dbeafe';
  const zohoGreen = '#10b981';
  const zohoYellow = '#f59e0b';
  const zohoRed = '#ef4444';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header - Zoho Style */}
      <div 
        className="h-16 flex items-center px-6 flex-shrink-0"
        style={{ backgroundColor: zohoBlue }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Job Cards</h1>
              <p className="text-blue-100 text-xs">Manage work orders and service tasks</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-60"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/job-cards/create"
              className="px-3 py-1.5 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Job Card</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards - Zoho Inspired */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl p-4 border bg-white border-gray-200 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Job Cards', value: stats.total || 0, icon: Wrench, color: zohoBlue },
              { label: 'In Progress', value: stats.byStatus?.find((s: any) => s._id === 'in_progress')?.count || 0, icon: Clock, color: '#3b82f6' },
              { label: 'Completed Today', value: stats.todayCompleted || 0, icon: CheckCircle, color: zohoGreen },
              { label: 'On Hold', value: stats.byStatus?.find((s: any) => s._id === 'on_hold')?.count || 0, icon: AlertTriangle, color: zohoYellow },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-xl font-bold text-gray-800">{item.value}</p>
                  </div>
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters & Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search job cards..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <AlertTriangle className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Job Cards Grid */}
          <div className="p-4 md:p-5">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : jobCards.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">No job cards found</h3>
                <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Create your first job card to track service work.'}
                </p>
                <Link
                  href="/job-cards/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Create New Job Card
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {jobCards.map((jobCard) => (
                  <div 
                    key={jobCard._id} 
                    className="border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">{jobCard.jobTitle || 'Untitled Job'}</h3>
                        <div className="flex gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(jobCard.status)}`}>
                            {getStatusText(jobCard.status)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(jobCard.priority)}`}>
                            {getPriorityText(jobCard.priority)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {jobCard.jobDescription || 'No description'}
                      </p>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{getProgressPercentage(jobCard)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${getProgressPercentage(jobCard)}%`,
                              backgroundColor: zohoBlue
                            }}
                          />
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="space-y-1.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Car className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{getVehicleInfo(jobCard.vehicleId)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span>{getTechnicianName(jobCard.assignedTo)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>{formatDate(jobCard.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                      <span className="text-xs text-gray-500">#{jobCard.jobNumber || 'N/A'}</span>
                      <div className="flex gap-1.5">
                        <Link
                          href={`/job-cards/${jobCard._id}`}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/job-cards/${jobCard._id}/edit`}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(jobCard._id)}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3">Job Card Status Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.byStatus.map((status: any) => {
                let bgColor = 'bg-gray-100';
                if (status._id === 'completed') bgColor = 'bg-green-100';
                else if (status._id === 'in_progress') bgColor = 'bg-blue-100';
                else if (status._id === 'on_hold') bgColor = 'bg-yellow-100';
                else if (status._id === 'cancelled') bgColor = 'bg-red-100';

                return (
                  <div key={status._id} className={`p-3 rounded-lg ${bgColor}`}>
                    <div className="text-xs text-gray-600 capitalize mb-1">
                      {status._id.replace('_', ' ')}
                    </div>
                    <div className="text-lg font-semibold text-gray-800">{status.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}