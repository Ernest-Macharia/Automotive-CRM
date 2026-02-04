'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Wrench, ClipboardList, 
  ReceiptIcon, CheckCircle, AlertTriangle, 
  Info, ArrowRight, Plus, Eye, Check,
  DollarSign, Loader2, Clock, Users,
  CheckSquare, AlertCircle,
  PartyPopper,
  Trophy
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { jobCardService, JobCard } from '@/services/jobCardService';
import { useRouter } from 'next/navigation';
import { invoiceService } from '@/services/invoiceService';

interface StageOverviewProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onStageAction: (action: () => Promise<void>) => Promise<void>;
}

export default function StageOverview({ workOrder, isTransitioning, onStageAction }: StageOverviewProps) {
  const router = useRouter();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(false);
  const [showCompletionSuccess, setShowCompletionSuccess] = useState(false);
  
  const stagesConfig = {
    pre_checklist: {
      label: 'Pre-Checklist',
      description: 'Pre-service inspection and validation',
      icon: <ClipboardCheck className="h-5 w-5" />,
      nextStage: 'job_card'
    },
    job_card: {
      label: 'Job Card',
      description: 'Technician work assignments and progress',
      icon: <Wrench className="h-5 w-5" />,
      nextStage: 'post_checklist'
    },
    post_checklist: {
      label: 'Post-Checklist',
      description: 'Post-service quality verification',
      icon: <ClipboardList className="h-5 w-5" />,
      nextStage: 'invoice'
    },
    invoice: {
      label: 'Invoice',
      description: 'Generate billing document',
      icon: <ReceiptIcon className="h-5 w-5" />,
      nextStage: 'completed'
    }
  };

  useEffect(() => {
    if (workOrder && workOrder._id) {
      loadJobCards();
    }
  }, [workOrder]);

  // Check if work order is completed to show success message
  useEffect(() => {
    if (workOrder.status === 'completed' && !showCompletionSuccess) {
      setShowCompletionSuccess(true);
    }
  }, [workOrder.status]);

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

  const getStageStatus = () => {
    const stage = workOrder.currentStage || 'pre_checklist';
    const stageConfig = stagesConfig[stage as keyof typeof stagesConfig];

    let nextAction = '';
    let canProceed = false;

    switch (stage) {
      case 'pre_checklist':
        if (!workOrder.preChecklistId) {
          nextAction = 'Create Pre-Checklist';
          canProceed = true;
        } else {
          const isApproved = workOrder.stageApprovals?.pre_checklist?.approved || false;
          if (isApproved) {
            nextAction = 'Create Job Card';
            canProceed = true;
          } else {
            nextAction = 'Approve Pre-Checklist';
            canProceed = true;
          }
        }
        break;

      case 'job_card':
        const hasJobCards = jobCards.length > 0;
        if (!hasJobCards) {
          nextAction = 'Create Job Card';
          canProceed = true;
        } else {
          const allCompleted = jobCards.every(jc => jc.status === 'completed');
          if (allCompleted) {
            nextAction = 'Create Post-Checklist';
            canProceed = true;
          } else {
            nextAction = 'Complete Job Cards';
            canProceed = false;
          }
        }
        break;

      case 'post_checklist':
        if (!workOrder.postChecklistId) {
          nextAction = 'Create Post-Checklist';
          canProceed = true;
        } else {
          const isApproved = workOrder.stageApprovals?.post_checklist?.approved || false;
          if (isApproved) {
            nextAction = 'Generate Invoice';
            canProceed = true;
          } else {
            nextAction = 'Approve Post-Checklist';
            canProceed = true;
          }
        }
        break;

      case 'invoice':
        if (!workOrder.invoiceId) {
          nextAction = 'Generate Invoice';
          canProceed = true;
        } else {
          const isPaid = workOrder.invoicePaid || false;
          if (isPaid) {
            nextAction = 'Work Order Completed';
            canProceed = false;
          } else {
            nextAction = 'Mark Invoice as Paid';
            canProceed = true;
          }
        }
        break;
    }

    return {
      id: stage,
      label: stageConfig?.label || stage,
      status: workOrder.status || 'draft',
      canProceed,
      nextAction,
      description: stageConfig?.description || ''
    };
  };

  const stageStatus = getStageStatus();
  const stageConfig = stagesConfig[stageStatus.id as keyof typeof stagesConfig];

  const handleCreatePreChecklist = () => {
    router.push(`/pre-checklist/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}&source=workflow`);
  };

  const handleApprovePreChecklist = async () => {
    await onStageAction(async () => {
      await workOrderService.updateWorkOrder(workOrder._id, {
        stageApprovals: {
          ...workOrder.stageApprovals,
          pre_checklist: {
            approved: true,
            approvedAt: new Date().toISOString(),
            approvedBy: sessionStorage.getItem('userId') || 'user'
          }
        },
        preChecklistCompletionDate: new Date().toISOString(),
        currentStage: 'job_card',
        updatedAt: new Date().toISOString()
      });
    });
  };

  const handleCreateJobCard = () => {
    router.push(`/job-cards/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}&refresh=true`);
  };

  const handleCreatePostChecklist = () => {
    router.push(`/post-checklist/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}`);
  };

  const handleApprovePostChecklist = async () => {
    await onStageAction(async () => {
      await workOrderService.updateWorkOrder(workOrder._id, {
        stageApprovals: {
          ...workOrder.stageApprovals,
          post_checklist: {
            approved: true,
            approvedAt: new Date().toISOString(),
            approvedBy: sessionStorage.getItem('userId') || 'user'
          }
        },
        postChecklistCompletionDate: new Date().toISOString(),
        currentStage: 'invoice',
        updatedAt: new Date().toISOString()
      });
    });
  };

  const handleGenerateInvoice = async () => {
    await onStageAction(async () => {
      // Generate invoice and send email
      const invoiceResult = await workOrderService.generateInvoice(workOrder._id);
      
      // Update work order
      await workOrderService.updateWorkOrder(workOrder._id, {
        invoiceId: invoiceResult.invoice._id,
        currentStage: 'invoice',
        status: 'ready_for_invoice',
        updatedAt: new Date().toISOString()
      });
    });
  };

  const handleMarkInvoicePaid = async () => {
    if (!workOrder.invoiceId) return;
    
    await onStageAction(async () => {
      try {
        // 1. Mark invoice as paid using the PATCH /invoices/{id}/pay endpoint
        await invoiceService.markInvoiceAsPaid(
          workOrder.invoiceId,
          sessionStorage.getItem('userId'),
          sessionStorage.getItem('userRole'),
          'cash', // Default payment method
          `Payment for work order ${workOrder.workOrderNumber}`
        );
        
        // 2. Complete the work order
        await workOrderService.updateWorkOrder(workOrder._id, {
          status: 'completed',
          invoicePaid: true,
          invoicePaymentDate: new Date().toISOString(),
          actualCompletionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // 3. Show success message
        setShowCompletionSuccess(true);
        
      } catch (error) {
        console.error('Error marking invoice as paid:', error);
        throw error;
      }
    });
  };

  // Remove the separate handleCompleteWorkOrder function since it's now part of handleMarkInvoicePaid

  const renderStageActions = () => {
    const stage = stageStatus.id;

    // If work order is already completed, show completion message
    if (workOrder.status === 'completed') {
      return (
        <div className="flex items-center gap-3">
          <div className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Work Order Completed ✓
          </div>
          {workOrder.actualCompletionDate && (
            <div className="text-sm text-gray-600">
              Completed on {new Date(workOrder.actualCompletionDate).toLocaleDateString()}
            </div>
          )}
        </div>
      );
    }

    switch (stage) {
      case 'pre_checklist':
        if (!workOrder.preChecklistId) {
          return (
            <button
              onClick={handleCreatePreChecklist}
              disabled={isTransitioning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create Pre-Checklist
            </button>
          );
        } else if (!workOrder.stageApprovals?.pre_checklist?.approved) {
          return (
            <div className="flex gap-3">
              <button
                onClick={() => window.open(`/pre-checklist/${workOrder.preChecklistId}`, '_blank')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Pre-Checklist
              </button>
              <button
                onClick={handleApprovePreChecklist}
                disabled={isTransitioning}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isTransitioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Approve Pre-Checklist
                  </>
                )}
              </button>
            </div>
          );
        } else {
          return (
            <button
              onClick={handleCreateJobCard}
              disabled={isTransitioning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create Job Card
            </button>
          );
        }

      case 'job_card':
        const hasJobCards = jobCards.length > 0;
        if (!hasJobCards) {
          return (
            <button
              onClick={handleCreateJobCard}
              disabled={isTransitioning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create Job Card
            </button>
          );
        } else {
          const allCompleted = jobCards.every(jc => jc.status === 'completed');
          const hasInProgress = jobCards.some(jc => jc.status === 'in_progress');
          const hasPending = jobCards.some(jc => jc.status === 'pending');

          if (!allCompleted) {
            if (hasPending) {
              return (
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/job-cards/${jobCards.find(jc => jc.status === 'pending')?._id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Start Pending Jobs
                  </button>
                  <button
                    onClick={() => router.push('/job-cards')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View All Jobs
                  </button>
                </div>
              );
            } else if (hasInProgress) {
              return (
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/job-cards/${jobCards.find(jc => jc.status === 'in_progress')?._id}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Complete In-Progress Jobs
                  </button>
                  <button
                    onClick={() => router.push('/job-cards')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View All Jobs
                  </button>
                </div>
              );
            } else {
              return (
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateJobCard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Job Card
                  </button>
                  <button
                    onClick={() => router.push('/job-cards')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Job Cards
                  </button>
                </div>
              );
            }
          } else {
            // All job cards completed
            return (
              <button
                onClick={handleCreatePostChecklist}
                disabled={isTransitioning}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Create Post-Checklist
              </button>
            );
          }
        }

      case 'post_checklist':
        if (!workOrder.postChecklistId) {
          return (
            <button
              onClick={handleCreatePostChecklist}
              disabled={isTransitioning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create Post-Checklist
            </button>
          );
        } else if (!workOrder.stageApprovals?.post_checklist?.approved) {
          return (
            <div className="flex gap-3">
              <button
                onClick={() => window.open(`/post-checklist/${workOrder.postChecklistId}`, '_blank')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Post-Checklist
              </button>
              <button
                onClick={handleApprovePostChecklist}
                disabled={isTransitioning}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isTransitioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Approve Post-Checklist
                  </>
                )}
              </button>
            </div>
          );
        } else {
          return (
            <button
              onClick={handleGenerateInvoice}
              disabled={isTransitioning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <ReceiptIcon className="h-4 w-4" />
              Generate Invoice
            </button>
          );
        }

      case 'invoice':
        if (!workOrder.invoiceId) {
          return (
            <button
              onClick={handleGenerateInvoice}
              disabled={isTransitioning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <ReceiptIcon className="h-4 w-4" />
              Generate Invoice
            </button>
          );
        } else if (!workOrder.invoicePaid) {
          return (
            <div className="flex gap-3">
              <button
                onClick={() => window.open(`/invoices/${workOrder.invoiceId}`, '_blank')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Invoice
              </button>
              <button
                onClick={handleMarkInvoicePaid}
                disabled={isTransitioning}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isTransitioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Mark as Paid & Complete Work Order
              </button>
            </div>
          );
        } else if (workOrder.status !== 'completed') {
          // This shouldn't happen anymore since handleMarkInvoicePaid completes the work order
          return (
            <button
              onClick={handleMarkInvoicePaid}
              disabled={isTransitioning}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Work Order
            </button>
          );
        }

      default:
        return null;
    }
  };

  const renderStageRequirements = () => {
    // If work order is completed, show completion message
    if (workOrder.status === 'completed') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Work Order Successfully Completed!</span>
          </div>
          <div className="ml-7 space-y-1 text-sm text-green-700">
            <p>✓ All stages completed</p>
            <p>✓ Invoice paid and closed</p>
            <p>✓ Customer billing completed</p>
            {workOrder.actualCompletionDate && (
              <p>✓ Completed on {new Date(workOrder.actualCompletionDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      );
    }

    const stage = stageStatus.id;

    switch (stage) {
      case 'pre_checklist':
        return workOrder.preChecklistId ? (
          workOrder.stageApprovals?.pre_checklist?.approved ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Pre-Checklist approved ✓ Ready to create Job Card</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Approve pre-checklist to create Job Card</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-blue-600">
            <Info className="h-4 w-4" />
            <span>Create pre-checklist to start workflow</span>
          </div>
        );

      case 'job_card':
        const hasJobCards = jobCards.length > 0;
        if (!hasJobCards) {
          return (
            <div className="flex items-center gap-2 text-blue-600">
              <Info className="h-4 w-4" />
              <span>Create job card with technician assignments</span>
            </div>
          );
        } else {
          const totalJobs = jobCards.length;
          const completedJobs = jobCards.filter(jc => jc.status === 'completed').length;
          const inProgressJobs = jobCards.filter(jc => jc.status === 'in_progress').length;
          const pendingJobs = jobCards.filter(jc => jc.status === 'pending').length;

          const allCompleted = completedJobs === totalJobs;
          
          if (allCompleted) {
            return (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>All {totalJobs} job card(s) completed ✓ Ready for Post-Checklist</span>
              </div>
            );
          } else {
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <Users className="h-4 w-4" />
                  <span>Job Cards Status: {completedJobs} completed, {inProgressJobs} in progress, {pendingJobs} pending</span>
                </div>
                {inProgressJobs > 0 && (
                  <div className="flex items-center gap-2 text-yellow-600 ml-6">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm">Complete in-progress jobs to continue</span>
                  </div>
                )}
                {pendingJobs > 0 && (
                  <div className="flex items-center gap-2 text-amber-600 ml-6">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-sm">Start pending jobs to begin work</span>
                  </div>
                )}
              </div>
            );
          }
        }

      case 'post_checklist':
        return workOrder.postChecklistId ? (
          workOrder.stageApprovals?.post_checklist?.approved ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Post-checklist approved ✓ Ready to create Invoice</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Approve post-checklist to create Invoice</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-blue-600">
            <Info className="h-4 w-4" />
            <span>Create post-checklist for quality verification</span>
          </div>
        );

      case 'invoice':
        return workOrder.invoiceId ? (
          workOrder.invoicePaid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Invoice paid ✓ Work Order completed successfully</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Invoice generated, mark as paid to complete work order</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-blue-600">
            <Info className="h-4 w-4" />
            <span>Generate invoice from completed work</span>
          </div>
        );

      default:
        return null;
    }
  };

  const renderJobCardSummary = () => {
    if (stageStatus.id !== 'job_card' || jobCards.length === 0) return null;

    const totalJobs = jobCards.length;
    const completedJobs = jobCards.filter(jc => jc.status === 'completed').length;
    const inProgressJobs = jobCards.filter(jc => jc.status === 'in_progress').length;
    const pendingJobs = jobCards.filter(jc => jc.status === 'pending').length;

    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Job Cards Summary
          </h4>
          <span className="text-sm text-gray-600">{totalJobs} total</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
            <div className="text-lg font-bold text-green-700">{completedJobs}</div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
          <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="text-lg font-bold text-blue-700">{inProgressJobs}</div>
            <div className="text-xs text-blue-600">In Progress</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-lg font-bold text-yellow-700">{pendingJobs}</div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
        </div>

        {totalJobs > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-yellow-500"
                style={{ 
                  width: '100%',
                  backgroundImage: `linear-gradient(to right, 
                    #10b981 ${(completedJobs/totalJobs)*100}%, 
                    #3b82f6 ${(completedJobs/totalJobs)*100}% ${((completedJobs+inProgressJobs)/totalJobs)*100}%, 
                    #f59e0b ${((completedJobs+inProgressJobs)/totalJobs)*100}%)` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.round((completedJobs/totalJobs)*100)}% completed</span>
              <span>{Math.round(((completedJobs+inProgressJobs)/totalJobs)*100)}% started</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
      {/* Completion Success Message */}
      {showCompletionSuccess && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <PartyPopper className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-800">Work Order Completed Successfully!</h3>
              <p className="text-sm text-green-700">
                The invoice has been paid and the work order is now marked as completed.
                All workflow stages are finished.
              </p>
            </div>
            <button
              onClick={() => setShowCompletionSuccess(false)}
              className="text-green-600 hover:text-green-800"
            >
              <AlertCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-blue-600">
              {stageConfig?.icon || <ClipboardCheck className="h-6 w-6" />}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {workOrder.status === 'completed' ? 'Work Order Completed' : `Current Stage: ${stageConfig?.label}`}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                workOrder.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                workOrder.status === 'delayed' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {workOrderService.getStatusLabel(workOrder.status)}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">
              {workOrder.status === 'completed' 
                ? 'All work completed, invoice paid, and customer billing finished.'
                : stageConfig?.description}
            </p>
            
            {/* Stage Requirements */}
            <div className="space-y-2 mb-6">
              {renderStageRequirements()}
            </div>

            {/* Job Card Summary (only for job card stage) */}
            {renderJobCardSummary()}
            
            {/* Action Button */}
            <div className="mt-4">
              {renderStageActions()}
            </div>

            {/* Additional Info for Completed Work Orders */}
            {workOrder.status === 'completed' && (
              <div className="mt-6 pt-4 border-t border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {workOrder.actualCompletionDate && (
                    <div>
                      <p className="text-gray-600">Completion Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(workOrder.actualCompletionDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {workOrder.invoicePaymentDate && (
                    <div>
                      <p className="text-gray-600">Payment Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(workOrder.invoicePaymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}