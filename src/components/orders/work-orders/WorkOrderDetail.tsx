'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Plus,
  Sparkles,
  Info
} from 'lucide-react';
import { workOrderService, WorkOrder, TechnicianNote } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { preChecklistService } from '@/services/preChecklistService';
import { postChecklistService } from '@/services/postChecklistService';

interface WorkOrderDetailPageProps {
  orderId: string;
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
          {[1, 2, 3, 4].map((i) => (
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
    </div>
  ),

  OverviewCards: () => (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
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
};

const FullPageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
    <SkeletonLoader.Header />
    <SkeletonLoader.Tabs />
    <div className="p-6 space-y-6">
      <SkeletonLoader.CurrentStage />
      <SkeletonLoader.WorkflowProgress />
      <SkeletonLoader.OverviewCards />
    </div>
  </div>
);

export default function WorkOrderDetailPage({ orderId }: WorkOrderDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [technicianNotes, setTechnicianNotes] = useState<TechnicianNote[]>([]);
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [includeInternal, setIncludeInternal] = useState(false);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [delayExpectedDate, setDelayExpectedDate] = useState('');
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [showLinkInvoiceModal, setShowLinkInvoiceModal] = useState(false);
  const [invoiceIdToLink, setInvoiceIdToLink] = useState('');
  const [preChecklist, setPreChecklist] = useState<any>(null);
  const [postChecklist, setPostChecklist] = useState<any>(null);
  const [loadingPreChecklist, setLoadingPreChecklist] = useState(false);
  const [loadingPostChecklist, setLoadingPostChecklist] = useState(false);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    fetchWorkOrder();
  }, [orderId]);

  useEffect(() => {
    if (workOrder && activeTab === 'technician-notes') {
      fetchTechnicianNotes();
    }
  }, [workOrder, activeTab, includeInternal]);

  useEffect(() => {
    if (workOrder && activeTab === 'post-checklist' && workOrder?.postChecklistId) {
      fetchPostChecklist();
    }
  }, [workOrder, activeTab]);

