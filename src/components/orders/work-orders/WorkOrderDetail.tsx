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
  Info,
  Layers,
  Target,
  Package2,
  Settings,
  ExternalLink,
  BadgeCheck,
  Star,
  Lock,
  Unlock,
  RotateCcw,
  Upload,
  Filter,
  Search,
  Bell,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Home,
  Map,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Globe,
  Briefcase as BriefcaseIcon,
  Users as UsersIcon,
  Package as PackageIcon
} from 'lucide-react';
import { workOrderService, WorkOrder, TechnicianNote } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { preChecklistService } from '@/services/preChecklistService';
import { postChecklistService } from '@/services/postChecklistService';
import { jobCardService } from '@/services/jobCardService';
import { invoiceService } from '@/services/invoiceService';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';

interface WorkOrderDetailPageProps {
  orderId: string;
}

// Define stage status types
type StageStatus = 'not_started' | 'in_progress' | 'needs_approval' | 'approved' | 'completed' | 'rejected' | 'delayed' | 'skipped';

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
    variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline'; 
    description?: string;
    action: () => Promise<void> | void;
  }>;
  statusLabel: string;
  statusColor: string;
  bgColor: string;
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
  // Enhanced properties
  validation?: {
    isValid: boolean;
    message?: string;
    requirements?: string[];
  };
  nextAction?: string;
}

