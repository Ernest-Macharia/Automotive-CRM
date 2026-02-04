'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Plus, Eye, Loader2, CheckCircle,
  Calendar, Clock, User, AlertTriangle,
  ArrowRight, Package, Edit, Trash2
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { jobCardService, JobCard } from '@/services/jobCardService';
import { format } from 'date-fns';
import { useToast } from '@/contexts/ToastContext';

interface JobCardsTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

export default function JobCardsTab({ workOrder, isTransitioning, onAction }: JobCardsTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localLoading, setLocalLoading] = useState(false);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (workOrder && workOrder._id) {
      loadJobCards();
    }
  }, [workOrder]);

  // In JobCardsTab.tsx - Update the loadJobCards function:
  const loadJobCards = async () => {
    try {
      setLoadingJobCards(true);
      
      if (workOrder && workOrder._id) {
        try {
          const workOrderJobCards = await workOrderService.getWorkOrderJobCards(workOrder._id);
          setJobCards(workOrderJobCards || []);
        } catch (error) {
          console.error('Error loading job cards:', error);
          setJobCards([]);
        }
      } else {
        setJobCards([]);
      }
    } catch (error) {
      console.error('Error in loadJobCards:', error);
      setJobCards([]);
    } finally {
      setLoadingJobCards(false);
    }
  };

  const handleCreateJobCard = () => {
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
        showToast('Job card started successfully', 'success');
        await loadJobCards();
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to start job card', 'error');
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
        showToast('Job card completed successfully', 'success');
        
        // Notify work order service about job card completion
        await workOrderService.onJobCardCompleted(workOrder._id, jobCardId);
        
        // Reload job cards
        await loadJobCards();
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to complete job card', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatDuration = (hours: number) => {
    if (!hours || hours === 0) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  const getTechnicianName = (jobCard: JobCard) => {
    if (!jobCard.assignedTo) return 'Unassigned';
    if (typeof jobCard.assignedTo === 'string') return 'Loading...';
    const userRef: any = jobCard.assignedTo;
    return userRef.name || userRef.email || 'Technician';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotals = (jobCard: JobCard) => {
    const partsTotal =
      (jobCard?.partsUsed?.reduce((sum: number, part: any) => sum + (part.totalCost || 0), 0) as number) || 0;
    const laborCost = jobCard?.laborCost || 0;
    const totalCost = partsTotal + laborCost;
    return { partsTotal, laborCost, totalCost };
  };

  const renderJobCardItem = (jobCard: JobCard) => {
    const totals = calculateTotals(jobCard);
    const isUpdating = updatingStatus === jobCard._id;
    
    return (
      <div key={jobCard._id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {jobCard.jobTitle || `Job Card ${jobCard.jobNumber || ''}`}
                </h4>
                <p className="text-sm text-gray-600">
                  Assigned to: {getTechnicianName(jobCard)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(jobCard.status)}`}>
                  {jobCard.status === 'completed' ? 'Completed' :
                   jobCard.status === 'in_progress' ? 'In Progress' :
                   jobCard.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Priority</div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(jobCard.priority || 'medium')}`}>
                  {(jobCard.priority || 'Medium').toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Est. Hours</div>
                <div className="font-medium">{formatDuration(jobCard.estimatedHours || 0)}</div>
              </div>
            </div>
            
            {jobCard.startDate && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Clock className="h-3 w-3" />
                Started {formatDate(jobCard.startDate)}
              </div>
            )}
            
            {jobCard.completedDate && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3" />
                Completed {formatDate(jobCard.completedDate)}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-3 flex gap-2">
              {jobCard.status === 'pending' && (
                <button
                  onClick={() => handleStartJob(jobCard._id)}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      Start Job
                    </>
                  )}
                </button>
              )}
              
              {jobCard.status === 'in_progress' && (
                <button
                  onClick={() => handleCompleteJob(jobCard._id)}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-1 text-sm disabled:opacity-50 font-medium"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Complete Job
                    </>
                  )}
                </button>
              )}
              
              {jobCard.status !== 'completed' && jobCard.status !== 'cancelled' && jobCard.status !== 'in_progress' && (
                <button
                  onClick={() => router.push(`/job-cards/edit/${jobCard._id}`)}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
              )}
            </div>
            
            {/* Cost Summary */}
            {(totals.totalCost > 0) && (
              <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-bold text-purple-600">
                    {jobCardService.formatCurrency(totals.totalCost)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/job-cards/${jobCard._id}`)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View
            </button>
          </div>
        </div>
      </div>
    );
  };

  const hasJobCards = jobCards.length > 0;
  const completedJobCards = jobCards.filter(jc => jc.status === 'completed').length;
  const allJobCardsCompleted = hasJobCards && completedJobCards === jobCards.length;
  const hasInProgressJobs = jobCards.some(jc => jc.status === 'in_progress');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Job Cards</h3>
          <p className="text-sm text-gray-600">Technician work assignments - Start and complete jobs</p>
        </div>
        <button
          onClick={handleCreateJobCard}
          disabled={isTransitioning || localLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          {(isTransitioning || localLoading) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create Job Card
        </button>
      </div>
      
      {/* Stats Summary */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {jobCards.length}
            </div>
            <div className="text-sm text-blue-700">Total Job Cards</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {completedJobCards}
            </div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {jobCards.filter(jc => jc.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {jobCards.filter(jc => jc.status === 'in_progress').length}
            </div>
            <div className="text-sm text-orange-700">In Progress</div>
          </div>
        </div>
      </div>
      
      {loadingJobCards ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job cards...</p>
        </div>
      ) : hasJobCards ? (
        <div className="space-y-4">
          {jobCards.map(jobCard => renderJobCardItem(jobCard))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
          <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-900 mb-2">No Job Cards Created</h4>
          <p className="text-gray-600 mb-6">
            Create job cards to assign technicians and track work progress.
          </p>
          <button
            onClick={handleCreateJobCard}
            disabled={isTransitioning || localLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {(isTransitioning || localLoading) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Job Card
          </button>
        </div>
      )}
      
      {/* Next Stage Action - Only show when all job cards are completed */}
      {hasJobCards && allJobCardsCompleted && workOrder.currentStage === 'job_card' && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">All Jobs Completed!</h4>
                <p className="text-sm text-gray-600">
                  All {jobCards.length} job cards are completed ✓ Ready for Post-Checklist
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/post-checklist/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}`)}
              disabled={isTransitioning}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              {isTransitioning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Post-Checklist
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Warning - Jobs in progress */}
      {hasInProgressJobs && !allJobCardsCompleted && (
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Jobs in Progress</h4>
              <p className="text-sm text-gray-600">
                {jobCards.filter(jc => jc.status === 'in_progress').length} job(s) are still in progress. 
                Complete all jobs to proceed to Post-Checklist.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Info - Jobs pending */}
      {jobCards.some(jc => jc.status === 'pending') && !hasInProgressJobs && !allJobCardsCompleted && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-gray-900">Jobs Ready to Start</h4>
              <p className="text-sm text-gray-600">
                {jobCards.filter(jc => jc.status === 'pending').length} job(s) are pending. 
                Start jobs to begin work.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}