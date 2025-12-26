'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Plus, Search, Filter, RefreshCw,
  Eye, Edit, Trash2, Clock, CheckCircle,
  AlertTriangle, User, Car, Calendar
} from 'lucide-react';
import { jobCardService } from '@/services/jobCardService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

export default function JobCardsList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'on_hold', label: 'On Hold' },
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
      setJobCards(response.data || []);
    } catch (error) {
      console.error('Error fetching job cards:', error);
      showToast('Failed to load job cards', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, showToast]);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

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
    return jobCardService.getStatusColor(status || 'pending');
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
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header – Updated with blue-to-purple gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Job Cards</h1>
                <p className="text-blue-100 text-sm">Manage work orders and service tasks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchJobCards}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              <Link
                href="/job-cards/create"
                className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 shadow-md transition-shadow"
              >
                <Plus className="h-5 w-5" />
                New Job Card
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Filters – Enhanced with modern styling */}
          <div className="p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/30 to-blue-50/30">
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
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white shadow-sm"
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

          {/* Job Cards List */}
          <div className="p-4 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : jobCards.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-5">
                  <Wrench className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No job cards found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create your first job card to track service work and technician assignments.
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
      </div>
    </div>
  );
}