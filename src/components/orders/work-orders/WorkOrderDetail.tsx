'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, ArrowLeft, Calendar, User, 
  Edit, Printer, Download, MapPin, Phone, Mail,
  CheckCircle, Clock,
  Play, FileText, Loader2,
  FileSignature, 
  ChevronRight, Share2, Copy, MoreVertical, AlertCircle,
  BarChart3, History, MessageSquare, EyeOff,
  Trash2, Eye, 
  RefreshCw, Truck as TruckIcon, 
  CreditCard as CreditCardIcon, Receipt as ReceiptIcon,
  ClipboardCheck, ClipboardList,
  ChevronLeft, 
  Circle, CircleDot, 
  FileCheck, FilePlus, FileX, ArrowRight,
  X, HelpCircle,
  CheckSquare, Check,
  Activity,
  Archive,
  Link as LinkIcon,
  Tag,
  Briefcase,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCheck,
  FileBarChart,
  Users,
  Package,
  Zap,
  DollarSign,
  FileWarning,
  ThumbsUp,
  UserCheck,
  AlertOctagon,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { workOrderService } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface WorkOrderDetailPageProps {
  orderId: string;
}

interface TechnicianNote {
  content: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  createdAt: string;
  isInternal: boolean;
  category: 'customer_communication' | 'observation' | 'issue' | 'other';
}

// Define stage status types
type StageStatus = 'not_started' | 'in_progress' | 'needs_approval' | 'approved' | 'completed' | 'rejected' | 'delayed';

interface WorkflowStage {
  id: string;
  stage: string;
  label: string;
  description?: string;
  status: StageStatus;
  completed: boolean;
  isCurrent: boolean;
  document?: any;
  documentId?: string;
  documentType?: string;
  actions: Array<{ 
    id: string; 
    label: string; 
    icon: React.ReactNode; 
    variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'; 
    description?: string;
    action: () => Promise<void> | void;
  }>;
  statusLabel: string;
  statusColor: string;
  statusIcon: React.ReactNode;
  requirements?: string[];
  completionDate?: string;
  approvalDate?: string;
  approvedBy?: string;
  icon: React.ReactNode;
  mandatory: boolean;
  estimatedTime: string;
  dependencies?: string[];
  canSkip: boolean;
  progress?: {
    percentage: number;
    completedSteps: number;
    totalSteps: number;
  };
  steps?: Array<{
    id: string;
    label: string;
    completed: boolean;
    description?: string;
    required?: boolean;
    action?: () => void;
  }>;
}