  const fetchPreChecklist = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchInProgressRef.current || !workOrder?.preChecklistId) {
      return;
    }
    
    fetchInProgressRef.current = true;
    setLoadingPreChecklist(true);
    
    try {
      const data = await preChecklistService.getPreChecklistById(workOrder.preChecklistId);
      setPreChecklist(data);
    } catch (error) {
      console.error('Failed to fetch pre-checklist:', error);
      
      // Only create fallback if we don't have any data yet
      if (!preChecklist) {
        setPreChecklist({
          _id: workOrder.preChecklistId,
          id: workOrder.preChecklistId,
          opportunityId: workOrder.opportunityId || '',
          vehicleId: workOrder.vehicleId || '',
          inspectionItems: [],
          remarks: 'Checklist exists but full details unavailable',
          approved: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
      }
    } finally {
      setLoadingPreChecklist(false);
      fetchInProgressRef.current = false;
    }
  }, [workOrder?.preChecklistId, workOrder?.opportunityId, workOrder?.vehicleId, preChecklist, showToast]);

  useEffect(() => {
    if (activeTab === 'pre-checklist' && workOrder?.preChecklistId) {
      // Add a small delay and check if we need to fetch
      const timer = setTimeout(() => {
        if (!preChecklist || preChecklist._id !== workOrder.preChecklistId) {
          fetchPreChecklist();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, workOrder?.preChecklistId, preChecklist, fetchPreChecklist]);
  // Add this function
  const fetchPostChecklist = async () => {
    try {
      setLoadingPostChecklist(true);
      const data = await postChecklistService.getPostChecklistById(workOrder.postChecklistId);
      setPostChecklist(data);
    } catch (error) {
      console.error('Error fetching post-checklist:', error);
    }
  };

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

  // Helper function to determine stage status
  const determineStageStatus = (order: WorkOrder, stage: string): StageStatus => {
    const lifecycleStage = order.currentStage;
    const stageOrder = ['prechecklist', 'jobcard', 'postchecklist', 'invoice'];
    const currentIndex = stageOrder.indexOf(lifecycleStage);
    const stageIndex = stageOrder.indexOf(stage);
    
    if (stageIndex < currentIndex) {
      return 'completed';
    }
    
    if (stageIndex === currentIndex) {
      // Check if stage has document
      const documentId = getStageDocumentId(order, stage);
      if (documentId) {
        // Check if document is approved
        const isApproved = checkStageApproval(order, stage);
        if (isApproved) {
          return 'approved';
        }
        return 'in_progress';
      }
      return 'not_started';
    }
    
    return 'not_started';
  };

  const getStageDocumentId = (order: WorkOrder, stage: string): string | undefined => {
    switch (stage) {
      case 'prechecklist': return order.preChecklistId;
      case 'jobcard': return order.jobCards?.[0]?._id;
      case 'postchecklist': return order.postChecklistId;
      case 'invoice': return order.invoiceId;
      default: return undefined;
    }
  };

  // Helper function to check stage approval
  const checkStageApproval = (order: WorkOrder, stage: string): boolean => {
    const stageApproval = order.stageApprovals?.[stage as keyof typeof order.stageApprovals];
    return stageApproval?.approved || false;
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
  const getStageActions = (order: WorkOrder, stage: string, status: StageStatus) => {
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
                const updateData: any = {
                  stageApprovals: {
                    ...order.stageApprovals,
                    pre_checklist: {
                      needsApproval: true,
                      submittedAt: new Date().toISOString(),
                      submittedBy: 'current-user-id'
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

  const viewStageDocument = (stage: WorkflowStage) => {
    if (!stage.documentId) return;
    
    switch (stage.stage) {
      case 'prechecklist':
        router.push(`/pre-checklist/${stage.documentId}?workOrderId=${workOrder._id}`);
        break;
      case 'postchecklist':
        router.push(`/post-checklist/${stage.documentId}?workOrderId=${workOrder._id}`);
        break;
      case 'jobcard':
        router.push(`/job-cards/${stage.documentId}`);
        break;
      case 'invoice':
        router.push(`/invoices/${stage.documentId}`);
        break;
    }
  };

  const createStageDocument = async (stage: string) => {
    try {
      switch (stage) {
        case 'prechecklist':
          router.push(`/pre-checklist/create?workOrderId=${workOrder._id}&source=workflow`);
          break;
        case 'jobcard':
          router.push(`/job-cards/create?workOrderId=${workOrder._id}`);
          break;
        case 'postchecklist':
          router.push(`/post-checklist/create?workOrderId=${workOrder._id}&preChecklistId=${workOrder.preChecklistId}&source=workflow`);
          break;
        case 'invoice':
          setShowGenerateInvoiceModal(true);
          break;
      }
    } catch (error) {
      console.error('Error creating document:', error);
      showToast('Failed to create document', 'error');
    }
  };

  const approveStage = async (stage: string, documentId: string) => {
    try {
      let result;
      switch (stage) {
        case 'prechecklist':
          result = await preChecklistService.approvePreChecklistWithLifecycle(
            documentId, 
            'current-user-id'
          );
          break;
        case 'postchecklist':
          result = await postChecklistService.approvePostChecklistWithLifecycle(
            documentId,
            'current-user-id'
          );
          break;
        // Add other stages as needed
      }
      
      if (result?.lifecycleUpdate?.stageCompleted) {
        showToast(`Stage approved and auto-transitioned to next stage`, 'success');
      } else {
        showToast('Stage approved successfully', 'success');
      }
      
      // Refresh data
      fetchWorkOrder();
      if (stage === 'prechecklist') fetchPreChecklist();
      if (stage === 'postchecklist') fetchPostChecklist();
      
    } catch (error) {
      console.error('Error approving stage:', error);
      showToast('Failed to approve stage', 'error');
    }
  };

  const approvePreChecklist = async (checklistId: string) => {
    try {
      const result = await preChecklistService.approvePreChecklistWithLifecycle(
        checklistId,
        'current-user-id'
      );
      
      if (result.lifecycleUpdate?.stageCompleted) {
        if (result.lifecycleUpdate.nextStage) {
          showToast(`Pre-checklist approved! Auto-advanced to ${result.lifecycleUpdate.nextStage}`, 'success');
        } else {
          showToast('Pre-checklist approved! Stage marked as complete.', 'success');
        }
      } else {
        showToast('Pre-checklist approved!', 'success');
      }
      
      fetchWorkOrder();
      fetchPreChecklist();
    } catch (error) {
      console.error('Error approving pre-checklist:', error);
      showToast('Failed to approve pre-checklist', 'error');
    }
  };

  const transformWorkOrderToStages = (order: WorkOrder) => {
    const mainStages = [
      {
        id: 'prechecklist',
        stage: 'prechecklist',
        label: 'Pre-Checklist',
        description: 'Pre-service inspection and validation',
        icon: <ClipboardCheck className="h-5 w-5" />,
        mandatory: true,
        estimatedTime: '30-60 min',
        canSkip: false,
      },
      {
        id: 'jobcard',
        stage: 'jobcard',
        label: 'Job Card',
        description: 'Detailed job tasks and technician assignments',
        icon: <Wrench className="h-5 w-5" />,
        mandatory: true,
        estimatedTime: '2-4 hours',
        canSkip: false,
      },
      {
        id: 'postchecklist',
        stage: 'postchecklist',
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
      
      // Get documentId
      let documentId: string | undefined;
      switch (stageConfig.stage) {
        case 'prechecklist':
          documentId = order.preChecklistId;
          break;
        case 'jobcard':
          documentId = order.jobCards?.[0]?._id;
          break;
        case 'postchecklist':
          documentId = order.postChecklistId;
          break;
        case 'invoice':
          documentId = order.invoiceId;
          break;
      }
      
      const actions = getStageActions(order, stageConfig.stage, status, documentId);
      
      return {
        ...stageConfig,
        status,
        statusLabel: statusDisplay.label,
        statusColor: statusDisplay.color,
        statusIcon: statusDisplay.icon,
        completed: ['completed', 'approved'].includes(status),
        isCurrent: order.currentStage === stageConfig.stage,
        documentId,
        actions: actions as any[],
        approvalDate: order.stageApprovals?.[stageConfig.stage as keyof typeof order.stageApprovals]?.approvedAt,
        approvedBy: order.stageApprovals?.[stageConfig.stage as keyof typeof order.stageApprovals]?.approvedBy,
        completionDate: documentId ? new Date().toISOString() : undefined
      };
    });

    setWorkflowStages(stagesWithStatus as WorkflowStage[]);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'KES 0';
    return workOrderService.formatCurrency(amount);
  };

  const getCustomerName = () => {
    if (!workOrder) return '—';
    return workOrderService.getCustomerName(workOrder);
  };

  const getCustomerEmail = () => {
    if (!workOrder) return undefined;
    return workOrderService.getCustomerEmail(workOrder);
  };

  const getAssignedToName = () => {
    if (!workOrder) return 'Unassigned';
    return workOrderService.getAssignedToName(workOrder);
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
              { id: 'pre-checklist', label: 'Pre Checklist', icon: <ClipboardCheck className="h-4 w-4" /> },
              { id: 'post-checklist', label: 'Post Checklist', icon: <ClipboardList className="h-4 w-4" /> },
              { id: 'quotations', label: 'Quotations', icon: <DollarSign className="h-4 w-4" /> },
              { id: 'waiver', label: 'Waiver', icon: <FileSignature className="h-4 w-4" /> },
              { id: 'delays', label: 'Delays', icon: <AlertTriangle className="h-4 w-4" /> },
              { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
              { id: 'technician-notes', label: 'Technician Notes', icon: <MessageSquare className="h-4 w-4" /> },
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
                {tab.id === 'pre-checklist' && workOrder.preChecklistId && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    1
                  </span>
                )}
                {/* Add badge for post-checklist if exists */}
                {tab.id === 'post-checklist' && workOrder.postChecklistId && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    1
                  </span>
                )}
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
              {currentStage && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {currentStage.icon}
                        <span>Current Stage: {currentStage.label}</span>
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentStage.description}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      getStageStatusDisplay(currentStage.status).bgColor
                    } ${currentStage.statusColor}`}>
                      {currentStage.statusIcon}
                      {currentStage.statusLabel}
                    </span>
                  </div>

                  {/* Stage Actions */}
                  <div className="space-y-4">
                    {currentStage.documentId ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">{currentStage.label} Document Created</h4>
                              <p className="text-sm text-gray-600">
                                {currentStage.status === 'needs_approval' 
                                  ? 'Awaiting approval' 
                                  : currentStage.status === 'approved' 
                                  ? 'Approved and ready for next stage'
                                  : 'Ready for review'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                // Navigate to checklist view based on stage
                                const docId = currentStage.documentId;
                                if (currentStage.stage === 'prechecklist') {
                                  router.push(`/pre-checklist/${docId}?workOrderId=${workOrder._id}`);
                                } else if (currentStage.stage === 'postchecklist') {
                                  router.push(`/post-checklist/${docId}?workOrderId=${workOrder._id}`);
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View {currentStage.label}
                            </button>
                            {currentStage.status === 'needs_approval' && (
                              <button
                                onClick={async () => {
                                  await approveStage(currentStage.stage, currentStage.documentId);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <FilePlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          No {currentStage.label} Created
                        </h4>
                        <p className="text-gray-600 mb-6">
                          Create a {currentStage.label.toLowerCase()} to start this stage.
                        </p>
                        <button
                          onClick={() => createStageDocument(currentStage.stage)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create {currentStage.label}
                        </button>
                      </div>
                    )}

                    {/* Stage Progress */}
                    {currentStage.documentId && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Stage Progress</span>
                          <span className="text-sm font-medium text-gray-900">
                            {currentStage.status === 'approved' ? '100%' : 
                            currentStage.status === 'needs_approval' ? '75%' : '50%'}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ 
                              width: currentStage.status === 'approved' ? '100%' : 
                                    currentStage.status === 'needs_approval' ? '75%' : '50%'
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Created</span>
                          <span>Submitted</span>
                          <span>Approved</span>
                        </div>
                      </div>
                    )}
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
                      {getCustomerName()}
                    </p>
                    {getCustomerEmail() && (
                      <p className="text-gray-600">
                        <Mail className="h-4 w-4 inline mr-2" />
                        {getCustomerEmail()}
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
                      <span className="font-semibold">{formatCurrency(workOrder.laborCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parts:</span>
                      <span className="font-semibold">{formatCurrency(workOrder.partsCost)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span className="text-gray-900 font-semibold">Total:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {formatCurrency(workOrder.totalCost)}
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Stages</h3>
                <div className="space-y-4">
                  {workflowStages.map((stage) => {
                    const statusDisplay = getStageStatusDisplay(stage.status);
                    return (
                      <div
                        key={stage.id}
                        className={`p-4 rounded-lg border-2 ${
                          stage.completed
                            ? 'bg-green-50 border-green-200'
                            : stage.isCurrent
                            ? 'bg-blue-50 border-blue-300'
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
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  statusDisplay.bgColor} ${statusDisplay.color}`}>
                                  {statusDisplay.icon}
                                  {statusDisplay.label}
                                </span>
                                {stage.isCurrent && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Zap className="h-3 w-3" />
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{stage.description}</p>
                              
                              {/* Stage-specific information */}
                              {stage.documentId ? (
                                <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm text-gray-700">
                                        Document: {stage.documentId.slice(-8)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => viewStageDocument(stage)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                      >
                                        <Eye className="h-3 w-3" />
                                        View Document
                                      </button>
                                      {stage.status === 'needs_approval' && (
                                        <button
                                          onClick={() => approveStage(stage.stage, stage.documentId)}
                                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                                        >
                                          <CheckCircle className="h-3 w-3" />
                                          Approve
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">No document created</span>
                                    {stage.isCurrent && (
                                      <button
                                        onClick={() => createStageDocument(stage.stage)}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                      >
                                        <Plus className="h-3 w-3 mr-1 inline" />
                                        Create
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pre-checklist' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                      Pre-Checklist
                    </h3>
                    <p className="text-sm text-gray-600">Pre-service inspection and validation</p>
                  </div>
                  {workOrder.preChecklistId && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      Checklist Created
                    </span>
                  )}
                </div>

                {workOrder.preChecklistId ? (
                  <div className="space-y-6">
                    {/* Checklist Details Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                              <ClipboardCheck className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">Pre-Checklist Details</h4>
                              <p className="text-sm text-gray-600">
                                Created for {getCustomerName()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Checklist Status */}
                          <div className="mb-6">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                  {preChecklist?.inspectionItems?.length || 0}
                                </div>
                                <div className="text-xs text-gray-600">Items</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {preChecklist?.inspectionItems?.filter((item: any) => item.status === 'ok').length || 0}
                                </div>
                                <div className="text-xs text-green-600">OK</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                  {preChecklist?.inspectionItems?.filter((item: any) => item.status === 'fault').length || 0}
                                </div>
                                <div className="text-xs text-red-600">Faults</div>
                              </div>
                            </div>
                            
                            {/* Approval Status */}
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-700">Approval Status:</span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                  preChecklist?.approved 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {preChecklist?.approved ? (
                                    <>
                                      <CheckCircle className="h-3 w-3" />
                                      Approved
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3" />
                                      Pending Approval
                                    </>
                                  )}
                                </span>
                              </div>
                              
                              {preChecklist?.approved && preChecklist.approvedAt && (
                                <p className="text-xs text-gray-600">
                                  Approved on {formatDate(preChecklist.approvedAt)} by {preChecklist.approvedBy || 'System'}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => router.push(`/pre-checklist/${workOrder.preChecklistId}`)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                              View Full Checklist
                            </button>
                            
                            {!preChecklist?.approved && (
                              <button
                                onClick={async () => {
                                  await approvePreChecklist(workOrder.preChecklistId);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve Checklist
                              </button>
                            )}
                            
                            {workOrder.currentStage === 'prechecklist' && (
                              <button
                                onClick={() => router.push(`/pre-checklist/edit/${workOrder.preChecklistId}`)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                              >
                                <Edit className="h-4 w-4" />
                                Edit Checklist
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Summary */}
                    {preChecklist && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Checklist Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">Total Items</div>
                            <div className="text-xl font-bold text-gray-900">
                              {preChecklist.inspectionItems?.length || 0}
                            </div>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <div className="text-sm text-green-600">OK Items</div>
                            <div className="text-xl font-bold text-green-700">
                              {preChecklist.inspectionItems?.filter((item: any) => item.status === 'ok').length || 0}
                            </div>
                          </div>
                          <div className="p-4 bg-red-50 rounded-lg">
                            <div className="text-sm text-red-600">Faults Found</div>
                            <div className="text-xl font-bold text-red-700">
                              {preChecklist.inspectionItems?.filter((item: any) => item.status === 'fault').length || 0}
                            </div>
                          </div>
                        </div>
                        
                        {/* If there are faults, show them */}
                        {preChecklist.inspectionItems?.some((item: any) => item.status === 'fault') && (
                          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-yellow-800">Faults Detected</span>
                            </div>
                            <div className="text-sm text-yellow-700">
                              Review and address faults before proceeding to next stage.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <ClipboardCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Pre-Checklist Created</h4>
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                      A pre-checklist is required before starting work on this order. Create one to document the initial inspection.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => router.push(`/pre-checklist/create?workOrderId=${workOrder._id}&source=workflow`)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Pre-Checklist
                      </button>
                      {workOrder.currentStage !== 'prechecklist' && (
                        <button
                          onClick={async () => {
                            await workOrderService.updateWorkOrderStage(workOrder._id, 'prechecklist');
                            showToast('Returned to Pre-Checklist stage', 'success');
                            fetchWorkOrder();
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Return to Pre-Checklist Stage
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'post-checklist' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Post-Checklist</h3>
                    <p className="text-sm text-gray-600">Post-service verification and quality check</p>
                  </div>
                  {workOrder.postChecklistId ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Checklist Created
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      <AlertCircle className="h-4 w-4" />
                      No Checklist
                    </span>
                  )}
                </div>

                {workOrder.postChecklistId ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardList className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Linked Post-Checklist</h4>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              A post-checklist has been created for quality verification.
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <button
                                onClick={() => router.push(`/post-checklist/${workOrder.postChecklistId}`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Post-Checklist
                              </button>
                              {workOrder.currentStage === 'post_checklist' && (
                                <button
                                  onClick={() => router.push(`/post-checklist/edit/${workOrder.postChecklistId}?workOrderId=${workOrder._id}`)}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Checklist
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Loading State for Post Checklist Details */}
                    {loadingPostChecklist ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-600">Loading post-checklist details...</p>
                      </div>
                    ) : postChecklist ? (
                      <>
                        {/* Add completion stats or summary */}
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-3">Verification Status</h4>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-700">Verification Progress</span>
                              <span className="text-sm font-bold text-blue-700">
                                {postChecklist.inspectionItems && postChecklist.inspectionItems.length > 0 
                                  ? `${Math.round((postChecklist.inspectionItems.filter((item: any) => item.status === 'completed').length / postChecklist.inspectionItems.length) * 100)}%`
                                  : '0%'}
                              </span>
                            </div>
                            <div className="h-2 bg-blue-200 rounded-full">
                              <div 
                                className="h-full bg-blue-600 rounded-full" 
                                style={{ 
                                  width: postChecklist.inspectionItems && postChecklist.inspectionItems.length > 0 
                                    ? `${Math.round((postChecklist.inspectionItems.filter((item: any) => item.status === 'completed').length / postChecklist.inspectionItems.length) * 100)}%` 
                                    : '0%' 
                                }} 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Post Checklist Summary */}
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-3">Checklist Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-600">Total Items</div>
                              <div className="text-xl font-bold text-gray-900">
                                {postChecklist.inspectionItems ? postChecklist.inspectionItems.length : 0}
                              </div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="text-sm text-green-600">Completed</div>
                              <div className="text-xl font-bold text-green-700">
                                {postChecklist.inspectionItems 
                                  ? postChecklist.inspectionItems.filter((item: any) => item.status === 'completed').length 
                                  : 0}
                              </div>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <div className="text-sm text-yellow-600">Incomplete</div>
                              <div className="text-xl font-bold text-yellow-700">
                                {postChecklist.inspectionItems 
                                  ? postChecklist.inspectionItems.filter((item: any) => item.status === 'incomplete').length 
                                  : 0}
                              </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm text-blue-600">Approved</div>
                              <div className="text-xl font-bold text-blue-700">
                                {postChecklist.approved ? 'Yes' : 'No'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Overall Condition */}
                          {postChecklist.overallCondition && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm text-gray-600 mb-1">Overall Condition</div>
                                  <div className="font-semibold text-gray-900 capitalize">
                                    {postChecklist.overallCondition.replace('_', ' ')}
                                  </div>
                                </div>
                                {postChecklist.overallCondition === 'excellent' && (
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <Sparkles className="h-5 w-5 text-green-600" />
                                  </div>
                                )}
                                {postChecklist.overallCondition === 'satisfactory' && (
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  </div>
                                )}
                                {postChecklist.overallCondition === 'needs_attention' && (
                                  <div className="p-2 bg-yellow-100 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      // This would show if fetch failed or data is null
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Unable to load checklist details</p>
                        <button
                          onClick={fetchPostChecklist}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Retry Loading
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Post-Checklist Created</h4>
                    <p className="text-gray-600 mb-6">
                      A post-checklist is required to verify work quality before completing this order.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          if (workOrder.preChecklistId) {
                            router.push(`/post-checklist/create?workOrderId=${workOrder._id}&preChecklistId=${workOrder.preChecklistId}&source=workflow`);
                          } else {
                            router.push(`/post-checklist/create?workOrderId=${workOrder._id}&source=workflow`);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Post-Checklist
                      </button>
                      {workOrder.currentStage !== 'post_checklist' && workOrder.preChecklistId && (
                        <button
                          onClick={async () => {
                            await workOrderService.updateWorkOrderStage(workOrder._id, 'post_checklist');
                            showToast('Moved to Post-Checklist stage', 'success');
                            fetchWorkOrder();
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Go to Stage
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
                  {!workOrder.waiverId && (
                    <button
                      onClick={() => router.push(`/waivers/create?workOrderId=${workOrder._id}`)}
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
                            A waiver has been created for this work order.
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
                      onClick={() => router.push(`/waivers/create?workOrderId=${workOrder._id}`)}
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
                                Reported: {formatDate(workOrder.delayInfo.detectedAt)}
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
                              await workOrderService.resolveDelay(orderId);
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
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          Created
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
                            {Array.isArray(workOrder.jobCards) ? workOrder.jobCards.length : 0} job{Array.isArray(workOrder.jobCards) && workOrder.jobCards.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          Created
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
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          Created
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
                          {workOrder.invoicePaid ? 'Paid' : workOrder.invoiceGenerated ? 'Generated' : 'Created'}
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
    </div>
  );
}