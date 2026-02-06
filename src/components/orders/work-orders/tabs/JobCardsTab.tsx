'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Plus, Eye, Loader2, CheckCircle,
  Calendar, Clock, User, AlertTriangle,
  ArrowRight, Package, Edit, Trash2,
  Filter, Search, ChevronDown, ChevronUp,
  BarChart3, Users, Target, TrendingUp,
  Sparkles, Zap, Shield, Award,
  MoreVertical, ExternalLink, Copy,
  PlayCircle, PauseCircle, StopCircle
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { jobCardService, JobCard } from '@/services/jobCardService';
import { format } from 'date-fns';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

interface JobCardsTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

interface JobCardFilters {
  status: string[];
  priority: string[];
  assignedTo: string[];
}

export default function JobCardsTab({ workOrder, isTransitioning, onAction }: JobCardsTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [filteredJobCards, setFilteredJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<JobCardFilters>({
    status: [],
    priority: [],
    assignedTo: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'status' | 'estimatedHours'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isCreatingJobCard, setIsCreatingJobCard] = useState(false);

  useEffect(() => {
    loadJobCards();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!refreshing) {
        refreshJobCards();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [workOrder._id]);

  const loadJobCards = async () => {
    setLoading(true);
    try {
      if (workOrder._id) {
        const workOrderJobCards = await workOrderService.getWorkOrderJobCards(workOrder._id);
        setJobCards(workOrderJobCards || []);
        setFilteredJobCards(workOrderJobCards || []);
      }
    } catch (error) {
      console.error('Error loading job cards:', error);
      showToast('Failed to load job cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshJobCards = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadJobCards();
    setRefreshing(false);
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = [...jobCards];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(jc =>
        jc.jobTitle?.toLowerCase().includes(query) ||
        jc.description?.toLowerCase().includes(query) ||
        jc.jobNumber?.toLowerCase().includes(query) ||
        (typeof jc.assignedTo === 'object' && 
         (jc.assignedTo.name?.toLowerCase().includes(query) ||
          jc.assignedTo.email?.toLowerCase().includes(query)))
      );
    }
    
    // Apply status filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(jc => filters.status.includes(jc.status));
    }
    
    // Apply priority filters
    if (filters.priority.length > 0) {
      filtered = filtered.filter(jc => filters.priority.includes(jc.priority || 'medium'));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          const statusOrder = { pending: 1, in_progress: 2, completed: 3, cancelled: 0 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        case 'estimatedHours':
          aValue = a.estimatedHours || 0;
          bValue = b.estimatedHours || 0;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    setFilteredJobCards(filtered);
  }, [jobCards, searchQuery, filters, sortBy, sortOrder]);

  const handleCreateJobCard = () => {
    setIsCreatingJobCard(true);
    router.push(`/job-cards/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}&source=workflow`);
  };

  const handleStartJob = async (jobCardId: string) => {
    setUpdatingStatus(jobCardId);
    try {
      await onAction(async () => {
        await jobCardService.updateJobCard(jobCardId, {
          status: 'in_progress',
          startDate: new Date().toISOString()
        });
        showToast('Job started successfully', 'success');
        await loadJobCards();
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to start job', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePauseJob = async (jobCardId: string) => {
    setUpdatingStatus(jobCardId);
    try {
      await onAction(async () => {
        await jobCardService.updateJobCard(jobCardId, {
          status: 'pending',
          pauseCount: (jobCards.find(jc => jc._id === jobCardId)?.pauseCount || 0) + 1
        });
        showToast('Job paused', 'info');
        await loadJobCards();
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to pause job', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCompleteJob = async (jobCardId: string) => {
    setUpdatingStatus(jobCardId);
    try {
      await onAction(async () => {
        const jobCard = jobCards.find(jc => jc._id === jobCardId);
        await jobCardService.updateJobCard(jobCardId, {
          status: 'completed',
          completedDate: new Date().toISOString(),
          actualHours: jobCard?.actualHours || jobCard?.estimatedHours || 2
        });
        showToast('Job completed successfully', 'success');
        await workOrderService.onJobCardCompleted(workOrder._id, jobCardId);
        await loadJobCards();
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to complete job', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDuplicateJobCard = async (jobCardId: string) => {
    try {
      const jobCard = jobCards.find(jc => jc._id === jobCardId);
      if (!jobCard) return;
      
      const duplicate = {
        ...jobCard,
        jobTitle: `${jobCard.jobTitle} (Copy)`,
        status: 'pending',
        startDate: null,
        completedDate: null,
        _id: undefined
      };
      
      await jobCardService.createJobCard(duplicate);
      showToast('Job card duplicated', 'success');
      await loadJobCards();
    } catch (error: any) {
      showToast(error.message || 'Failed to duplicate job card', 'error');
    }
  };

  const formatDuration = (hours: number) => {
    if (!hours || hours === 0) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const getTechnicianName = (jobCard: JobCard) => {
    if (!jobCard.assignedTo) return 'Unassigned';
    if (typeof jobCard.assignedTo === 'string') return 'Loading...';
    const userRef: any = jobCard.assignedTo;
    return userRef.name || userRef.email || 'Technician';
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      completed: {
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Completed',
        gradient: 'from-emerald-500 to-green-500'
      },
      in_progress: {
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <PlayCircle className="h-4 w-4" />,
        label: 'In Progress',
        gradient: 'from-blue-500 to-cyan-500'
      },
      pending: {
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: <Clock className="h-4 w-4" />,
        label: 'Pending',
        gradient: 'from-amber-500 to-yellow-500'
      },
      cancelled: {
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: <StopCircle className="h-4 w-4" />,
        label: 'Cancelled',
        gradient: 'from-red-500 to-rose-500'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      urgent: {
        color: 'bg-red-100 text-red-700',
        icon: <Zap className="h-3 w-3" />,
        label: 'Urgent'
      },
      high: {
        color: 'bg-orange-100 text-orange-700',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'High'
      },
      medium: {
        color: 'bg-blue-100 text-blue-700',
        icon: <Target className="h-3 w-3" />,
        label: 'Medium'
      },
      low: {
        color: 'bg-emerald-100 text-emerald-700',
        icon: <Shield className="h-3 w-3" />,
        label: 'Low'
      }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const calculateProgress = useCallback((jobCard: JobCard) => {
    if (jobCard.status === 'completed') return 100;
    if (jobCard.status === 'pending') return 0;
    if (jobCard.status === 'in_progress') {
      const startTime = jobCard.startDate ? new Date(jobCard.startDate).getTime() : Date.now();
      const elapsedHours = (Date.now() - startTime) / (1000 * 60 * 60);
      const estimatedHours = jobCard.estimatedHours || 8;
      return Math.min(90, Math.round((elapsedHours / estimatedHours) * 100));
    }
    return 0;
  }, []);

  const stats = useMemo(() => {
    const total = jobCards.length;
    const completed = jobCards.filter(jc => jc.status === 'completed').length;
    const inProgress = jobCards.filter(jc => jc.status === 'in_progress').length;
    const pending = jobCards.filter(jc => jc.status === 'pending').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const totalHours = jobCards.reduce((sum, jc) => sum + (jc.estimatedHours || 0), 0);
    const completedHours = jobCards
      .filter(jc => jc.status === 'completed')
      .reduce((sum, jc) => sum + (jc.actualHours || jc.estimatedHours || 0), 0);
    
    return {
      total,
      completed,
      inProgress,
      pending,
      progress,
      totalHours: formatDuration(totalHours),
      completedHours: formatDuration(completedHours),
      efficiency: totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0
    };
  }, [jobCards]);

  const renderJobCardItem = (jobCard: JobCard) => {
    const statusConfig = getStatusConfig(jobCard.status);
    const priorityConfig = getPriorityConfig(jobCard.priority || 'medium');
    const isUpdating = updatingStatus === jobCard._id;
    const isSelected = selectedCard === jobCard._id;
    const progress = calculateProgress(jobCard);
    
    return (
      <motion.div
        key={jobCard._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className={`border-2 rounded-2xl overflow-hidden transition-all ${
          isSelected 
            ? 'border-blue-300 shadow-lg bg-gradient-to-r from-blue-50/30 to-indigo-50/30' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div 
          className="p-5 cursor-pointer"
          onClick={() => setSelectedCard(isSelected ? null : jobCard._id)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${statusConfig.color}`}>
                  {statusConfig.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    {jobCard.jobTitle || `Job Card ${jobCard.jobNumber || ''}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Assigned to: <span className="font-medium">{getTechnicianName(jobCard)}</span>
                  </p>
                </div>
              </div>
              
              {jobCard.description && (
                <p className="text-gray-700 mb-4 line-clamp-2">{jobCard.description}</p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Priority</div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${priorityConfig.color}`}>
                    {priorityConfig.icon}
                    {priorityConfig.label}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Est. Duration</div>
                  <div className="font-semibold text-gray-900">
                    {formatDuration(jobCard.estimatedHours || 0)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Progress</div>
                  <div className="font-semibold text-gray-900">{progress}%</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Created</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(jobCard.createdAt), 'MMM dd')}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${statusConfig.gradient}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {jobCard.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartJob(jobCard._id);
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        Start Job
                      </>
                    )}
                  </button>
                )}
                
                {jobCard.status === 'in_progress' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteJob(jobCard._id);
                      }}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Complete
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePauseJob(jobCard._id);
                      }}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <PauseCircle className="h-4 w-4" />
                      Pause
                    </button>
                  </>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/job-cards/${jobCard._id}`);
                  }}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCard(jobCard._id);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </button>
              
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>
        
        {/* Expanded Details */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100"
            >
              <div className="p-5 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timeline */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Timeline</h5>
                    <div className="space-y-3">
                      {jobCard.createdAt && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">Created</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(jobCard.createdAt), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {jobCard.startDate && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <PlayCircle className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">Started</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(jobCard.startDate), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {jobCard.completedDate && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">Completed</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(jobCard.completedDate), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Quick Actions</h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/job-cards/edit/${jobCard._id}`)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateJobCard(jobCard._id)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => window.open(`/job-cards/${jobCard._id}/report`, '_blank')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl inline-block mb-4">
        <Wrench className="h-16 w-16 text-blue-600" />
      </div>
      <h4 className="text-2xl font-bold text-gray-900 mb-2">No Job Cards Yet</h4>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Create job cards to assign technicians, track work progress, and manage service execution.
      </p>
      <button
        onClick={handleCreateJobCard}
        disabled={isTransitioning || isCreatingJobCard}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 mx-auto disabled:opacity-50"
      >
        {isCreatingJobCard ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Create First Job Card
          </>
        )}
      </button>
    </div>
  );

  const renderStatsDashboard = () => (
    <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Service Execution Dashboard</h3>
          <p className="text-gray-600">Real-time tracking of all service tasks</p>
        </div>
        <button
          onClick={refreshJobCards}
          disabled={refreshing}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2"
        >
          <Loader2 className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</div>
          <div className="text-sm text-blue-700">Total Tasks</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.completed}</div>
          <div className="text-sm text-emerald-700">Completed</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-600 mb-1">{stats.inProgress}</div>
          <div className="text-sm text-amber-700">In Progress</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-purple-600 mb-1">{stats.pending}</div>
          <div className="text-sm text-purple-700">Pending</div>
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Overall Progress</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">{stats.progress}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-1000"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>{stats.completed} of {stats.total} tasks</span>
          <span>Efficiency: {stats.efficiency}%</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Service Tasks</h3>
          <p className="text-gray-600">Preparing job cards dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Execution</h2>
          <p className="text-gray-600">Technician work assignments & progress tracking</p>
        </div>
        <button
          onClick={handleCreateJobCard}
          disabled={isTransitioning || isCreatingJobCard}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {isCreatingJobCard ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Plus className="h-5 w-5" />
              New Job Card
            </>
          )}
        </button>
      </div>

      {jobCards.length > 0 ? (
        <>
          {renderStatsDashboard()}
          
          {/* Filters & Search */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search job cards..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 border-2 rounded-xl flex items-center gap-2 ${
                    showFilters 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Filter className="h-5 w-5" />
                  Filters
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="status">Sort by Status</option>
                  <option value="estimatedHours">Sort by Duration</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400"
                >
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>
            </div>
            
            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Filters */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Status</h5>
                      <div className="space-y-2">
                        {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => {
                          const config = getStatusConfig(status);
                          return (
                            <label key={status} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.status.includes(status)}
                                onChange={(e) => {
                                  const newStatuses = e.target.checked
                                    ? [...filters.status, status]
                                    : filters.status.filter(s => s !== status);
                                  setFilters({...filters, status: newStatuses});
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className={`p-1.5 rounded-lg ${config.color}`}>
                                {config.icon}
                              </div>
                              <span className="text-sm">{config.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Priority Filters */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Priority</h5>
                      <div className="space-y-2">
                        {['urgent', 'high', 'medium', 'low'].map((priority) => {
                          const config = getPriorityConfig(priority);
                          return (
                            <label key={priority} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.priority.includes(priority)}
                                onChange={(e) => {
                                  const newPriorities = e.target.checked
                                    ? [...filters.priority, priority]
                                    : filters.priority.filter(p => p !== priority);
                                  setFilters({...filters, priority: newPriorities});
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className={`p-1.5 rounded-lg ${config.color}`}>
                                {config.icon}
                              </div>
                              <span className="text-sm capitalize">{priority}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col justify-end">
                      <div className="space-y-2">
                        <button
                          onClick={() => setFilters({ status: [], priority: [], assignedTo: [] })}
                          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Clear Filters
                        </button>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Job Cards List */}
          <div className="space-y-4">
            {filteredJobCards.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No Matching Results</h4>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ status: [], priority: [], assignedTo: [] });
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{filteredJobCards.length}</span> of{' '}
                    <span className="font-semibold">{jobCards.length}</span> job cards
                  </div>
                  <div className="text-sm text-gray-600">
                    {stats.completedHours} of {stats.totalHours} completed
                  </div>
                </div>
                
                {filteredJobCards.map(renderJobCardItem)}
              </>
            )}
          </div>
        </>
      ) : (
        renderEmptyState()
      )}
      
      {/* Next Stage Action */}
      {stats.completed === stats.total && stats.total > 0 && workOrder.currentStage === 'job_card' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Award className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-emerald-900">All Tasks Completed! 🎉</h4>
                <p className="text-emerald-700">
                  {stats.completed} job cards finished. Ready for quality assurance.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/post-checklist/create?workOrderId=${workOrder._id}`)}
              disabled={isTransitioning}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <ArrowRight className="h-5 w-5" />
              Proceed to Quality Check
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Auto-refresh Indicator */}
      {refreshing && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Auto-refreshing...</span>
        </div>
      )}
    </div>
  );
}