// Skeleton Loader Components
const SkeletonLoader = {
  Header: () => (
    <div className="animate-pulse">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 p-4 sm:p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-48 h-6 bg-white/30 rounded"></div>
                    <div className="w-20 h-6 bg-white/30 rounded-full"></div>
                  </div>
                  <div className="w-40 h-4 bg-white/30 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 bg-white/20 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  Tabs: () => (
    <div className="animate-pulse border-b border-gray-200 bg-white">
      <div className="px-6">
        <div className="flex space-x-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2 py-3 px-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),

  CurrentStage: () => (
    <div className="animate-pulse bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-lg"></div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-48 h-6 bg-blue-100 rounded"></div>
              <div className="w-20 h-6 bg-blue-100 rounded-full"></div>
            </div>
            <div className="w-96 h-4 bg-blue-100 rounded"></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <div className="w-24 h-4 bg-blue-100 rounded"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <div className="w-32 h-4 bg-blue-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-40 h-10 bg-blue-200 rounded-lg"></div>
      </div>
    </div>
  ),

  WorkflowProgress: () => (
    <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="w-40 h-5 bg-gray-200 rounded"></div>
          <div className="w-56 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2 text-right">
          <div className="w-24 h-4 bg-gray-200 rounded ml-auto"></div>
          <div className="w-20 h-3 bg-gray-200 rounded ml-auto"></div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
          <div className="w-12 h-5 bg-gray-200 rounded"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full"></div>
      </div>
      
      <div className="relative mb-8">
        <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-200"></div>
        <div className="relative flex justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
              <div className="text-center max-w-[120px] space-y-1">
                <div className="w-20 h-3 bg-gray-200 rounded mx-auto"></div>
                <div className="w-16 h-2 bg-gray-200 rounded mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-2">
            <div className="w-16 h-7 bg-gray-200 rounded mx-auto"></div>
            <div className="w-24 h-3 bg-gray-200 rounded mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  ),

  OverviewCards: () => (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-24 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  ),

  QuickActions: () => (
    <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6">
      <div className="w-32 h-5 bg-gray-200 rounded mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl border-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-32 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

const FullPageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
    <SkeletonLoader.Header />
    <SkeletonLoader.Tabs />
    <div className="p-6 space-y-6">
      <SkeletonLoader.CurrentStage />
      <SkeletonLoader.WorkflowProgress />
      <SkeletonLoader.OverviewCards />
      <SkeletonLoader.QuickActions />
    </div>
  </div>
);

export default function WorkOrderDetailPage({ orderId }: WorkOrderDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [technicianNotes, setTechnicianNotes] = useState<TechnicianNote[]>([]);
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [includeInternal, setIncludeInternal] = useState(false);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [delayExpectedDate, setDelayExpectedDate] = useState('');
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [showLinkInvoiceModal, setShowLinkInvoiceModal] = useState(false);
  const [invoiceIdToLink, setInvoiceIdToLink] = useState('');
  const [showCreateWaiverModal, setShowCreateWaiverModal] = useState(false);
  const [waiverNotes, setWaiverNotes] = useState('');
  const [waiverCreating, setWaiverCreating] = useState(false);

  useEffect(() => {
    fetchWorkOrder();
    fetchWorkOrderStats();
  }, [orderId]);

  useEffect(() => {
    if (workOrder && activeTab === 'technician-notes') {
      fetchTechnicianNotes();
    }
  }, [workOrder, activeTab, includeInternal]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const data = await workOrderService.getWorkOrderById(orderId);
      setWorkOrder(data);
      transformWorkOrderToStages(data);
    } catch (error) {
      console.error('Error fetching work order:', error);
      showToast('Failed to load work order details', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicianNotes = async () => {
    try {
      const notes = await workOrderService.getTechnicianNotes(orderId, includeInternal);
      setTechnicianNotes(notes);
    } catch (error) {
      console.error('Error fetching technician notes:', error);
    }
  };

  const fetchWorkOrderStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await workOrderService.getWorkOrderStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching work order stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Helper function to determine stage status
  const determineStageStatus = (order: any, stage: string): StageStatus => {
    // If work order has approval fields, use them
    if (order.stageApprovals && order.stageApprovals[stage]) {
      const stageApproval = order.stageApprovals[stage];
      if (stageApproval.approved) return 'approved';
      if (stageApproval.needsApproval) return 'needs_approval';
      if (stageApproval.rejected) return 'rejected';
    }

    // Fallback logic based on document IDs and current stage
    switch (stage) {
      case 'pre_checklist':
        if (!order.preChecklistId) return 'not_started';
        if (order.currentStage === 'pre_checklist') return 'in_progress';
        return 'completed';
      
      case 'job_card':
        if (!order.jobCards || order.jobCards.length === 0) return 'not_started';
        if (order.currentStage === 'job_card') return 'in_progress';
        return 'completed';
      
      case 'post_checklist':
        if (!order.postChecklistId) return 'not_started';
        if (order.currentStage === 'post_checklist') return 'in_progress';
        return 'completed';
      
      case 'invoice':
        if (!order.invoiceId) return 'not_started';
        if (order.invoiceGenerated && !order.invoicePaid) return 'needs_approval';
        if (order.invoicePaid) return 'approved';
        if (order.invoiceId) return 'completed';
        return 'in_progress';
      
      default:
        return 'not_started';
    }
  };

  // Helper function to get status display properties
  const getStageStatusDisplay = (status: StageStatus): { 
    label: string; 
    color: string; 
    icon: React.ReactNode;
    bgColor: string;
  } => {
    switch (status) {
      case 'not_started':
        return {
          label: 'Not Started',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: <Clock className="h-4 w-4" />
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: <PlayCircle className="h-4 w-4" />
        };
      case 'needs_approval':
        return {
          label: 'Needs Approval',
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          icon: <AlertOctagon className="h-4 w-4" />
        };
      case 'approved':
        return {
          label: 'Approved',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: <CheckCircle2 className="h-4 w-4" />
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: <X className="h-4 w-4" />
        };
      case 'delayed':
        return {
          label: 'Delayed',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          icon: <PauseCircle className="h-4 w-4" />
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: <HelpCircle className="h-4 w-4" />
        };
    }
  };

  // Helper function to get stage actions based on status
  const getStageActions = (order: any, stage: string, status: StageStatus) => {
    const baseActions = {
      pre_checklist: {
        not_started: [
          {
            id: 'create-pre-checklist',
            label: 'Create Checklist',
            icon: <FilePlus className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              router.push(`/pre-checklist/create?workOrderId=${order._id}`);
            }
          }
        ],
        in_progress: [
          {
            id: 'view-pre-checklist',
            label: 'Continue Checklist',
            icon: <Edit className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              if (order.preChecklistId) {
                router.push(`/pre-checklist/${order.preChecklistId}`);
              }
            }
          },
          {
            id: 'submit-approval',
            label: 'Submit for Approval',
            icon: <ThumbsUp className="h-4 w-4" />,
            variant: 'info' as const,
            action: async () => {
              try {
                // Use a more generic approach with stageApprovals
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    pre_checklist: {
                      needsApproval: true,
                      submittedAt: new Date().toISOString(),
                      submittedBy: 'current-user-id' // This should come from auth context
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Pre-checklist submitted for approval', 'success');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to submit for approval', 'error');
              }
            }
          }
        ],
        needs_approval: [
          {
            id: 'view-pre-checklist',
            label: 'Review Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              if (order.preChecklistId) {
                router.push(`/pre-checklist/${order.preChecklistId}`);
              }
            }
          },
          {
            id: 'approve-pre-checklist',
            label: 'Approve Checklist',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    pre_checklist: {
                      ...order.stageApprovals?.pre_checklist,
                      approved: true,
                      needsApproval: false,
                      approvedAt: new Date().toISOString(),
                      approvedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Pre-checklist approved successfully', 'success');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to approve checklist', 'error');
              }
            }
          },
          {
            id: 'reject-pre-checklist',
            label: 'Reject',
            icon: <X className="h-4 w-4" />,
            variant: 'danger' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    pre_checklist: {
                      ...order.stageApprovals?.pre_checklist,
                      needsApproval: false,
                      rejected: true,
                      rejectedAt: new Date().toISOString(),
                      rejectedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Pre-checklist rejected', 'warning');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to reject checklist', 'error');
              }
            }
          }
        ],
        approved: [
          {
            id: 'view-pre-checklist',
            label: 'View Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (order.preChecklistId) {
                router.push(`/pre-checklist/${order.preChecklistId}`);
              }
            }
          },
          {
            id: 'complete-stage',
            label: 'Move to Job Card',
            icon: <ArrowRight className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              await workOrderService.updateWorkOrderStage(order._id, 'job_card');
              showToast('Moving to Job Card stage', 'success');
              fetchWorkOrder();
            }
          }
        ],
        completed: [
          {
            id: 'view-pre-checklist',
            label: 'View Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (order.preChecklistId) {
                router.push(`/pre-checklist/${order.preChecklistId}`);
              }
            }
          }
        ]
      },
      job_card: {
        not_started: [
          {
            id: 'create-job-card',
            label: 'Create Job Card',
            icon: <FilePlus className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              router.push(`/job-cards/create?workOrderId=${order._id}`);
            }
          }
        ],
        in_progress: [
          {
            id: 'add-job-card',
            label: 'Add More Jobs',
            icon: <FilePlus className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              router.push(`/job-cards/create?workOrderId=${order._id}`);
            }
          },
          {
            id: 'view-job-cards',
            label: 'View Job Cards',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              router.push(`/job-cards?workOrderId=${order._id}`);
            }
          },
          {
            id: 'submit-approval',
            label: 'Submit for Approval',
            icon: <ThumbsUp className="h-4 w-4" />,
            variant: 'info' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    job_card: {
                      needsApproval: true,
                      submittedAt: new Date().toISOString(),
                      submittedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Job cards submitted for approval', 'success');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to submit for approval', 'error');
              }
            }
          }
        ],
        needs_approval: [
          {
            id: 'view-job-cards',
            label: 'Review Job Cards',
            icon: <Eye className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              router.push(`/job-cards?workOrderId=${order._id}`);
            }
          },
          {
            id: 'approve-job-cards',
            label: 'Approve Job Cards',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    job_card: {
                      ...order.stageApprovals?.job_card,
                      approved: true,
                      needsApproval: false,
                      approvedAt: new Date().toISOString(),
                      approvedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Job cards approved successfully', 'success');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to approve job cards', 'error');
              }
            }
          },
          {
            id: 'reject-job-cards',
            label: 'Reject',
            icon: <X className="h-4 w-4" />,
            variant: 'danger' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    job_card: {
                      ...order.stageApprovals?.job_card,
                      needsApproval: false,
                      rejected: true,
                      rejectedAt: new Date().toISOString(),
                      rejectedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Job cards rejected', 'warning');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to reject job cards', 'error');
              }
            }
          }
        ],
        approved: [
          {
            id: 'view-job-cards',
            label: 'View Job Cards',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              router.push(`/job-cards?workOrderId=${order._id}`);
            }
          },
          {
            id: 'complete-stage',
            label: 'Move to Post-Checklist',
            icon: <ArrowRight className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              await workOrderService.updateWorkOrderStage(order._id, 'post_checklist');
              showToast('Moving to Post-Checklist stage', 'success');
              fetchWorkOrder();
            }
          }
        ],
        completed: [
          {
            id: 'view-job-cards',
            label: 'View Job Cards',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              router.push(`/job-cards?workOrderId=${order._id}`);
            }
          }
        ]
      },
      post_checklist: {
        not_started: [
          {
            id: 'create-post-checklist',
            label: 'Create Checklist',
            icon: <FilePlus className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              router.push(`/post-checklist/create?workOrderId=${order._id}`);
            }
          }
        ],
        in_progress: [
          {
            id: 'view-post-checklist',
            label: 'Continue Checklist',
            icon: <Edit className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              if (order.postChecklistId) {
                router.push(`/post-checklist/${order.postChecklistId}`);
              }
            }
          },
          {
            id: 'submit-approval',
            label: 'Submit for Approval',
            icon: <ThumbsUp className="h-4 w-4" />,
            variant: 'info' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    post_checklist: {
                      needsApproval: true,
                      submittedAt: new Date().toISOString(),
                      submittedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Post-checklist submitted for approval', 'success');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to submit for approval', 'error');
              }
            }
          }
        ],
        needs_approval: [
          {
            id: 'view-post-checklist',
            label: 'Review Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              if (order.postChecklistId) {
                router.push(`/post-checklist/${order.postChecklistId}`);
              }
            }
          },
          {
            id: 'approve-post-checklist',
            label: 'Approve Checklist',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    post_checklist: {
                      ...order.stageApprovals?.post_checklist,
                      approved: true,
                      needsApproval: false,
                      approvedAt: new Date().toISOString(),
                      approvedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Post-checklist approved successfully', 'success');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to approve checklist', 'error');
              }
            }
          },
          {
            id: 'reject-post-checklist',
            label: 'Reject',
            icon: <X className="h-4 w-4" />,
            variant: 'danger' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    post_checklist: {
                      ...order.stageApprovals?.post_checklist,
                      needsApproval: false,
                      rejected: true,
                      rejectedAt: new Date().toISOString(),
                      rejectedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Post-checklist rejected', 'warning');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to reject checklist', 'error');
              }
            }
          }
        ],
        approved: [
          {
            id: 'view-post-checklist',
            label: 'View Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (order.postChecklistId) {
                router.push(`/post-checklist/${order.postChecklistId}`);
              }
            }
          },
          {
            id: 'complete-stage',
            label: 'Move to Invoice',
            icon: <ArrowRight className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              await workOrderService.updateWorkOrderStage(order._id, 'invoice');
              showToast('Moving to Invoice stage', 'success');
              fetchWorkOrder();
            }
          }
        ],
        completed: [
          {
            id: 'view-post-checklist',
            label: 'View Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (order.postChecklistId) {
                router.push(`/post-checklist/${order.postChecklistId}`);
              }
            }
          }
        ]
      },
      invoice: {
        not_started: [
          {
            id: 'generate-invoice',
            label: 'Generate Invoice',
            icon: <FilePlus className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              setShowGenerateInvoiceModal(true);
            }
          },
          {
            id: 'link-invoice',
            label: 'Link Invoice',
            icon: <LinkIcon className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              setShowLinkInvoiceModal(true);
            }
          }
        ],
        in_progress: [
          {
            id: 'view-invoice',
            label: 'View Invoice',
            icon: <Eye className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              if (order.invoiceId) {
                router.push(`/invoices/${order.invoiceId}`);
              }
            }
          },
          {
            id: 'mark-as-paid',
            label: 'Mark as Paid',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              try {
                const updateData: any = {
                  invoicePaid: true,
                  invoicePaymentDate: new Date().toISOString()
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Invoice marked as paid', 'success');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to mark invoice as paid', 'error');
              }
            }
          }
        ],
        needs_approval: [
          {
            id: 'view-invoice',
            label: 'Review Invoice',
            icon: <Eye className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              if (order.invoiceId) {
                router.push(`/invoices/${order.invoiceId}`);
              }
            }
          },
          {
            id: 'approve-invoice',
            label: 'Approve Payment',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              try {
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    invoice: {
                      ...order.stageApprovals?.invoice,
                      approved: true,
                      needsApproval: false,
                      approvedAt: new Date().toISOString(),
                      approvedBy: 'current-user-id'
                    }
                  }
                };
                await workOrderService.updateWorkOrder(order._id, updateData);
                showToast('Invoice payment approved', 'success');
                fetchWorkOrder();
              } catch (error) {
                showToast('Failed to approve invoice', 'error');
              }
            }
          }
        ],
        approved: [
          {
            id: 'view-invoice',
            label: 'View Invoice',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (order.invoiceId) {
                router.push(`/invoices/${order.invoiceId}`);
              }
            }
          },
          {
            id: 'complete-work-order',
            label: 'Complete Work Order',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              await handleStatusChange('completed');
            }
          }
        ],
        completed: [
          {
            id: 'view-invoice',
            label: 'View Invoice',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (order.invoiceId) {
                router.push(`/invoices/${order.invoiceId}`);
              }
            }
          }
        ]
      }
    };

    return baseActions[stage as keyof typeof baseActions]?.[status] || [];
  };

  const transformWorkOrderToStages = (order: any) => {
    // Main 4 stages
    const mainStages = [
      {
        id: 'pre-checklist',
        stage: 'pre_checklist',
        label: 'Pre-Checklist',
        description: 'Pre-service inspection and validation',
        icon: <ClipboardCheck className="h-5 w-5" />,
        mandatory: true,
        estimatedTime: '30-60 min',
        canSkip: false,
      },
      {
        id: 'job-card',
        stage: 'job_card',
        label: 'Job Card',
        description: 'Detailed job tasks and technician assignments',
        icon: <Wrench className="h-5 w-5" />,
        mandatory: true,
        estimatedTime: '2-4 hours',
        canSkip: false,
      },
      {
        id: 'post-checklist',
        stage: 'post_checklist',
        label: 'Post-Checklist',
        description: 'Post-service verification and quality check',
        icon: <ClipboardList className="h-5 w-5" />,
        mandatory: true,
        estimatedTime: '30-60 min',
        canSkip: false,
      },
      {
        id: 'invoice',
        stage: 'invoice',
        label: 'Invoice',
        description: 'Generate and manage billing',
        icon: <ReceiptIcon className="h-5 w-5" />,
        mandatory: true,
        estimatedTime: '30 min',
        canSkip: false,
      }
    ];

    const stagesWithStatus = mainStages.map(stageConfig => {
      const status = determineStageStatus(order, stageConfig.stage);
      const statusDisplay = getStageStatusDisplay(status);
      const actions = getStageActions(order, stageConfig.stage, status);
      
      // Get approval info from stageApprovals if available
      const stageApproval = order.stageApprovals?.[stageConfig.stage];
      
      return {
        ...stageConfig,
        status,
        statusLabel: statusDisplay.label,
        statusColor: statusDisplay.color,
        statusIcon: statusDisplay.icon,
        completed: status === 'completed' || status === 'approved',
        isCurrent: order.currentStage === stageConfig.stage,
        documentId: order[`${stageConfig.stage}Id`],
        actions: actions as any[],
        // Add approval information if available
        approvalDate: stageApproval?.approvedAt || stageApproval?.submittedAt,
        approvedBy: stageApproval?.approvedBy || stageApproval?.submittedBy,
        // Add completion date
        completionDate: order[`${stageConfig.stage}CompletionDate`] || 
                       (status === 'completed' || status === 'approved' ? new Date().toISOString() : undefined)
      };
    });

    setWorkflowStages(stagesWithStatus);
  };

  const handleAddTechnicianNote = async () => {
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      await workOrderService.addTechnicianNote(orderId, {
        content: newNote,
        isInternal: false,
        category: 'customer_communication'
      });
      
      setNewNote('');
      showToast('Note added successfully', 'success');
      fetchTechnicianNotes();
    } catch (error) {
      showToast('Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleMarkAsDelayed = async () => {
    if (!delayReason.trim()) {
      showToast('Please provide a delay reason', 'warning');
      return;
    }

    try {
      await workOrderService.markAsDelayed(orderId, {
        reason: delayReason,
        expectedCompletionDate: delayExpectedDate || undefined
      });
      
      setShowDelayModal(false);
      setDelayReason('');
      setDelayExpectedDate('');
      showToast('Work order marked as delayed', 'success');
      fetchWorkOrder();
    } catch (error) {
      showToast('Failed to mark as delayed', 'error');
    }
  };

  const handleCreateWaiver = async () => {
    if (!waiverNotes.trim()) {
      showToast('Please provide waiver notes', 'warning');
      return;
    }

    try {
      setWaiverCreating(true);
      
      // Create waiver
      const waiverResponse = await fetch('/api/waivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workOrderId: orderId,
          opportunityId: workOrder.opportunityId,
          notes: waiverNotes,
          status: 'pending'
        }),
      });

      if (!waiverResponse.ok) {
        throw new Error('Failed to create waiver');
      }

      const waiverData = await waiverResponse.json();
      
      // Link waiver to work order using generic update
      const updateData: any = {
        waiverId: waiverData._id
      };
      await workOrderService.updateWorkOrder(orderId, updateData);
      
      setShowCreateWaiverModal(false);
      setWaiverNotes('');
      showToast('Waiver created successfully', 'success');
      fetchWorkOrder();
    } catch (error) {
      console.error('Error creating waiver:', error);
      showToast('Failed to create waiver', 'error');
    } finally {
      setWaiverCreating(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const result = await workOrderService.generateInvoice(orderId);
      showToast('Invoice generated successfully', 'success');
      setShowGenerateInvoiceModal(false);
      fetchWorkOrder();
    } catch (error) {
      showToast('Failed to generate invoice', 'error');
    }
  };

  const handleLinkInvoice = async () => {
    if (!invoiceIdToLink.trim()) {
      showToast('Please enter an invoice ID', 'warning');
      return;
    }

    try {
      await workOrderService.linkInvoice(orderId, invoiceIdToLink);
      showToast('Invoice linked successfully', 'success');
      setShowLinkInvoiceModal(false);
      setInvoiceIdToLink('');
      fetchWorkOrder();
    } catch (error) {
      showToast('Failed to link invoice', 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await workOrderService.updateWorkOrderStatus(orderId, newStatus);
      showToast(`Status changed to ${workOrderService.getStatusLabel(newStatus)}`, 'success');
      fetchWorkOrder();
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleStageAction = async (stage: WorkflowStage, action: any) => {
    try {
      await action.action();
    } catch (error) {
      console.error('Stage action failed:', error);
      showToast('Action failed', 'error');
    }
  };

  const getCurrentStage = () => {
    return workflowStages.find(stage => stage.isCurrent);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <FullPageSkeleton />;
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Work Order Not Found</h3>
          <p className="text-gray-600 mb-6">The work order you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/orders/work-orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Work Orders
          </button>
        </div>
      </div>
    );
  }

  const currentStage = getCurrentStage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 p-4 sm:p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/orders/work-orders')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-white">{workOrder.workOrderNumber}</h1>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      workOrderService.getStatusColor(workOrder.status)
                    }`}>
                      {workOrderService.getStatusIcon(workOrder.status)}
                      {workOrderService.getStatusLabel(workOrder.status)}
                    </span>
                  </div>
                  <p className="text-sm text-white/90">Created {formatDate(workOrder.createdAt)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Print"
              >
                <Printer className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => {}}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Export"
              >
                <Download className="h-5 w-5 text-white" />
              </button>
              <Link
                href={`/orders/work-orders/${workOrder._id}/edit`}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors relative"
                title="More actions"
              >
                <MoreVertical className="h-5 w-5 text-white" />
                {showActionsMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Mark as Complete
                    </button>
                    <button
                      onClick={() => setShowDelayModal(true)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Mark as Delayed
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Cancel Work Order
                    </button>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 bg-white rounded-xl mb-6">
          <nav className="flex space-x-8 overflow-x-auto px-6">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
              { id: 'stages', label: 'Stages', icon: <CheckCheck className="h-4 w-4" /> },
              { id: 'quotations', label: 'Quotations', icon: <DollarSign className="h-4 w-4" /> },
              { id: 'waiver', label: 'Waiver', icon: <FileSignature className="h-4 w-4" /> },
              { id: 'delays', label: 'Delays', icon: <AlertTriangle className="h-4 w-4" /> },
              { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
              { id: 'technician-notes', label: 'Technician Notes', icon: <MessageSquare className="h-4 w-4" /> },
              { id: 'activity', label: 'Activity', icon: <History className="h-4 w-4" /> },
              { id: 'stats', label: 'Statistics', icon: <TrendingUp className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {/* Badge for delays if present */}
                {tab.id === 'delays' && workOrder.delayInfo && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                    1
                  </span>
                )}
                {/* Badge for quotations if present */}
                {tab.id === 'quotations' && workOrder.quoteId && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    1
                  </span>
                )}
                {/* Badge for waiver if present */}
                {tab.id === 'waiver' && workOrder.waiverId && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    1
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Stage */}
              {currentStage && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${getStageStatusDisplay(currentStage.status).bgColor}`}>
                        {currentStage.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl font-semibold text-gray-900">Current Stage: {currentStage.label}</h2>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStageStatusDisplay(currentStage.status).bgColor} ${currentStage.statusColor}`}>
                            {currentStage.statusIcon}
                            {currentStage.statusLabel}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{currentStage.description}</p>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{currentStage.estimatedTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {currentStage.mandatory ? (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {currentStage.mandatory ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          {currentStage.approvalDate && (
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-700">
                                Approved: {formatDate(currentStage.approvalDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentStage.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleStageAction(currentStage, action)}
                          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                            action.variant === 'primary'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : action.variant === 'secondary'
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : action.variant === 'success'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : action.variant === 'danger'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : action.variant === 'warning'
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : action.variant === 'info'
                              ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4-Stage Progress Bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Workflow Progress</h3>
                    <p className="text-sm text-gray-600">Track progress through the 4 main stages</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {workflowStages.filter(s => s.completed).length} of {workflowStages.length} completed
                    </p>
                    <p className="text-xs text-gray-500">
                      {workOrder.currentStage ? `Current: ${workOrderService.getStageLabel(workOrder.currentStage)}` : 'Not started'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-lg font-bold text-blue-600">
                      {Math.round((workflowStages.filter(s => s.completed).length / workflowStages.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(workflowStages.filter(s => s.completed).length / workflowStages.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* 4-Stage Timeline */}
                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute left-0 right-0 top-8 h-0.5 bg-gray-200"></div>
                  
                  <div className="relative grid grid-cols-4 gap-4">
                    {workflowStages.map((stage, index) => {
                      const statusDisplay = getStageStatusDisplay(stage.status);
                      return (
                        <div key={stage.id} className="flex flex-col items-center">
                          {/* Stage Circle */}
                          <div className={`relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center mb-3 ${
                            stage.completed
                              ? 'bg-green-100 border-green-500 text-green-600'
                              : stage.isCurrent
                              ? 'bg-blue-100 border-blue-500 text-blue-600 animate-pulse'
                              : stage.status === 'needs_approval'
                              ? 'bg-amber-100 border-amber-500 text-amber-600'
                              : stage.status === 'in_progress'
                              ? 'bg-blue-100 border-blue-500 text-blue-600'
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                          }`}>
                            {stage.icon}
                            {stage.status === 'approved' && (
                              <div className="absolute -top-1 -right-1">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                            {stage.status === 'needs_approval' && (
                              <div className="absolute -top-1 -right-1">
                                <AlertOctagon className="h-5 w-5 text-amber-500" />
                              </div>
                            )}
                            {stage.status === 'completed' && (
                              <div className="absolute -top-1 -right-1">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                          </div>
                          
                          {/* Stage Label */}
                          <div className="text-center">
                            <h4 className="font-semibold text-gray-900 mb-1">{stage.label}</h4>
                            <div className="mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                                {statusDisplay.icon}
                                {statusDisplay.label}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{stage.estimatedTime}</span>
                            </div>
                            {stage.completionDate && (
                              <p className="text-xs text-green-600 mt-1">
                                {formatDate(stage.completionDate)}
                              </p>
                            )}
                            {stage.approvalDate && (
                              <p className="text-xs text-green-600 mt-1">
                                Approved: {formatDate(stage.approvalDate)}
                              </p>
                            )}
                          </div>
                          
                          {/* Stage Number */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                              stage.completed || stage.isCurrent || stage.status === 'approved' || stage.status === 'needs_approval'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Customer</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-gray-900">
                      {workOrderService.getCustomerName(workOrder)}
                    </p>
                    {workOrderService.getCustomerEmail(workOrder) && (
                      <p className="text-gray-600">
                        <Mail className="h-4 w-4 inline mr-2" />
                        {workOrderService.getCustomerEmail(workOrder)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <CreditCardIcon className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Cost Summary</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labor:</span>
                      <span className="font-semibold">{formatCurrency(workOrder.laborCost || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parts:</span>
                      <span className="font-semibold">{formatCurrency(workOrder.partsCost || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span className="text-gray-900 font-semibold">Total:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {formatCurrency(workOrder.totalCost || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start:</span>
                      <span className="font-semibold">{formatDate(workOrder.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Completion:</span>
                      <span className="font-semibold">{formatDate(workOrder.estimatedCompletionDate)}</span>
                    </div>
                    {workOrder.actualCompletionDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-semibold text-green-600">{formatDate(workOrder.actualCompletionDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-6">
              {/* Stages List */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Stages</h3>
                <div className="space-y-4">
                  {workflowStages.map((stage) => {
                    const statusDisplay = getStageStatusDisplay(stage.status);
                    return (
                      <div
                        key={stage.id}
                        className={`p-4 rounded-lg border-2 ${
                          stage.status === 'completed' || stage.status === 'approved'
                            ? 'bg-green-50 border-green-200'
                            : stage.isCurrent
                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                            : stage.status === 'needs_approval'
                            ? 'bg-amber-50 border-amber-200'
                            : stage.status === 'in_progress'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${statusDisplay.bgColor}`}>
                              {stage.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{stage.label}</h4>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                                  {statusDisplay.icon}
                                  {statusDisplay.label}
                                </span>
                                {stage.approvalDate && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <UserCheck className="h-3 w-3" />
                                    Approved
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{stage.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {stage.estimatedTime}
                                </span>
                                {stage.mandatory && (
                                  <span className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    Required
                                  </span>
                                )}
                                {stage.completionDate && (
                                  <span className="text-gray-500">
                                    Completed: {formatDate(stage.completionDate)}
                                  </span>
                                )}
                                {stage.approvalDate && (
                                  <span className="text-green-600">
                                    Approved: {formatDate(stage.approvalDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {stage.actions.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => handleStageAction(stage, action)}
                                className={`px-3 py-1.5 rounded text-sm font-medium ${
                                  action.variant === 'primary'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : action.variant === 'secondary'
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : action.variant === 'success'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : action.variant === 'danger'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : action.variant === 'warning'
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : action.variant === 'info'
                                    ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {action.icon}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quotations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Quotations</h3>
                    <p className="text-sm text-gray-600">View and manage quotations for this work order</p>
                  </div>
                  {workOrder.quoteId ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Quotation Linked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      <AlertCircle className="h-4 w-4" />
                      No Quotation
                    </span>
                  )}
                </div>

                {workOrder.quoteId ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Linked Quotation</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-sm text-gray-600">Quotation Number:</span>
                                <p className="font-medium">
                                  {typeof workOrder.quoteId === 'object' 
                                    ? workOrder.quoteId.quoteNumber 
                                    : `QUOTE-${workOrder.quoteId.slice(-8).toUpperCase()}`}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Amount:</span>
                                <p className="font-medium text-green-600">
                                  {typeof workOrder.quoteId === 'object' 
                                    ? formatCurrency(workOrder.quoteId.totalAmount)
                                    : 'KES --'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const quoteId = typeof workOrder.quoteId === 'object' 
                              ? workOrder.quoteId._id 
                              : workOrder.quoteId;
                            router.push(`/quotes/${quoteId}`);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Quotation
                        </button>
                      </div>
                    </div>
                    
                    {workOrder.quoteId && typeof workOrder.quoteId === 'object' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              workOrder.quoteId.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : workOrder.quoteId.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : workOrder.quoteId.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {workOrder.quoteId.status?.charAt(0).toUpperCase() + workOrder.quoteId.status?.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Created Date</h4>
                          <p>{formatDate(workOrder.quoteId.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Quotation Linked</h4>
                    <p className="text-gray-600 mb-6">
                      This work order doesn't have a linked quotation. You can link an existing quotation or create a new one.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => router.push(`/quotes/create?workOrderId=${workOrder._id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FilePlus className="h-4 w-4" />
                        Create Quotation
                      </button>
                      <button
                        onClick={() => router.push('/quotes')}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Link Existing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'waiver' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Waiver & Authorization</h3>
                    <p className="text-sm text-gray-600">Manage customer waivers and authorizations</p>
                  </div>
                  {workOrder.waiverId ? (
                    <button
                      onClick={() => setShowCreateWaiverModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FileSignature className="h-4 w-4" />
                      Update Waiver
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCreateWaiverModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FileSignature className="h-4 w-4" />
                      Create Waiver
                    </button>
                  )}
                </div>

                {workOrder.waiverId ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileSignature className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Waiver Created</h4>
                          </div>
                          <p className="text-gray-600">
                            A waiver has been created for this work order. Customer authorization is pending.
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/waivers/${workOrder.waiverId}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Waiver
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileWarning className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Waiver Created</h4>
                    <p className="text-gray-600 mb-6">
                      A waiver may be required for this work order to authorize specific services or acknowledge risks.
                    </p>
                    <button
                      onClick={() => setShowCreateWaiverModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FileSignature className="h-4 w-4" />
                      Create Waiver
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'delays' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delays & Issues</h3>
                    <p className="text-sm text-gray-600">Track and manage delays affecting this work order</p>
                  </div>
                  <button
                    onClick={() => setShowDelayModal(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Report Delay
                  </button>
                </div>

                {workOrder.delayInfo ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <h4 className="font-semibold text-gray-900">Active Delay</h4>
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-700">{workOrder.delayInfo.reason}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-500" />
                                Reported: {formatDate(workOrder.delayInfo.reportedAt)}
                              </span>
                              {workOrder.delayInfo.expectedCompletionDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  New ETA: {formatDate(workOrder.delayInfo.expectedCompletionDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await workOrderService.updateWorkOrder(orderId, { delayInfo: null });
                              showToast('Delay resolved successfully', 'success');
                              fetchWorkOrder();
                            } catch (error) {
                              showToast('Failed to resolve delay', 'error');
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Active Delays</h4>
                    <p className="text-gray-600">This work order is currently on schedule.</p>
                  </div>
                )}

                {/* Delay History */}
                {workOrder.delayHistory && workOrder.delayHistory.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-4">Delay History</h4>
                    <div className="space-y-3">
                      {workOrder.delayHistory.map((delay: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{delay.reason}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>Reported: {formatDateTime(delay.reportedAt)}</span>
                                {delay.resolvedAt && (
                                  <span className="text-green-600">
                                    Resolved: {formatDateTime(delay.resolvedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {delay.resolvedAt ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Resolved
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    <p className="text-sm text-gray-600">All documents related to this work order</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <FilePlus className="h-4 w-4" />
                    Upload Document
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Pre-Checklist */}
                  {workOrder.preChecklistId && (
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Pre-Checklist</h4>
                          <p className="text-sm text-gray-600">Pre-service inspection</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          workOrder.preChecklistApproved 
                            ? 'bg-green-100 text-green-800'
                            : workOrder.preChecklistNeedsApproval
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workOrder.preChecklistApproved ? 'Approved' : workOrder.preChecklistNeedsApproval ? 'Pending Approval' : 'Draft'}
                        </span>
                        <button
                          onClick={() => router.push(`/pre-checklist/${workOrder.preChecklistId}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Job Cards */}
                  {workOrder.jobCards && workOrder.jobCards.length > 0 && (
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Job Cards</h4>
                          <p className="text-sm text-gray-600">
                            {workOrder.jobCards.length} job{workOrder.jobCards.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          workOrder.jobCardsApproved 
                            ? 'bg-green-100 text-green-800'
                            : workOrder.jobCardsNeedApproval
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workOrder.jobCardsApproved ? 'Approved' : workOrder.jobCardsNeedApproval ? 'Pending Approval' : 'In Progress'}
                        </span>
                        <button
                          onClick={() => router.push(`/job-cards?workOrderId=${workOrder._id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Post-Checklist */}
                  {workOrder.postChecklistId && (
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Post-Checklist</h4>
                          <p className="text-sm text-gray-600">Post-service verification</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          workOrder.postChecklistApproved 
                            ? 'bg-green-100 text-green-800'
                            : workOrder.postChecklistNeedsApproval
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workOrder.postChecklistApproved ? 'Approved' : workOrder.postChecklistNeedsApproval ? 'Pending Approval' : 'Draft'}
                        </span>
                        <button
                          onClick={() => router.push(`/post-checklist/${workOrder.postChecklistId}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoice */}
                  {workOrder.invoiceId && (
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <ReceiptIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Invoice</h4>
                          <p className="text-sm text-gray-600">Billing document</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          workOrder.invoicePaid 
                            ? 'bg-green-100 text-green-800'
                            : workOrder.invoiceGenerated
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workOrder.invoicePaid ? 'Paid' : workOrder.invoiceGenerated ? 'Generated' : 'Draft'}
                        </span>
                        <button
                          onClick={() => router.push(`/invoices/${workOrder.invoiceId}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {workOrder.attachments && workOrder.attachments.length > 0 && (
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Attachments</h4>
                          <p className="text-sm text-gray-600">
                            {workOrder.attachments.length} file{workOrder.attachments.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {workOrder.attachments.slice(0, 2).map((attachment: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate">{attachment.name}</span>
                            <button className="text-blue-600 hover:text-blue-700">
                              Download
                            </button>
                          </div>
                        ))}
                        {workOrder.attachments.length > 2 && (
                          <p className="text-sm text-gray-500">
                            +{workOrder.attachments.length - 2} more files
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'technician-notes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Technician Notes</h3>
                    <p className="text-sm text-gray-600">Notes and observations from technicians</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={includeInternal}
                        onChange={(e) => setIncludeInternal(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Show Internal Notes
                    </label>
                    <span className="text-sm text-gray-500">
                      {technicianNotes.length} note{technicianNotes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Add Note Form */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Add New Note</h4>
                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter your note here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={includeInternal}
                            onChange={(e) => setIncludeInternal(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Internal Note
                        </label>
                        <select className="text-sm border border-gray-300 rounded-lg px-2 py-1">
                          <option value="customer_communication">Customer Communication</option>
                          <option value="observation">Observation</option>
                          <option value="issue">Issue</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <button
                        onClick={handleAddTechnicianNote}
                        disabled={addingNote || !newNote.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {addingNote ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4" />
                            Add Note
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {technicianNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Notes Yet</h4>
                      <p className="text-gray-600">Add the first note for this work order.</p>
                    </div>
                  ) : (
                    technicianNotes.map((note, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg ${
                          note.isInternal
                            ? 'border-purple-200 bg-purple-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {note.createdBy.firstName} {note.createdBy.lastName}
                            </span>
                            {note.isInternal && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                Internal
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {formatDateTime(note.createdAt)}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full capitalize">
                            {note.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
                    <p className="text-sm text-gray-600">Complete history of this work order</p>
                  </div>
                  <button
                    onClick={fetchWorkOrder}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <RefreshCw className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  {workOrder.activityLog && workOrder.activityLog.length > 0 ? (
                    workOrder.activityLog.map((activity: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="mt-1">
                          <div className={`p-1.5 rounded-full ${
                            activity.type === 'status_change' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'stage_change' ? 'bg-green-100 text-green-600' :
                            activity.type === 'note_added' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {activity.type === 'status_change' && <Activity className="h-3 w-3" />}
                            {activity.type === 'stage_change' && <ArrowRight className="h-3 w-3" />}
                            {activity.type === 'note_added' && <MessageSquare className="h-3 w-3" />}
                            {activity.type === 'document_created' && <FileText className="h-3 w-3" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {activity.user?.firstName} {activity.user?.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-700">{activity.description}</p>
                          {activity.details && (
                            <div className="mt-1 text-sm text-gray-500">
                              {Object.entries(activity.details).map(([key, value]: [string, any]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {value.toString()}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h4>
                      <p className="text-gray-600">Activity will appear as the work order progresses.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Work Order Statistics</h3>
                    <p className="text-sm text-gray-600">Performance metrics and analytics</p>
                  </div>
                  {statsLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {statsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading statistics...</p>
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Stage Duration Stats */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Stage Durations</h4>
                      <div className="space-y-3">
                        {Object.entries(stats.stageDurations || {}).map(([stage, duration]: [string, any]) => (
                          <div key={stage} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 capitalize">
                              {stage.replace('_', ' ')}:
                            </span>
                            <span className="font-medium">
                              {duration > 60 ? `${Math.round(duration / 60)}h` : `${Math.round(duration)}m`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Completion Rate</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">On Time:</span>
                          <span className="font-medium text-green-600">
                            {stats.completionRate?.onTime || 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Delayed:</span>
                          <span className="font-medium text-amber-600">
                            {stats.completionRate?.delayed || 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Average Delay:</span>
                          <span className="font-medium">
                            {stats.completionRate?.averageDelayDays || 0} days
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Efficiency */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Cost Efficiency</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Labor vs Parts:</span>
                          <span className="font-medium">
                            {Math.round((workOrder.laborCost / workOrder.totalCost) * 100) || 0}% : 
                            {Math.round((workOrder.partsCost / workOrder.totalCost) * 100) || 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Margin:</span>
                          <span className="font-medium text-green-600">
                            {stats.costEfficiency?.margin || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Quality Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Re-work Rate:</span>
                          <span className="font-medium">
                            {stats.qualityMetrics?.reworkRate || 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Customer Satisfaction:</span>
                          <span className="font-medium text-green-600">
                            {stats.qualityMetrics?.customerSatisfaction || 0}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Technician Performance */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Technician Performance</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Efficiency:</span>
                          <span className="font-medium">
                            {stats.technicianPerformance?.efficiency || 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Quality Score:</span>
                          <span className="font-medium">
                            {stats.technicianPerformance?.qualityScore || 0}/10
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Document Compliance */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Document Compliance</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Completion Rate:</span>
                          <span className="font-medium">
                            {stats.documentCompliance?.completionRate || 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Approval Rate:</span>
                          <span className="font-medium">
                            {stats.documentCompliance?.approvalRate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Statistics Available</h4>
                    <p className="text-gray-600">Statistics will appear as work progresses.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Delay Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Delay</h3>
              <button
                onClick={() => setShowDelayModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay Reason
                </label>
                <textarea
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="Describe the reason for the delay..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Completion Date
                </label>
                <input
                  type="date"
                  value={delayExpectedDate}
                  onChange={(e) => setDelayExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDelayModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsDelayed}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Mark as Delayed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenerateInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generate Invoice</h3>
              <button
                onClick={() => setShowGenerateInvoiceModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              This will create a new invoice based on the work order details. The invoice will include all labor and parts costs.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateInvoiceModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Invoice Modal */}
      {showLinkInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Link Existing Invoice</h3>
              <button
                onClick={() => setShowLinkInvoiceModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice ID
                </label>
                <input
                  type="text"
                  value={invoiceIdToLink}
                  onChange={(e) => setInvoiceIdToLink(e.target.value)}
                  placeholder="Enter invoice ID or invoice number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLinkInvoiceModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkInvoice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Link Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Waiver Modal */}
      {showCreateWaiverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Waiver</h3>
              <button
                onClick={() => setShowCreateWaiverModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waiver Notes
                </label>
                <textarea
                  value={waiverNotes}
                  onChange={(e) => setWaiverNotes(e.target.value)}
                  placeholder="Describe what the waiver is for..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateWaiverModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWaiver}
                  disabled={waiverCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {waiverCreating ? 'Creating...' : 'Create Waiver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}