// Enhanced Skeleton Loader Components
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
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [invoice, setInvoice] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [stageToApprove, setStageToApprove] = useState<{stage: string; documentId?: string}>({stage: '', documentId: ''});
  const [currentStageSummary, setCurrentStageSummary] = useState<{
    title: string;
    description: string;
    progress: number;
    status: string;
    nextAction: string;
    estimatedCompletion: string;
  } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
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

  useEffect(() => {
    if (workOrder) {
      fetchJobCards();
      fetchInvoice();
    }
  }, [workOrder]);

  useEffect(() => {
    if (workflowStages.length > 0) {
      updateCurrentStageSummary();
    }
  }, [workflowStages]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const data = await workOrderService.getWorkOrderById(orderId);
      setWorkOrder(data);
      await transformWorkOrderToStages(data);
    } catch (error) {
      console.error('Error fetching work order:', error);
      showToast('Failed to load work order details', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobCards = async () => {
    try {
      const jobCardsData = await jobCardService.getJobCardsByOpportunity(
        typeof workOrder?.opportunityId === 'object' 
          ? workOrder.opportunityId._id 
          : workOrder?.opportunityId || ''
      );
      setJobCards(jobCardsData);
    } catch (error) {
      console.error('Error fetching job cards:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      if (workOrder?.invoiceId) {
        const invoiceData = await invoiceService.getInvoiceById(workOrder.invoiceId);
        setInvoice(invoiceData);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const fetchPreChecklist = useCallback(async () => {
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
  }, [workOrder?.preChecklistId, workOrder?.opportunityId, workOrder?.vehicleId, preChecklist]);

  useEffect(() => {
    if (activeTab === 'pre-checklist' && workOrder?.preChecklistId) {
      const timer = setTimeout(() => {
        if (!preChecklist || preChecklist._id !== workOrder.preChecklistId) {
          fetchPreChecklist();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, workOrder?.preChecklistId, preChecklist, fetchPreChecklist]);

  const fetchPostChecklist = async () => {
    try {
      setLoadingPostChecklist(true);
      const data = await postChecklistService.getPostChecklistById(workOrder.postChecklistId);
      setPostChecklist(data);
    } catch (error) {
      console.error('Error fetching post-checklist:', error);
    } finally {
      setLoadingPostChecklist(false);
    }
  };

  const getJobCardId = (jobCards: string[] | Array<{ _id: string; jobTitle?: string; status?: string }> | undefined): string | undefined => {
    if (!jobCards || !Array.isArray(jobCards) || jobCards.length === 0) {
      return undefined;
    }

    const jobCard = jobCards[0];
    if (typeof jobCard === 'string') {
      return jobCard;
    } else if (jobCard && typeof jobCard === 'object' && jobCard._id) {
      return jobCard._id;
    }

    return undefined;
  };

  const fetchTechnicianNotes = async () => {
    try {
      const notes = await workOrderService.getTechnicianNotes(orderId, includeInternal);
      setTechnicianNotes(notes);
    } catch (error) {
      console.error('Error fetching technician notes:', error);
    }
  };

  // Enhanced workflow transformation using the integrated service
  const transformWorkOrderToStages = async (order: WorkOrder) => {
    if (!order) {
      setWorkflowStages([]);
      return;
    }
    
    try {
      const opportunityId = typeof order.opportunityId === 'object' 
        ? order.opportunityId._id 
        : order.opportunityId;
      
      // Use the enhanced workflow UI from lifecycleIntegrationService
      const workflowUI = await lifecycleIntegrationService.getEnhancedWorkflowUI(opportunityId);
      
      const stages = workflowUI.stages.map((stage: any, index: number) => {
        const status = mapEnhancedStatusToStageStatus(stage.status, stage.isCurrent, stage.completed);
        const statusDisplay = getStageStatusDisplay(status);
        
        return {
          id: `stage-${stage.stage}`,
          stage: stage.stage,
          label: stage.label,
          description: stage.description,
          status,
          completed: stage.completed,
          isCurrent: stage.isCurrent,
          document: stage.document,
          documentId: stage.documentId,
          documentType: stage.documentType,
          actions: buildStageActionsFromEnhanced(stage, order),
          statusLabel: statusDisplay.label,
          statusColor: statusDisplay.color,
          bgColor: statusDisplay.bgColor,
          statusIcon: statusDisplay.icon,
          icon: getStageIcon(stage.stage),
          mandatory: stage.mandatory || stage.required || true,
          estimatedTime: getStageEstimatedTime(stage.stage),
          canSkip: stage.skippable || false,
          progress: {
            percentage: stage.progress || 0,
            completedSteps: 0,
            totalSteps: 3
          },
          validation: stage.validation,
          nextAction: stage.nextAction
        };
      });
      
      setWorkflowStages(stages);
      
    } catch (error) {
      console.error('Error transforming work order to stages:', error);
      // Fallback to basic transformation
      fallbackTransform(order);
    }
  };

  const fallbackTransform = (order: WorkOrder) => {
    const mainStages = [
      {
        id: 'pre_checklist',
        stage: 'pre_checklist',
        label: 'Pre-Checklist',
        description: 'Pre-service inspection and validation',
        icon: <ClipboardCheck className="h-5 w-5" />,
        mandatory: true,
        estimatedTime: '30-60 min',
        canSkip: false,
      },
      {
        id: 'job_card',
        stage: 'job_card',
        label: 'Job Card',
        description: 'Detailed job tasks and technician assignments',
        icon: <Wrench className="h-5 w-5" />,
        mandatory: true,
        estimatedTime: '2-4 hours',
        canSkip: false,
      },
      {
        id: 'post_checklist',
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
      
      let documentId: string | undefined;
      switch (stageConfig.stage) {
        case 'pre_checklist':
          documentId = order.preChecklistId;
          break;
        case 'job_card': 
          documentId = getJobCardId(order.jobCards);
          break;
        case 'post_checklist':
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
        statusLabel: statusDisplay?.label || 'Unknown',
        statusColor: statusDisplay?.color || 'text-gray-600',
        bgColor: statusDisplay?.bgColor || 'bg-gray-100',
        completed: ['completed', 'approved'].includes(status),
        isCurrent: order.currentStage === stageConfig.stage,
        documentId,
        actions: actions || [],
        progress: getStageProgress(status),
        approvalDate: order.stageApprovals?.[stageConfig.stage as keyof typeof order.stageApprovals]?.approvedAt,
        approvedBy: order.stageApprovals?.[stageConfig.stage as keyof typeof order.stageApprovals]?.approvedBy,
        completionDate: documentId ? new Date().toISOString() : undefined
      };
    });

    setWorkflowStages(stagesWithStatus as WorkflowStage[]);
  };

  const mapEnhancedStatusToStageStatus = (enhancedStatus: string, isCurrent: boolean, completed: boolean): StageStatus => {
    switch (enhancedStatus) {
      case 'completed':
        return 'completed';
      case 'ready':
        return isCurrent ? 'in_progress' : 'not_started';
      case 'in_progress':
        return 'in_progress';
      case 'pending':
        return 'not_started';
      default:
        return completed ? 'completed' : isCurrent ? 'in_progress' : 'not_started';
    }
  };

  const buildStageActionsFromEnhanced = (stage: any, order: WorkOrder) => {
    const actions: any[] = [];
    
    // Map enhanced actions to our component actions
    if (stage.actions && Array.isArray(stage.actions)) {
      stage.actions.forEach((enhancedAction: any) => {
        const action = mapEnhancedAction(enhancedAction, stage, order);
        if (action) {
          actions.push(action);
        }
      });
    }
    
    return actions;
  };

  const mapEnhancedAction = (enhancedAction: any, stage: any, order: WorkOrder) => {
    const actionMap: Record<string, any> = {
      'create': {
        id: `create-${stage.stage}`,
        label: enhancedAction.label || `Create ${stage.label}`,
        icon: <Plus className="h-4 w-4" />,
        variant: 'primary' as const,
        action: async () => handleCreateStageDocument(stage.stage)
      },
      'edit': {
        id: `edit-${stage.stage}`,
        label: enhancedAction.label || 'Edit',
        icon: <Edit className="h-4 w-4" />,
        variant: 'warning' as const,
        action: async () => handleEditStageDocument(stage.stage, stage.documentId)
      },
      'view': {
        id: `view-${stage.stage}`,
        label: enhancedAction.label || 'View',
        icon: <Eye className="h-4 w-4" />,
        variant: 'secondary' as const,
        action: async () => handleViewStageDocument(stage.stage, stage.documentId)
      },
      'approve': {
        id: `approve-${stage.stage}`,
        label: enhancedAction.label || 'Approve',
        icon: <CheckCircle className="h-4 w-4" />,
        variant: 'success' as const,
        action: async () => handleApproveStage(stage.stage, stage.documentId)
      },
      'transition': {
        id: `transition-${stage.stage}`,
        label: enhancedAction.label || 'Next Stage',
        icon: <ArrowRight className="h-4 w-4" />,
        variant: 'primary' as const,
        action: async () => handleTransitionToNextStage(stage)
      },
      'complete_and_next': {
        id: `complete-next-${stage.stage}`,
        label: enhancedAction.label || 'Complete & Next',
        icon: <CheckCircle2 className="h-4 w-4" />,
        variant: 'success' as const,
        action: async () => handleCompleteAndTransition(stage)
      }
    };
    
    return actionMap[enhancedAction.action];
  };

  const getStageIcon = (stage: string): React.ReactNode => {
    switch (stage) {
      case 'prechecklist':
      case 'pre_checklist':
        return <ClipboardCheck className="h-5 w-5" />;
      case 'jobcard':
      case 'job_card':
        return <Wrench className="h-5 w-5" />;
      case 'postchecklist':
      case 'post_checklist':
        return <ClipboardList className="h-5 w-5" />;
      case 'invoice':
        return <ReceiptIcon className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  const getStageEstimatedTime = (stage: string): string => {
    switch (stage) {
      case 'prechecklist':
      case 'pre_checklist':
        return '30-60 min';
      case 'jobcard':
      case 'job_card':
        return '2-4 hours';
      case 'postchecklist':
      case 'post_checklist':
        return '30-60 min';
      case 'invoice':
        return '30 min';
      default:
        return 'Unknown';
    }
  };

  const getStageProgress = (status: StageStatus) => {
    switch (status) {
      case 'not_started':
        return { percentage: 0, completedSteps: 0, totalSteps: 3 };
      case 'in_progress':
        return { percentage: 50, completedSteps: 1, totalSteps: 3 };
      case 'needs_approval':
        return { percentage: 75, completedSteps: 2, totalSteps: 3 };
      case 'approved':
      case 'completed':
        return { percentage: 100, completedSteps: 3, totalSteps: 3 };
      default:
        return { percentage: 0, completedSteps: 0, totalSteps: 3 };
    }
  };

  const determineStageStatus = (order: WorkOrder, stage: string): StageStatus => {
    if (!order || !order.currentStage) return 'not_started';
    
    const stageOrder = ['pre_checklist', 'job_card', 'post_checklist', 'invoice'];
    const currentIndex = stageOrder.indexOf(order.currentStage);
    const stageIndex = stageOrder.indexOf(stage);
    
    if (currentIndex === -1 || stageIndex === -1) return 'not_started';
    
    if (stageIndex < currentIndex) return 'completed';
    
    if (stageIndex === currentIndex) {
      const documentId = getStageDocumentId(order, stage);
      
      if (documentId) {
        const isApproved = checkStageApproval(order, stage);
        
        if (isApproved) {
          return 'approved';
        }
        
        if (stage === 'pre_checklist' && preChecklist) {
          return preChecklist.approved ? 'approved' : 'needs_approval';
        }
        
        if (stage === 'post_checklist' && postChecklist) {
          return postChecklist.approved ? 'approved' : 'needs_approval';
        }
        
        return 'needs_approval';
      }
      
      return documentId ? 'in_progress' : 'not_started';
    }
    
    return 'not_started';
  };

  const getStageDocumentId = (order: WorkOrder, stage: string): string | undefined => {
    switch (stage) {
      case 'pre_checklist': 
        return order.preChecklistId;
      case 'job_card': 
        return getJobCardId(order.jobCards);
      case 'post_checklist': 
        return order.postChecklistId;
      case 'invoice': 
        return order.invoiceId;
      default: 
        return undefined;
    }
  };

  const checkStageApproval = (order: WorkOrder, stage: string): boolean => {
    const normalizedStage = stage.replace('_', '');
    const stageApproval = order.stageApprovals?.[normalizedStage as keyof typeof order.stageApprovals];
    return stageApproval?.approved || false;
  };

  const getStageActions = (order: WorkOrder, stage: string, status: StageStatus, documentId?: string) => {
    let stageKey = stage;
    if (stage === 'pre_checklist') stageKey = 'prechecklist';
    else if (stage === 'job_card') stageKey = 'jobcard';
    else if (stage === 'post_checklist') stageKey = 'postchecklist';
    
    const baseActions = {
      prechecklist: {
        not_started: [
          {
            id: 'create-pre-checklist',
            label: 'Create Pre-Checklist',
            icon: <Plus className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              router.push(`/pre-checklist/create?workOrderId=${order._id}&source=workflow&autoTransition=true`);
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
                router.push(`/pre-checklist/${order.preChecklistId}?workOrderId=${order._id}`);
              }
            }
          }
        ],
        needs_approval: [
          {
            id: 'approve-checklist',
            label: 'Approve Checklist',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              handleApproveStage(stageKey, documentId);
            }
          },
          {
            id: 'view-checklist',
            label: 'View Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              router.push(`/${stageKey}/${documentId}`);
            }
          }
        ],
        approved: [
          {
            id: 'view-approved-checklist',
            label: 'View Approved Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (order.preChecklistId) {
                router.push(`/pre-checklist/${order.preChecklistId}`);
              }
            }
          }
        ],
        completed: [
          {
            id: 'view-pre-checklist',
            label: 'View Pre-Checklist',
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
      jobcard: {
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
            id: 'view-job-cards',
            label: 'View Job Cards',
            icon: <Eye className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              router.push(`/job-cards?workOrderId=${order._id}`);
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
      postchecklist: {
        not_started: [
          {
            id: 'create-post-checklist',
            label: 'Create Post-Checklist',
            icon: <Plus className="h-4 w-4" />,
            variant: 'primary' as const,
            action: async () => {
              router.push(`/post-checklist/create?workOrderId=${order._id}&preChecklistId=${order.preChecklistId}&source=workflow&autoTransition=true`);
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
                router.push(`/post-checklist/${order.postChecklistId}?workOrderId=${order._id}`);
              }
            }
          }
        ],
        needs_approval: [
          {
            id: 'approve-post-checklist',
            label: 'Approve Checklist',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              handleApproveStage(stageKey, documentId);
            }
          },
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
        ],
        approved: [
          {
            id: 'view-approved-post-checklist',
            label: 'View Approved Checklist',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (order.postChecklistId) {
                router.push(`/post-checklist/${order.postChecklistId}`);
              }
            }
          }
        ],
        completed: [
          {
            id: 'view-post-checklist',
            label: 'View Post-Checklist',
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

    return baseActions[stageKey as keyof typeof baseActions]?.[status] || [];
  };

  // Enhanced status display function
  const getStageStatusDisplay = (status: StageStatus): { 
    label: string; 
    color: string; 
    bgColor: string;
    icon: React.ReactNode;
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
      case 'skipped':
        return {
          label: 'Skipped',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: <ArrowRight className="h-4 w-4" />
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

  // Enhanced action handlers
  const handleCreateStageDocument = async (stage: string) => {
    try {
      switch (stage) {
        case 'prechecklist':
        case 'pre_checklist':
          router.push(`/pre-checklist/create?workOrderId=${workOrder?._id}&source=workflow&autoTransition=true`);
          break;
        case 'jobcard':
        case 'job_card':
          router.push(`/job-cards/create?workOrderId=${workOrder?._id}`);
          break;
        case 'postchecklist':
        case 'post_checklist':
          router.push(`/post-checklist/create?workOrderId=${workOrder?._id}&preChecklistId=${workOrder?.preChecklistId}&source=workflow&autoTransition=true`);
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

  const handleEditStageDocument = async (stage: string, documentId?: string) => {
    if (!documentId) return;
    
    try {
      switch (stage) {
        case 'prechecklist':
        case 'pre_checklist':
          router.push(`/pre-checklist/edit/${documentId}`);
          break;
        case 'jobcard':
        case 'job_card':
          router.push(`/job-cards/edit/${documentId}`);
          break;
        case 'postchecklist':
        case 'post_checklist':
          router.push(`/post-checklist/edit/${documentId}`);
          break;
        case 'invoice':
          router.push(`/invoices/edit/${documentId}`);
          break;
      }
    } catch (error) {
      console.error('Error editing document:', error);
      showToast('Failed to edit document', 'error');
    }
  };

  const handleViewStageDocument = async (stage: string, documentId?: string) => {
    if (!documentId) return;
    
    try {
      switch (stage) {
        case 'prechecklist':
        case 'pre_checklist':
          router.push(`/pre-checklist/${documentId}`);
          break;
        case 'postchecklist':
        case 'post_checklist':
          router.push(`/post-checklist/${documentId}`);
          break;
        case 'jobcard':
        case 'job_card':
          router.push(`/job-cards/${documentId}`);
          break;
        case 'invoice':
          router.push(`/invoices/${documentId}`);
          break;
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      showToast('Failed to view document', 'error');
    }
  };

  const handleApproveStage = async (stage: string, documentId?: string) => {
    if (!documentId || !workOrder) return;
    
    setIsTransitioning(true);
    try {
      const checklistType = stage === 'prechecklist' || stage === 'pre_checklist' ? 'prechecklist' : 'postchecklist';
      
      // Use the integrated service for auto-approval and transition
      const result = await workOrderService.autoApproveAndTransition(
        workOrder._id,
        checklistType,
        'user' // You should get this from auth context
      );
      
      if (result.success) {
        showToast(`${checklistType} approved and transitioned successfully`, 'success');
        // Refresh all data
        fetchWorkOrder();
        if (checklistType === 'prechecklist') {
          fetchPreChecklist();
        } else {
          fetchPostChecklist();
        }
      } else {
        showToast(result.message || 'Failed to approve', 'error');
      }
    } catch (error) {
      console.error('Error approving stage:', error);
      showToast('Failed to approve stage', 'error');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleTransitionToNextStage = async (stage: WorkflowStage) => {
    if (!workOrder) return;
    
    setIsTransitioning(true);
    try {
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      const pattern = ['prechecklist', 'jobcard', 'postchecklist', 'invoice'];
      const currentIndex = pattern.indexOf(stage.stage);
      
      if (currentIndex < pattern.length - 1) {
        const nextStage = pattern[currentIndex + 1];
        
        await lifecycleIntegrationService.transitionToStage(
          opportunityId,
          nextStage,
          {
            skipValidation: false,
            metadata: {
              triggeredBy: 'manual-transition',
              fromStage: stage.stage,
              toStage: nextStage
            }
          }
        );
        
        // Update work order
        await workOrderService.updateWorkOrder(workOrder._id, {
          currentStage: nextStage,
          updatedAt: new Date().toISOString()
        });
        
        showToast(`Moved to ${nextStage} stage`, 'success');
        fetchWorkOrder();
      }
    } catch (error) {
      console.error('Transition failed:', error);
      showToast('Failed to transition to next stage', 'error');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleCompleteAndTransition = async (stage: WorkflowStage) => {
    if (!workOrder) return;
    
    setIsTransitioning(true);
    try {
      // First mark the current stage as completed
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      // Then transition to next stage
      await handleTransitionToNextStage(stage);
      
    } catch (error) {
      console.error('Complete and transition failed:', error);
      showToast('Failed to complete and transition', 'error');
    } finally {
      setIsTransitioning(false);
    }
  };

  // Update current stage summary
  const updateCurrentStageSummary = () => {
    if (!workOrder || workflowStages.length === 0) return;

    const currentStage = workflowStages.find(stage => stage.isCurrent);
    if (!currentStage) return;

    let nextAction = currentStage.nextAction || '';
    let estimatedCompletion = '';
    
    switch (currentStage.stage) {
      case 'prechecklist':
      case 'pre_checklist':
        if (currentStage.status === 'not_started') {
          nextAction = 'Create Pre-Checklist to start inspection';
          estimatedCompletion = '30-60 minutes after start';
        } else if (currentStage.status === 'in_progress') {
          nextAction = 'Complete inspection items and submit';
          estimatedCompletion = 'Today';
        } else if (currentStage.status === 'needs_approval') {
          nextAction = 'Review and approve the checklist';
          estimatedCompletion = 'Pending approval';
        } else {
          nextAction = 'Ready to move to Job Card stage';
          estimatedCompletion = 'Immediate';
        }
        break;
      
      case 'jobcard':
      case 'job_card':
        if (currentStage.status === 'not_started') {
          nextAction = 'Create Job Card to assign work';
          estimatedCompletion = '2-4 hours after start';
        } else if (currentStage.status === 'in_progress') {
          nextAction = 'Complete assigned job tasks';
          estimatedCompletion = 'Based on job complexity';
        } else {
          nextAction = 'Ready to move to Post-Checklist';
          estimatedCompletion = 'Immediate';
        }
        break;
      
      case 'postchecklist':
      case 'post_checklist':
        if (currentStage.status === 'not_started') {
          nextAction = 'Create Post-Checklist for quality verification';
          estimatedCompletion = '30-60 minutes after start';
        } else if (currentStage.status === 'in_progress') {
          nextAction = 'Complete quality verification items';
          estimatedCompletion = 'Today';
        } else if (currentStage.status === 'needs_approval') {
          nextAction = 'Review and approve quality check';
          estimatedCompletion = 'Pending approval';
        } else {
          nextAction = 'Ready to generate invoice';
          estimatedCompletion = 'Immediate';
        }
        break;
      
      case 'invoice':
        if (currentStage.status === 'not_started') {
          nextAction = 'Generate invoice for completed work';
          estimatedCompletion = '30 minutes';
        } else if (currentStage.status === 'in_progress') {
          nextAction = 'Send invoice to customer';
          estimatedCompletion = 'Pending payment';
        } else {
          nextAction = 'Ready to complete work order';
          estimatedCompletion = 'Immediate';
        }
        break;
    }

    setCurrentStageSummary({
      title: currentStage.label,
      description: currentStage.description || '',
      progress: currentStage.progress?.percentage || 0,
      status: currentStage.statusLabel,
      nextAction,
      estimatedCompletion
    });
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await workOrderService.updateWorkOrderStatus(orderId, newStatus);
      showToast(`Status changed to ${workOrderService.getStatusLabel(newStatus)}`, 'success');
      fetchWorkOrder();
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  // Enhanced stage status component
  const StageStatusBadge = ({ stage }: { stage: WorkflowStage }) => {
    const statusConfig = workOrderService.getStageStatusConfig(stage.status);
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}>
        {statusConfig.icon}
        {statusConfig.label}
      </span>
    );
  };

  // Enhanced stage button component
  const StageButton = ({ stage, action }: { stage: WorkflowStage, action: any }) => {
    const buttonConfig = workOrderService.getActionButtonConfig(stage, action);
    
    return (
      <button
        onClick={() => handleStageAction(stage, action)}
        className={`
          px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all
          ${buttonConfig.className}
          ${action.disabled || buttonConfig.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
        `}
        disabled={action.disabled || buttonConfig.disabled || isTransitioning}
        title={action.description}
      >
        {isTransitioning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          action.icon
        )}
        {action.label}
      </button>
    );
  };

  // Enhanced workflow progress component
  const WorkflowProgress = ({ stages }: { stages: WorkflowStage[] }) => {
    const completedStages = stages.filter(s => s.completed).length;
    const totalStages = stages.length;
    const progressPercentage = Math.round((completedStages / totalStages) * 100);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Workflow Progress</h3>
            <p className="text-sm text-gray-600">{completedStages} of {totalStages} stages completed</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Start</span>
            <span>Complete</span>
          </div>
        </div>
        
        {/* Stages Timeline */}
        <div className="relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200" />
          
          <div className="relative flex justify-between">
            {stages.map((stage, index) => {
              const isCompleted = stage.completed;
              const isCurrent = stage.isCurrent;
              const isFuture = index > stages.findIndex(s => s.isCurrent);
              
              return (
                <div key={stage.id} className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center z-10 mb-3
                    ${isCompleted ? 'bg-green-500' : 
                      isCurrent ? 'bg-blue-500' : 
                      isFuture ? 'bg-gray-300' : 'bg-gray-200'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : isCurrent ? (
                      isTransitioning ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <PlayCircle className="h-5 w-5 text-white" />
                      )
                    ) : (
                      <span className="text-xs font-medium text-white">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="text-center max-w-[120px]">
                    <div className={`font-medium text-sm ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>
                      {stage.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stage.completed ? '✓ Complete' : 
                       stage.isCurrent ? 'In Progress' : 
                       'Pending'}
                    </div>
                    {stage.isCurrent && stage.validation && !stage.validation.isValid && (
                      <div className="text-xs text-amber-600 mt-1">
                        {stage.validation.message}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced stage card component
  const StageCard = ({ stage }: { stage: WorkflowStage }) => {
    const statusDisplay = getStageStatusDisplay(stage.status);
    const isCompleted = stage.completed;
    const isCurrent = stage.isCurrent;
    
    return (
      <div
        key={stage.id}
        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
          isCurrent
            ? 'border-blue-500 bg-blue-50 transform scale-105 shadow-lg'
            : isCompleted
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${statusDisplay.bgColor}`}>
            {stage.icon}
          </div>
          <div className="flex items-center gap-1">
            {isCurrent && (
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
              {stage.statusLabel}
            </span>
          </div>
        </div>
        
        <h4 className="font-semibold text-gray-900 mb-2">{stage.label}</h4>
        <p className="text-xs text-gray-600 mb-3">{stage.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{stage.progress?.percentage || 0}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                isCompleted ? 'bg-green-500' : 
                isCurrent ? 'bg-blue-500' : 
                'bg-gray-400'
              }`}
              style={{ width: `${stage.progress?.percentage || 0}%` }}
            />
          </div>
          
          {stage.validation && !stage.validation.isValid && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
              <div className="flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-amber-800">{stage.validation.message}</span>
              </div>
              {stage.validation.requirements && stage.validation.requirements.length > 0 && (
                <ul className="mt-1 text-amber-700 list-disc list-inside">
                  {stage.validation.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {stage.nextAction && (
            <div className="text-xs text-blue-600 font-medium">
              Next: {stage.nextAction}
            </div>
          )}
          
          <div className="pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {stage.actions.map((action) => (
                <StageButton key={action.id} stage={stage} action={action} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
              { id: 'job-cards', label: 'Job Cards', icon: <Wrench className="h-4 w-4" /> },
              { id: 'post-checklist', label: 'Post Checklist', icon: <ClipboardList className="h-4 w-4" /> },
              { id: 'invoice', label: 'Invoice', icon: <ReceiptIcon className="h-4 w-4" /> },
              { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
              { id: 'technician-notes', label: 'Notes', icon: <MessageSquare className="h-4 w-4" /> },
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
                {/* Badge indicators */}
                {tab.id === 'pre-checklist' && workOrder.preChecklistId && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    1
                  </span>
                )}
                {tab.id === 'job-cards' && jobCards.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    {jobCards.length}
                  </span>
                )}
                {tab.id === 'post-checklist' && workOrder.postChecklistId && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    1
                  </span>
                )}
                {tab.id === 'invoice' && workOrder.invoiceId && (
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
              {/* Current Stage Summary Card */}
              {currentStageSummary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Target className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Current Stage: {currentStageSummary.title}</h2>
                          <p className="text-gray-600">{currentStageSummary.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Stage Progress</span>
                            <span className="text-lg font-bold text-blue-600">{currentStageSummary.progress}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${currentStageSummary.progress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-1">Status</div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              currentStageSummary.status.includes('Completed') || currentStageSummary.status.includes('Approved') 
                                ? 'bg-green-500' 
                                : currentStageSummary.status.includes('Progress')
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                            }`} />
                            <span className="font-semibold text-gray-900">{currentStageSummary.status}</span>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-1">Next Action Required</div>
                          <div className="font-medium text-gray-900">{currentStageSummary.nextAction}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Estimated completion: {currentStageSummary.estimatedCompletion}
                          </span>
                        </div>
                        
                        {currentStage && (
                          <div className="flex items-center gap-2">
                            {currentStage.actions.map((action) => (
                              <StageButton key={action.id} stage={currentStage} action={action} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Workflow Progress */}
              <WorkflowProgress stages={workflowStages} />

              {/* Stage Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {workflowStages.map((stage) => (
                  <StageCard key={stage.id} stage={stage} />
                ))}
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Customer Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                    <span className="text-sm font-medium text-gray-500">Customer</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{getCustomerName()}</h3>
                  <div className="space-y-1">
                    {getCustomerEmail() && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MailIcon className="h-4 w-4" />
                        <span>{getCustomerEmail()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BriefcaseIcon className="h-4 w-4" />
                      <span>Opportunity: {typeof workOrder.opportunityId === 'object' ? workOrder.opportunityId.subject : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-gray-500">Financial</span>
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

                {/* Timeline Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    <span className="text-sm font-medium text-gray-500">Timeline</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Start:</span>
                      <span className="font-semibold">{formatDate(workOrder.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Est. Completion:</span>
                      <span className="font-semibold">{formatDate(workOrder.estimatedCompletionDate)}</span>
                    </div>
                    {workOrder.actualCompletionDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-semibold text-green-600">{formatDate(workOrder.actualCompletionDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <UsersIcon className="h-6 w-6 text-amber-600" />
                    <span className="text-sm font-medium text-gray-500">Team</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{getAssignedToName()}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <PackageIcon className="h-4 w-4" />
                      <span>{jobCards.length} Job Card{jobCards.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClipboardCheck className="h-4 w-4" />
                      <span>{preChecklist ? 'Pre-Checklist ✓' : 'No Pre-Checklist'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All →
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { 
                      action: 'Work Order Created', 
                      date: workOrder.createdAt,
                      user: 'System',
                      icon: <FilePlus className="h-4 w-4 text-blue-500" />
                    },
                    ...(workOrder.preChecklistId ? [{
                      action: 'Pre-Checklist Created',
                      date: preChecklist?.createdAt || new Date().toISOString(),
                      user: preChecklist?.inspectorName || 'Inspector',
                      icon: <ClipboardCheck className="h-4 w-4 text-green-500" />
                    }] : []),
                    ...(jobCards.length > 0 ? [{
                      action: `${jobCards.length} Job Card${jobCards.length !== 1 ? 's' : ''} Created`,
                      date: jobCards[0]?.createdAt || new Date().toISOString(),
                      user: 'Technician',
                      icon: <Wrench className="h-4 w-4 text-amber-500" />
                    }] : []),
                    ...(workOrder.postChecklistId ? [{
                      action: 'Post-Checklist Created',
                      date: postChecklist?.createdAt || new Date().toISOString(),
                      user: postChecklist?.inspectedBy || 'Inspector',
                      icon: <ClipboardList className="h-4 w-4 text-purple-500" />
                    }] : []),
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(activity.date)} • By {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
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
                        className={`p-6 rounded-xl border-2 ${
                          stage.completed
                            ? 'bg-green-50 border-green-300'
                            : stage.isCurrent
                            ? 'bg-blue-50 border-blue-400 shadow-lg'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${statusDisplay.bgColor}`}>
                              {stage.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-xl font-semibold text-gray-900">{stage.label}</h4>
                                <StageStatusBadge stage={stage} />
                                {stage.isCurrent && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    <Zap className="h-3 w-3" />
                                    Current Stage
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 mb-4">{stage.description}</p>
                              
                              {/* Progress Bar */}
                              <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">Stage Progress</span>
                                  <span className="text-lg font-bold text-blue-600">
                                    {stage.progress?.percentage || 0}%
                                  </span>
                                </div>
                                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      stage.completed ? 'bg-green-500' : 
                                      stage.isCurrent ? 'bg-blue-500' : 
                                      'bg-gray-400'
                                    }`}
                                    style={{ width: `${stage.progress?.percentage || 0}%` }}
                                  />
                                </div>
                              </div>
                              
                              {/* Stage Details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="text-sm text-gray-600 mb-1">Estimated Time</div>
                                  <div className="font-medium text-gray-900">{stage.estimatedTime}</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="text-sm text-gray-600 mb-1">Status</div>
                                  <div className="font-medium text-gray-900">{stage.statusLabel}</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="text-sm text-gray-600 mb-1">Mandatory</div>
                                  <div className="font-medium text-gray-900">
                                    {stage.mandatory ? 'Required' : 'Optional'}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Document Status */}
                              {stage.documentId ? (
                                <div className="mb-6 p-4 bg-white border border-green-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-5 w-5 text-green-600" />
                                      <div>
                                        <h5 className="font-medium text-gray-900">Document Created</h5>
                                        <p className="text-sm text-gray-600">
                                          {stage.documentType || 'Document'} #{stage.documentId?.slice(-8)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleViewStageDocument(stage.stage, stage.documentId)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                      >
                                        View Document
                                      </button>
                                      {stage.status === 'needs_approval' && (
                                        <button
                                          onClick={() => handleApproveStage(stage.stage, stage.documentId)}
                                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          Approve
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <FilePlus className="h-5 w-5 text-gray-400" />
                                      <div>
                                        <h5 className="font-medium text-gray-900">No Document Created</h5>
                                        <p className="text-sm text-gray-600">
                                          Create a {stage.label.toLowerCase()} to proceed
                                        </p>
                                      </div>
                                    </div>
                                    {stage.isCurrent && (
                                      <button
                                        onClick={() => handleCreateStageDocument(stage.stage)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                      >
                                        Create {stage.label}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {stage.actions.map((action) => (
                                  <StageButton key={action.id} stage={stage} action={action} />
                                ))}
                              </div>
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
                  {workOrder.preChecklistId ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      {preChecklist?.approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Not Started
                    </span>
                  )}
                </div>

                {workOrder.preChecklistId ? (
                  <div className="space-y-6">
                    {/* Checklist Details */}
                    <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                              <ClipboardCheck className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">Pre-Checklist Details</h4>
                              <p className="text-gray-600">
                                {preChecklist?.serviceType === 'headlight' 
                                  ? 'Headlight Pre-Service Inspection' 
                                  : 'Pre-service inspection'} for {getCustomerName()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-2xl font-bold text-gray-900 mb-1">
                                {preChecklist?.inspectionItems?.length || 0}
                              </div>
                              <div className="text-sm text-gray-600">Total Items</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-2xl font-bold text-green-600 mb-1">
                                {preChecklist?.inspectionItems?.filter((item: any) => item.status === 'ok' || item.status === 'pending').length || 0}
                              </div>
                              <div className="text-sm text-green-600">OK / Pending</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-2xl font-bold text-red-600 mb-1">
                                {preChecklist?.inspectionItems?.filter((item: any) => item.status === 'fault').length || 0}
                              </div>
                              <div className="text-sm text-red-600">Faults Found</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-2xl font-bold text-blue-600 mb-1">
                                {preChecklist?.approved ? 'Approved' : 'In Progress'}
                              </div>
                              <div className="text-sm text-blue-600">Status</div>
                            </div>
                          </div>
                          
                          {/* Auto-Approval Notice */}
                          {preChecklist?.approved && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-green-700">
                                    ✓ This checklist has been approved.
                                    {workOrder.currentStage === 'pre_checklist' && 
                                    ' You can now proceed to the Job Card stage.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewStageDocument('pre_checklist', workOrder.preChecklistId)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Checklist
                            </button>
                            
                            {/* Edit button only if still in pre_checklist stage */}
                            {workOrder.currentStage === 'pre_checklist' && !preChecklist?.approved && (
                              <button
                                onClick={() => handleEditStageDocument('pre_checklist', workOrder.preChecklistId)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit Checklist
                              </button>
                            )}

                            {workOrder.preChecklistId && !preChecklist?.approved && (
                              <button
                                onClick={() => handleApproveStage('prechecklist', workOrder.preChecklistId)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve Pre-Checklist
                              </button>
                            )}
                            
                            {/* Show current stage info */}
                            {workOrder.currentStage !== 'pre_checklist' && (
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-gray-600">
                                  Moved to: <span className="font-medium">{workOrderService.getStageLabel(workOrder.currentStage)}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Next Stage Information */}
                    {workOrder.currentStage === 'job_card' && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <Wrench className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-2">✓ Ready for Job Card Creation</h4>
                            <p className="text-gray-600 mb-4">
                              Pre-checklist completed and approved. Now you can create job cards for technicians.
                            </p>
                            <button
                              onClick={() => handleCreateStageDocument('job_card')}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Create Job Card
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <ClipboardCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Pre-Checklist Created</h4>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      Start the workflow by creating a pre-service inspection checklist.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => handleCreateStageDocument('pre_checklist')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Pre-Checklist
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'job-cards' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Job Cards</h3>
                    <p className="text-sm text-gray-600">Detailed job tasks and technician assignments</p>
                  </div>
                  <button
                    onClick={() => handleCreateStageDocument('job_card')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Job Card
                  </button>
                </div>

                {jobCards.length > 0 ? (
                  <div className="space-y-4">
                    {jobCards.map((jobCard) => (
                      <div key={jobCard._id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Wrench className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{jobCard.jobTitle || 'Job Card'}</h4>
                                <p className="text-sm text-gray-600">Assigned to: {jobCard.assignedTo?.name || 'Unassigned'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-gray-600">Status</div>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  jobCard.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  jobCard.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {jobCard.status === 'completed' ? 'Completed' :
                                   jobCard.status === 'in_progress' ? 'In Progress' :
                                   'Pending'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Priority</div>
                                <div className="font-medium">{jobCard.priority || 'Medium'}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Est. Hours</div>
                                <div className="font-medium">{jobCard.estimatedHours || 0} hours</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewStageDocument('job_card', jobCard._id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleEditStageDocument('job_card', jobCard._id)}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Job Cards Created</h4>
                    <p className="text-gray-600 mb-6">
                      Create job cards to assign specific tasks and track work progress.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleCreateStageDocument('job_card')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Job Card
                      </button>
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
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                      Post-Checklist
                    </h3>
                    <p className="text-sm text-gray-600">Post-service verification and quality check</p>
                  </div>
                  {workOrder.postChecklistId ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      {postChecklist?.approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Not Started
                    </span>
                  )}
                </div>

                {workOrder.postChecklistId ? (
                  <div className="space-y-6">
                    {/* Checklist Details */}
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                              <ClipboardList className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">Post-Checklist Details</h4>
                              <p className="text-gray-600">
                                Post-service quality verification for {getCustomerName()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-2xl font-bold text-gray-900 mb-1">
                                {postChecklist?.inspectionItems?.length || 0}
                              </div>
                              <div className="text-sm text-gray-600">Total Items</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-2xl font-bold text-green-600 mb-1">
                                {postChecklist?.inspectionItems?.filter((item: any) => item.status === 'completed').length || 0}
                              </div>
                              <div className="text-sm text-green-600">Completed</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-2xl font-bold text-yellow-600 mb-1">
                                {postChecklist?.inspectionItems?.filter((item: any) => item.status === 'incomplete').length || 0}
                              </div>
                              <div className="text-sm text-yellow-600">Incomplete</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-2xl font-bold text-blue-600 mb-1">
                                {postChecklist?.approved ? 'Approved' : 'Pending'}
                              </div>
                              <div className="text-sm text-blue-600">Status</div>
                            </div>
                          </div>
                          
                          {/* Auto-Approval Notice */}
                          {postChecklist?.approved && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-green-700">
                                    ✓ This checklist has been approved.
                                    {workOrder.currentStage === 'post_checklist' && 
                                    ' You can now proceed to the Invoice stage.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewStageDocument('post_checklist', workOrder.postChecklistId)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Checklist
                            </button>
                            
                            {/* Edit button only if still in post_checklist stage */}
                            {workOrder.currentStage === 'post_checklist' && !postChecklist?.approved && (
                              <button
                                onClick={() => handleEditStageDocument('post_checklist', workOrder.postChecklistId)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit Checklist
                              </button>
                            )}

                            {workOrder.postChecklistId && !postChecklist?.approved && (
                              <button
                                onClick={() => handleApproveStage('postchecklist', workOrder.postChecklistId)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve Post-Checklist
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Next Stage Information */}
                    {workOrder.currentStage === 'invoice' && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <ReceiptIcon className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-2">✓ Ready for Invoice Generation</h4>
                            <p className="text-gray-600 mb-4">
                              Post-checklist completed and approved. Now you can generate the invoice.
                            </p>
                            <button
                              onClick={() => handleCreateStageDocument('invoice')}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Create Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Post-Checklist Created</h4>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      Create a post-service quality verification checklist.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => handleCreateStageDocument('post_checklist')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Post-Checklist
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Invoice</h3>
                    <p className="text-sm text-gray-600">Generate and manage billing</p>
                  </div>
                  {workOrder.invoiceId ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      {workOrder.invoicePaid ? 'Paid' : 'Generated'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      <AlertCircle className="h-4 w-4" />
                      Not Created
                    </span>
                  )}
                </div>

                {workOrder.invoiceId ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-lg">
                              <ReceiptIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Invoice Generated</h4>
                              <p className="text-sm text-gray-600">
                                Invoice #{workOrder.invoiceId.slice(-8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-600">Amount</div>
                              <div className="text-xl font-bold text-gray-900">
                                {formatCurrency(workOrder.totalCost)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Status</div>
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                workOrder.invoicePaid 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {workOrder.invoicePaid ? 'Paid' : 'Pending Payment'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Payment Date</div>
                              <div className="font-medium">
                                {workOrder.invoicePaymentDate 
                                  ? formatDate(workOrder.invoicePaymentDate)
                                  : 'Not paid'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewStageDocument('invoice', workOrder.invoiceId)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Invoice
                            </button>
                            {!workOrder.invoicePaid && (
                              <button
                                onClick={async () => {
                                  try {
                                    await workOrderService.updateWorkOrder(workOrder._id, {
                                      invoicePaid: true,
                                      invoicePaymentDate: new Date().toISOString()
                                    });
                                    showToast('Invoice marked as paid', 'success');
                                    fetchWorkOrder();
                                  } catch (error) {
                                    showToast('Failed to mark as paid', 'error');
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Mark as Paid
                              </button>
                            )}
                            {workOrder.currentStage === 'invoice' && !workOrder.invoicePaid && (
                              <button
                                onClick={() => handleEditStageDocument('invoice', workOrder.invoiceId)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit Invoice
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <ReceiptIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Invoice Created</h4>
                    <p className="text-gray-600 mb-6">
                      Generate an invoice to bill the customer for completed work.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setShowGenerateInvoiceModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FilePlus className="h-4 w-4" />
                        Generate Invoice
                      </button>
                      <button
                        onClick={() => setShowLinkInvoiceModal(true)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Link Existing Invoice
                      </button>
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
                          preChecklist?.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {preChecklist?.approved ? 'Approved' : 'Pending'}
                        </span>
                        <button
                          onClick={() => handleViewStageDocument('pre_checklist', workOrder.preChecklistId)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Job Cards */}
                  {jobCards.length > 0 && (
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Job Cards</h4>
                          <p className="text-sm text-gray-600">
                            {jobCards.length} job{jobCards.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {jobCards.filter(j => j.status === 'completed').length}/{jobCards.length} Complete
                        </span>
                        <button
                          onClick={() => router.push(`/job-cards?workOrderId=${workOrder._id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View All →
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
                          postChecklist?.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {postChecklist?.approved ? 'Approved' : 'Pending'}
                        </span>
                        <button
                          onClick={() => handleViewStageDocument('post_checklist', workOrder.postChecklistId)}
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
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {workOrder.invoicePaid ? 'Paid' : 'Pending'}
                        </span>
                        <button
                          onClick={() => handleViewStageDocument('invoice', workOrder.invoiceId)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quotation */}
                  {workOrder.quoteId && (
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Quotation</h4>
                          <p className="text-sm text-gray-600">Original quote</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          Linked
                        </span>
                        <button
                          onClick={() => {
                            const quoteId = typeof workOrder.quoteId === 'object' 
                              ? workOrder.quoteId._id 
                              : workOrder.quoteId;
                            router.push(`/quotes/${quoteId}`);
                          }}
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