'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Wrench, ClipboardList, 
  ReceiptIcon, CheckCircle, AlertTriangle, 
  Info, ArrowRight, Plus, Eye, Check,
  DollarSign, Loader2, Clock, Users,
  CheckSquare, AlertCircle,
  PartyPopper,
  Trophy,
  Phone as PhoneIcon,
  ChevronRight,
  FileText,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { jobCardService, JobCard } from '@/services/jobCardService';
import { useRouter } from 'next/navigation';
import { invoiceService } from '@/services/invoiceService';
import PreChecklistTypeModal from '@/components/pre-checklist/PreChecklistTypeModal';
import { format } from 'date-fns';
import { useToast } from '@/contexts/ToastContext';
import PostChecklistTypeModal from '@/components/post-checklist/PostChecklistTypeModal';

// ==================== STAGE OVERVIEW COMPONENT ====================

interface StageOverviewProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  setActiveTab?: (tab: string) => void;
  onStageAction: (action: () => Promise<void>) => Promise<void>;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function StageOverview({ workOrder, isTransitioning, setActiveTab, onStageAction }: StageOverviewProps) {
  const router = useRouter();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(false);
  const [showCompletionSuccess, setShowCompletionSuccess] = useState(false);
  const [showPreChecklistModal, setShowPreChecklistModal] = useState(false);
  const [showPostChecklistModal, setShowPostChecklistModal] = useState(false);
  const { showToast } = useToast();
  
  const stagesConfig = {
    pre_checklist: {
      label: 'Pre-Service Checklist',
      description: 'Initial inspection and requirements validation',
      icon: <ClipboardCheck className="h-6 w-6" />,
      nextStage: 'job_card',
      color: 'from-blue-500 to-blue-600'
    },
    job_card: {
      label: 'Service Execution',
      description: 'Technical work assignment and progress tracking',
      icon: <Wrench className="h-6 w-6" />,
      nextStage: 'post_checklist',
      color: 'from-indigo-500 to-indigo-600'
    },
    post_checklist: {
      label: 'Quality Assurance',
      description: 'Post-service verification and sign-off',
      icon: <ClipboardList className="h-6 w-6" />,
      nextStage: 'invoice',
      color: 'from-purple-500 to-purple-600'
    },
    invoice: {
      label: 'Billing & Payment',
      description: 'Invoice generation and payment processing',
      icon: <ReceiptIcon className="h-6 w-6" />,
      nextStage: 'completed',
      color: 'from-green-500 to-green-600'
    }
  };

  useEffect(() => {
    if (workOrder?._id) loadJobCards();
  }, [workOrder]);

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
          nextAction = 'Begin Pre-Service Checklist';
          canProceed = true;
        } else {
          const isApproved = workOrder.stageApprovals?.pre_checklist?.approved || false;
          if (isApproved) {
            nextAction = 'Proceed to Service Execution';
            canProceed = true;
          } else {
            nextAction = 'Review & Approve Checklist';
            canProceed = true;
          }
        }
        break;

      case 'job_card':
        const hasJobCards = jobCards.length > 0;
        if (!hasJobCards) {
          nextAction = 'Create Service Assignment';
          canProceed = true;
        } else {
          const allCompleted = jobCards.every(jc => jc.status === 'completed');
          if (allCompleted) {
            nextAction = 'Initiate Quality Assurance';
            canProceed = true;
          } else {
            nextAction = 'Complete Service Tasks';
            canProceed = false;
          }
        }
        break;

      case 'post_checklist':
        if (!workOrder.postChecklistId) {
          nextAction = 'Begin Quality Assurance';
          canProceed = true;
        } else {
          const isApproved = workOrder.stageApprovals?.post_checklist?.approved || false;
          if (isApproved) {
            nextAction = 'Generate Invoice';
            canProceed = true;
          } else {
            nextAction = 'Approve Quality Check';
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
            nextAction = 'Process Payment & Complete';
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
    // Open modal instead of direct navigation
    setShowPreChecklistModal(true);
  };

  const handleCreatePostChecklist = () => {
  // Open modal instead of direct navigation
    setShowPostChecklistModal(true);
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

  const getOpportunityId = (workOrder: WorkOrder): string => {
    if (!workOrder.opportunityId) return '';
    
    // If it's a string, return it directly
    if (typeof workOrder.opportunityId === 'string') {
      return workOrder.opportunityId;
    }
    
    // If it's an object with _id property, return that
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId?._id) {
      return workOrder.opportunityId._id;
    }
    
    return '';
  };

  const handleCreateJobCard = () => {
    const opportunityId = getOpportunityId(workOrder);
    const query = new URLSearchParams({
      workOrderId: workOrder._id,
      refresh: 'true',
    });

    if (opportunityId) {
      query.set('opportunityId', opportunityId);
    }

    router.push(`/job-cards/create?${query.toString()}`);
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
      const invoiceResult = await workOrderService.generateInvoice(workOrder._id);
      
      await workOrderService.updateWorkOrder(workOrder._id, {
        invoiceId: invoiceResult.invoice._id,
        currentStage: 'invoice',
        status: 'ready_for_invoice',
        updatedAt: new Date().toISOString()
      });
    });
    if (typeof setActiveTab === 'function') {
      setActiveTab('invoice');
    }
  };

  const handleRequestReview = async () => {
    await onStageAction(async () => {
      // await workOrderService.updateWorkOrder(workOrder._id, {
      //   reviewRequested: true,
      //   reviewRequestedAt: new Date().toISOString(),
      //   reviewRequestedBy: sessionStorage.getItem('userId') || 'user',
      //   // status: 'pending_review',
      //   updatedAt: new Date().toISOString()
      // });
      
      showToast('Review requested successfully', 'success');
    });
  };

  const handleMarkInvoicePaid = async () => {
    if (!workOrder.invoiceId) return;
    
    await onStageAction(async () => {
      try {
        await invoiceService.markInvoiceAsPaid(
          workOrder.invoiceId,
          sessionStorage.getItem('userId'),
          sessionStorage.getItem('userRole'),
          'cash',
          `Payment for work order ${workOrder.workOrderNumber}`
        );
        
        await workOrderService.updateWorkOrder(workOrder._id, {
          status: 'completed',
          invoicePaid: true,
          invoicePaymentDate: new Date().toISOString(),
          actualCompletionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        setShowCompletionSuccess(true);
        
      } catch (error) {
        console.error('Error marking invoice as paid:', error);
        throw error;
      }
    });
  };

  const renderStageActions = () => {
    const stage = stageStatus.id;

    if (workOrder.status === 'completed') {
      return (
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg flex items-center gap-3 shadow-lg">
            <Trophy className="h-5 w-5" />
            <span className="font-medium">Project Completed Successfully</span>
          </div>
          {workOrder.actualCompletionDate && (
            <div className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border">
              Completed on {new Date(workOrder.actualCompletionDate).toLocaleDateString()}
            </div>
          )}
        </div>
      );
    }

    const baseButtonClass = "px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed";

    switch (stage) {
      case 'pre_checklist':
        if (!workOrder.preChecklistId) {
          return (
            <button
              onClick={handleCreatePreChecklist}
              disabled={isTransitioning}
              className={`${baseButtonClass} bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800`}
            >
              {isTransitioning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Begin Pre-Service Checklist
            </button>
          );
        } else if (!workOrder.stageApprovals?.pre_checklist?.approved) {
          return (
            <div className="flex gap-3">
              <button
                onClick={() => window.open(`/pre-checklist/${workOrder.preChecklistId}`, '_blank')}
                className={`${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`}
              >
                <Eye className="h-4 w-4" />
                View Checklist
              </button>
              <button
                onClick={handleApprovePreChecklist}
                disabled={isTransitioning}
                className={`${baseButtonClass} bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700`}
              >
                {isTransitioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve & Continue
              </button>
            </div>
          );
        } else {
          return (
            <button
              onClick={handleCreateJobCard}
              disabled={isTransitioning}
              className={`${baseButtonClass} bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800`}
            >
              <ChevronRight className="h-4 w-4" />
              Proceed to Service Execution
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
              className={`${baseButtonClass} bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800`}
            >
              <Wrench className="h-4 w-4" />
              Create Service Assignment
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
                    className={`${baseButtonClass} bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700`}
                  >
                    <Clock className="h-4 w-4" />
                    Start Service Tasks
                  </button>
                  <button
                    onClick={() => router.push('/job-cards')}
                    className={`${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`}
                  >
                    <Eye className="h-4 w-4" />
                    View All Tasks
                  </button>
                </div>
              );
            } else if (hasInProgress) {
              return (
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/job-cards/${jobCards.find(jc => jc.status === 'in_progress')?._id}`)}
                    className={`${baseButtonClass} bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Complete Tasks
                  </button>
                  <button
                    onClick={() => router.push('/job-cards')}
                    className={`${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    View Progress
                  </button>
                </div>
              );
            } else {
              return (
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateJobCard}
                    className={`${baseButtonClass} bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800`}
                  >
                    <Plus className="h-4 w-4" />
                    Add Service Task
                  </button>
                  <button
                    onClick={handleCreatePostChecklist}
                    className={`${baseButtonClass} bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800`}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Initiate Quality Check
                  </button>
                </div>
              );
            }
          } else {
            return (
              <button
                onClick={handleCreatePostChecklist}
                disabled={isTransitioning}
                className={`${baseButtonClass} bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800`}
              >
                <ChevronRight className="h-4 w-4" />
                Proceed to Quality Assurance
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
              className={`${baseButtonClass} bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800`}
            >
              <ClipboardList className="h-4 w-4" />
              Begin Quality Assurance
            </button>
          );
        } else if (!workOrder.stageApprovals?.post_checklist?.approved) {
          return (
            <div className="flex gap-3">
              <button
                onClick={() => window.open(`/post-checklist/${workOrder.postChecklistId}`, '_blank')}
                className={`${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`}
              >
                <Eye className="h-4 w-4" />
                View Quality Report
              </button>
              <button
                onClick={handleApprovePostChecklist}
                disabled={isTransitioning}
                className={`${baseButtonClass} bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700`}
              >
                {isTransitioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve Quality Check
              </button>
            </div>
          );
        } else {
          return (
            <div className="flex gap-3">
              <button
                onClick={handleRequestReview}
                disabled={isTransitioning}
                className={`${baseButtonClass} bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600`}
              >
                <AlertCircle className="h-4 w-4" />
                Request for Review
              </button>
              <button
                onClick={handleGenerateInvoice}
                disabled={isTransitioning}
                className={`${baseButtonClass} bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700`}
              >
                {isTransitioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ReceiptIcon className="h-4 w-4" />
                )}
                Generate Invoice
              </button>
            </div>
          );
        }

      case 'invoice':
        if (!workOrder.invoiceId) {
          return (
            <button
              onClick={handleGenerateInvoice}
              disabled={isTransitioning}
              className={`${baseButtonClass} bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700`}
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
                className={`${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`}
              >
                <Eye className="h-4 w-4" />
                View Invoice
              </button>
              <button
                onClick={handleMarkInvoicePaid}
                disabled={isTransitioning}
                className={`${baseButtonClass} bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl`}
              >
                {isTransitioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Process Payment & Complete
              </button>
            </div>
          );
        }

      default:
        return null;
    }
    };

  const renderStageRequirements = () => {
    if (workOrder.status === 'completed') {
      return (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-800">Work Order Successfully Completed</h4>
              <p className="text-sm text-emerald-700 mt-1">
                All stages completed, invoice paid, and customer billing finalized.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const stage = stageStatus.id;

    switch (stage) {
      case 'pre_checklist':
        return workOrder.preChecklistId ? (
          workOrder.stageApprovals?.pre_checklist?.approved ? (
            <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-200">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Pre-service checklist approved and verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-amber-700 bg-amber-50 px-4 py-2.5 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span>Pending approval of pre-service checklist</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3 text-blue-700 bg-blue-50 px-4 py-2.5 rounded-lg border border-blue-200">
            <Info className="h-4 w-4" />
            <span>Initial inspection and requirements validation required</span>
          </div>
        );

      case 'job_card':
        const hasJobCards = jobCards.length > 0;
        if (!hasJobCards) {
          return (
            <div className="flex items-center gap-3 text-blue-700 bg-blue-50 px-4 py-2.5 rounded-lg border border-blue-200">
              <Info className="h-4 w-4" />
              <span>Create service assignments for technicians</span>
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
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-200">
                <CheckCircle className="h-4 w-4" />
                <span>All {totalJobs} service task(s) completed successfully</span>
              </div>
            );
          } else {
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-indigo-700 bg-indigo-50 px-4 py-2.5 rounded-lg border border-indigo-200">
                  <Users className="h-4 w-4" />
                  <span>Service Progress: {completedJobs} completed, {inProgressJobs} in progress, {pendingJobs} pending</span>
                </div>
                {inProgressJobs > 0 && (
                  <div className="flex items-center gap-2 text-amber-700 ml-6">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">Complete in-progress tasks to continue</span>
                  </div>
                )}
                {pendingJobs > 0 && (
                  <div className="flex items-center gap-2 text-amber-700 ml-6">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">Start pending service tasks</span>
                  </div>
                )}
              </div>
            );
          }
        }

      case 'post_checklist':
        return workOrder.postChecklistId ? (
          workOrder.stageApprovals?.post_checklist?.approved ? (
            <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-200">
              <CheckCircle className="h-4 w-4" />
              <span>Quality assurance completed and approved</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-amber-700 bg-amber-50 px-4 py-2.5 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span>Pending quality verification approval</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3 text-purple-700 bg-purple-50 px-4 py-2.5 rounded-lg border border-purple-200">
            <Info className="h-4 w-4" />
            <span>Post-service quality verification required</span>
          </div>
        );

      case 'invoice':
        return workOrder.invoiceId ? (
          workOrder.invoicePaid ? (
            <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-200">
              <CheckCircle className="h-4 w-4" />
              <span>Payment received and processed successfully</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-amber-700 bg-amber-50 px-4 py-2.5 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span>Invoice generated, awaiting payment confirmation</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3 text-green-700 bg-green-50 px-4 py-2.5 rounded-lg border border-green-200">
            <Info className="h-4 w-4" />
            <span>Generate invoice from completed service work</span>
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

    const progressPercentage = Math.round((completedJobs / totalJobs) * 100);

    return (
      <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Service Progress Dashboard</h4>
              <p className="text-sm text-gray-600">{totalJobs} total service tasks</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{progressPercentage}%</div>
            <div className="text-xs text-gray-500">Overall Progress</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <div className="text-lg font-bold text-emerald-700">{completedJobs}</div>
            </div>
            <div className="text-xs font-medium text-emerald-800">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="text-lg font-bold text-blue-700">{inProgressJobs}</div>
            </div>
            <div className="text-xs font-medium text-blue-800">In Progress</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <div className="text-lg font-bold text-amber-700">{pendingJobs}</div>
            </div>
            <div className="text-xs font-medium text-amber-800">Pending</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Completion Status</span>
            <span>{completedJobs} of {totalJobs} tasks</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercentage}%`,
                backgroundImage: `linear-gradient(to right, 
                  #10b981 ${(completedJobs/totalJobs)*100}%, 
                  #3b82f6 ${(completedJobs/totalJobs)*100}% ${((completedJobs+inProgressJobs)/totalJobs)*100}%, 
                  #f59e0b ${((completedJobs+inProgressJobs)/totalJobs)*100}%)` 
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
      {showCompletionSuccess && (
        <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <PartyPopper className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900">Project Successfully Completed!</h3>
              <p className="text-sm text-emerald-800 mt-1">
                The work order has been finalized, invoice paid, and all workflow stages are complete.
              </p>
            </div>
            <button
              onClick={() => setShowCompletionSuccess(false)}
              className="text-emerald-600 hover:text-emerald-800 p-2 hover:bg-white rounded-lg transition-colors"
            >
              <AlertCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3.5 bg-gradient-to-br ${stageConfig?.color || 'from-blue-500 to-blue-600'} rounded-xl shadow-sm`}>
            <div className="text-white">
              {stageConfig?.icon || <ClipboardCheck className="h-6 w-6" />}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {workOrder.status === 'completed' ? 'Project Completion Summary' : `Stage: ${stageConfig?.label}`}
              </h2>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                workOrder.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' :
                workOrder.status === 'delayed' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {workOrderService.getStatusLabel(workOrder.status)}
              </span>
            </div>
            
            <p className="text-gray-600">
              {workOrder.status === 'completed' 
                ? 'All service work completed and payment processed. Ready for final documentation.'
                : stageConfig?.description}
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          {renderStageRequirements()}
        </div>

        {renderJobCardSummary()}
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Next Action Required</h4>
              <p className="text-lg font-semibold text-gray-900">{stageStatus.nextAction}</p>
            </div>
            <div className="flex gap-3">
              {renderStageActions()}
            </div>
          </div>
        </div>

        {workOrder.status === 'completed' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-4">Completion Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workOrder.actualCompletionDate && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Completion Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(workOrder.actualCompletionDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {workOrder.invoicePaymentDate && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Payment Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(workOrder.invoicePaymentDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">Work Order #</p>
                <p className="font-semibold text-gray-900">{workOrder.workOrderNumber}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">Final Status</p>
                <p className="font-semibold text-emerald-600">COMPLETED</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <PreChecklistTypeModal
        isOpen={showPreChecklistModal}
        onClose={() => setShowPreChecklistModal(false)}
        workOrderId={workOrder._id}
        opportunityId={getOpportunityId(workOrder)}
      />

      <PostChecklistTypeModal
        isOpen={showPostChecklistModal}
        onClose={() => setShowPostChecklistModal(false)}
        workOrderId={workOrder._id}
        opportunityId={getOpportunityId(workOrder)}
      />
    </div>
  );
}
