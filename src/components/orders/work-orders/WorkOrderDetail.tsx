'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, ArrowLeft, Calendar, User, 
  Edit, Printer, Download,
  CheckCircle, Clock,
  Play, FileText, Loader2, MoreVertical, AlertCircle,
  BarChart3, History, MessageSquare, EyeOff,
  Trash2, Eye, 
  RefreshCw, Truck as TruckIcon, 
  CreditCard as CreditCardIcon, Receipt as ReceiptIcon,
  ClipboardCheck, ClipboardList,
  FileCheck, FilePlus, FileX, ArrowRight,
  X, HelpCircle,
  CheckSquare, Check,
  Activity,
  Archive,
  Link as LinkIcon,
  AlertTriangle,
  Package,
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Plus,
  Info,
  Layers,
  Target,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Globe,
  Briefcase as BriefcaseIcon,
  Users as UsersIcon,
  Package as PackageIcon,
  Sparkles,
  Zap,
  Rocket,
  Bolt,
  Users,
  CheckCheck,
  Clock4
} from 'lucide-react';
import { workOrderService, WorkOrder, TechnicianNote, DelayInfo } from '@/services/workOrderService';
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
  canTransition?: boolean;
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
  const [showResolveDelayModal, setShowResolveDelayModal] = useState(false);
  const [showDelayHistoryModal, setShowDelayHistoryModal] = useState(false);
  const [delayHistory, setDelayHistory] = useState<any[]>([]);
  const [delayExpectedTime, setDelayExpectedTime] = useState('');
  const [delayDays, setDelayDays] = useState(0);
  const [delayHours, setDelayHours] = useState(0);
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
  const [showAutoTransition, setShowAutoTransition] = useState(false);
  const [autoTransitionStage, setAutoTransitionStage] = useState<string | null>(null);
  const [autoTransitionCountdown, setAutoTransitionCountdown] = useState(5);
  const [stageOverview, setStageOverview] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [shouldCreateJobCard, setShouldCreateJobCard] = useState(false);
  const [jobCardRedirectUrl, setJobCardRedirectUrl] = useState('');
  const [jobCardStatus, setJobCardStatus] = useState<{
    needsJobCard: boolean;
    reason: string;
    checking: boolean;
  }>({
    needsJobCard: false,
    reason: '',
    checking: true
  });

  const [postChecklistStatus, setPostChecklistStatus] = useState<{
    needsPostChecklist: boolean;
    reason: string;
    checking: boolean;
  }>({
    needsPostChecklist: false,
    reason: '',
    checking: true
  });

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

  useEffect(() => {
    if (showAutoTransition && autoTransitionCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoTransitionCountdown(prev => {
          if (prev <= 1) {
            handleAutoTransitionNow(autoTransitionStage!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showAutoTransition, autoTransitionCountdown, autoTransitionStage]);

  useEffect(() => {
    if (workOrder && autoRefresh) {
      fetchStageOverview();
      
      // Set up auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchStageOverview();
      }, 10000);
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [workOrder, autoRefresh]);

  useEffect(() => {
    const checkForJobCardCreation = async () => {
      if (!workOrder) return;
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      try {
        const check = await lifecycleIntegrationService.shouldRedirectToJobCardCreation(opportunityId);
        
        if (check.shouldRedirect && check.workOrderId) {
          setShouldCreateJobCard(true);
          const url = `/job-cards/create?workOrderId=${check.workOrderId}&opportunityId=${opportunityId}&autoRedirect=true`;
            setJobCardRedirectUrl(url);
          
          // Optionally auto-redirect after a delay
          setTimeout(() => {
            router.push(url);
          }, 2000); // 2 second delay to show message
        }
      } catch (error) {
        console.error('Error checking job card creation:', error);
      }
    };
    
    if (workOrder) {
      checkForJobCardCreation();
    }
  }, [workOrder]);

//   useEffect(() => {
//   const checkJobCardStatus = async () => {
//     if (!workOrder) return;
    
//     const opportunityId = typeof workOrder.opportunityId === 'object' 
//       ? workOrder.opportunityId._id 
//       : workOrder.opportunityId;
    
//     try {
//       setJobCardStatus(prev => ({ ...prev, checking: true }));
      
//       const check = await lifecycleIntegrationService.checkJobCardCreationNeeded(opportunityId);
      
//       setJobCardStatus({
//         needsJobCard: check.needsJobCard,
//         reason: check.reason,
//         checking: false
//       });
      
//     } catch (error) {
//       console.error('Error checking job card status:', error);
//       setJobCardStatus({
//         needsJobCard: false,
//         reason: 'Error checking job card status',
//         checking: false
//       });
//     }
//   };
  
//   // Check when work order changes or when we're on job-cards tab
//   if (workOrder && (activeTab === 'job-cards' || activeTab === 'overview' || activeTab === 'stages')) {
//     checkJobCardStatus();
//   }
// }, [workOrder, activeTab]);

useEffect(() => {
  const checkStageRequirements = async () => {
    if (!workOrder) return;
    
    const opportunityId = typeof workOrder.opportunityId === 'object' 
      ? workOrder.opportunityId._id 
      : workOrder.opportunityId;
    
    try {
      setJobCardStatus(prev => ({ ...prev, checking: true }));
      setPostChecklistStatus(prev => ({ ...prev, checking: true }));
      
      const check = await lifecycleIntegrationService.checkStageRequirements(opportunityId);
      
      setJobCardStatus({
        needsJobCard: check.jobCardNeeded,
        reason: check.jobCardStatus.reason,
        checking: false
      });
      
      setPostChecklistStatus({
        needsPostChecklist: check.postChecklistNeeded,
        reason: check.postChecklistStatus.reason,
        checking: false
      });
      
    } catch (error) {
      console.error('Error checking stage requirements:', error);
      setJobCardStatus({
        needsJobCard: false,
        reason: 'Error checking job card status',
        checking: false
      });
      setPostChecklistStatus({
        needsPostChecklist: false,
        reason: 'Error checking post-checklist status',
        checking: false
      });
    }
  };
  
  if (workOrder && (activeTab === 'overview' || activeTab === 'stages' || 
      activeTab === 'job-cards' || activeTab === 'post-checklist')) {
    checkStageRequirements();
  }
}, [workOrder, activeTab]);

  // Also update the fetchWorkOrder function to remove the initialization call:
  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const data = await workOrderService.getWorkOrderById(orderId);
      setWorkOrder(data);
      
      await transformWorkOrderToStages(data);
      await fetchStageOverview();
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

  // Add this useEffect to listen for changes and refresh data
  // useEffect(() => {
  //   // Refresh data when pre-checklist is created or approved
  //   const refreshData = async () => {
  //     if (workOrder) {
  //       // Wait a moment for backend to process
  //       await new Promise(resolve => setTimeout(resolve, 1000));
        
  //       // Refresh all data
  //       await fetchWorkOrder();
        
  //       // Force re-fetch of pre-checklist if it exists
  //       if (workOrder.preChecklistId) {
  //         fetchPreChecklist();
  //       }
        
  //       // Force re-fetch of stage overview
  //       fetchStageOverview();
  //     }
  //   };

  //   // Listen for pre-checklist creation/approval events
  //   const handleChecklistEvent = () => {
  //     refreshData();
  //   };

  //   // You can use a custom event or polling
  //   const interval = setInterval(() => {
  //     if (workOrder) {
  //       refreshData();
  //     }
  //   }, 5000); // Poll every 5 seconds

  //   return () => clearInterval(interval);
  // }, [workOrder?._id]);

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

  const fetchStageOverview = async () => {
    if (!workOrder) {
      setStageOverview(null);
      return;
    }
    
    try {
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      // First check if we have any documents
      if (workOrder.preChecklistId) {
        // Force workflow initialization if needed
        try {
          const overview = await lifecycleIntegrationService.getStageOverview(opportunityId);
          
          if (!overview) {
            // Try to initialize workflow
            await lifecycleIntegrationService.initializeWorkOrderWorkflow(opportunityId);
            
            // Try getting overview again
            const newOverview = await lifecycleIntegrationService.getStageOverview(opportunityId);
            setStageOverview(newOverview || getDefaultStageOverview());
          } else {
            setStageOverview(overview);
          }
        } catch (error) {
          console.error('Error fetching stage overview, using default:', error);
          setStageOverview(getDefaultStageOverview());
        }
      } else {
        // No pre-checklist yet, show default
        setStageOverview(getDefaultStageOverview());
      }
    } catch (error) {
      console.error('Error fetching stage overview:', error);
      setStageOverview(getDefaultStageOverview());
    }
  };

  // Add helper function for default overview
  const getDefaultStageOverview = () => {
    return {
      currentStage: {
        id: 'prechecklist',
        label: 'Pre-Checklist',
        description: 'Complete pre-service inspection',
        status: workOrder?.preChecklistId ? 'in_progress' : 'not_started',
        progress: workOrder?.preChecklistId ? 50 : 0,
        icon: '✅',
        color: workOrder?.preChecklistId ? 'blue' : 'gray',
        hasDocument: !!workOrder?.preChecklistId,
        documentStatus: workOrder?.preChecklistId ? 'pending' : 'none',
        canProceed: false,
        requirements: [workOrder?.preChecklistId ? 'Complete and approve checklist' : 'Create pre-checklist']
      },
      nextStage: {
        id: 'jobcard',
        label: 'Job Card',
        description: 'Create detailed work instructions',
        icon: '🔧',
        isReady: false,
        requirements: ['Complete Pre-Checklist']
      },
      progress: {
        percentage: workOrder?.preChecklistId ? 25 : 0,
        completed: workOrder?.preChecklistId ? 1 : 0,
        total: 4,
        estimatedCompletion: 'Not started'
      },
      actions: [{
        id: 'create-pre-checklist',
        label: workOrder?.preChecklistId ? 'Continue Pre-Checklist' : 'Create Pre-Checklist',
        type: 'primary',
        icon: workOrder?.preChecklistId ? 'edit' : 'plus',
        description: workOrder?.preChecklistId ? 'Continue working on pre-checklist' : 'Start the workflow',
        action: 'create'
      }]
    };
  };

  const refreshAllData = async () => {
    if (!workOrder) return;
    
    try {
      // Fetch work order data
      await fetchWorkOrder();
      
      // Fetch stage overview
      await fetchStageOverview();
      
      // Fetch related documents
      fetchJobCards();
      fetchInvoice();
      
      // Fetch checklists based on active tab
      if (workOrder.preChecklistId) {
        fetchPreChecklist();
      }
      if (workOrder.postChecklistId) {
        fetchPostChecklist();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleCreatePreChecklistDirect = async () => {
    if (!workOrder) return;
    
    try {
      setIsTransitioning(true);
      
      // First initialize workflow if not already initialized
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      // Initialize workflow
      await lifecycleIntegrationService.initializeWorkOrderWorkflow(opportunityId);
      
      // Navigate to pre-checklist creation
      router.push(`/pre-checklist/create?workOrderId=${workOrder._id}&opportunityId=${opportunityId}&vehicleId=${workOrder.vehicleId}&autoTransition=true`);
      
    } catch (error) {
      console.error('Error navigating to pre-checklist creation:', error);
      showToast('Failed to initialize workflow', 'error');
    } finally {
      setIsTransitioning(false);
    }
  };

  const CurrentStageDisplay = () => {
    // If there's no pre-checklist yet, always show create options
    if (!stageOverview && !workOrder?.preChecklistId) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Work Order Process</h2>
                <p className="text-gray-600 mb-4">
                  Begin by creating the pre-service inspection checklist. This will automatically initialize the workflow.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleCreatePreChecklistDirect()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    disabled={isTransitioning}
                  >
                    {isTransitioning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create Pre-Checklist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // If we have pre-checklist but workflow not showing properly
    if (workOrder?.preChecklistId && !stageOverview) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <ClipboardCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pre-Checklist Created</h2>
                <p className="text-gray-600 mb-4">
                  Pre-checklist has been created. Loading workflow status...
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Manually trigger workflow initialization
                      const opportunityId = typeof workOrder.opportunityId === 'object' 
                        ? workOrder.opportunityId._id 
                        : workOrder.opportunityId;
                      lifecycleIntegrationService.initializeWorkOrderWorkflow(opportunityId);
                      fetchWorkOrder();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Initialize Workflow
                  </button>
                  
                  <button
                    onClick={() => router.push(`/pre-checklist/${workOrder.preChecklistId}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Pre-Checklist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (shouldCreateJobCard) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Job Card</h2>
              <p className="text-gray-600 mb-4">
                Pre-checklist completed. You need to create a job card to assign technicians and track work progress.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium mb-1">
                      Redirecting to Job Card Creation...
                    </p>
                    <p className="text-yellow-700 text-sm">
                      You will be automatically redirected to the job card creation page in a few seconds.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push(jobCardRedirectUrl)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Go to Job Card Creation
                </button>
                
                <button
                  onClick={() => {
                    setShouldCreateJobCard(false);
                    // Optional: stay on current page
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Create Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stageOverview?.currentStage?.id === 'postchecklist' && 
      postChecklistStatus.needsPostChecklist && 
      !postChecklistStatus.checking) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <ClipboardList className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Create Post-Checklist</h2>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  Action Required
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">
                Job card completed. Create a post-checklist for quality verification.
              </p>
              
              {/* Status Message */}
              <div className={`p-4 rounded-lg mb-6 ${
                postChecklistStatus.reason.includes('No post-checklist') 
                  ? 'bg-purple-50 border border-purple-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  {postChecklistStatus.reason.includes('No post-checklist') ? (
                    <FilePlus className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      {postChecklistStatus.reason.includes('No post-checklist') 
                        ? 'Post-Checklist Not Created' 
                        : 'Post-Checklist Needs Completion'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {postChecklistStatus.reason}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push(`/post-checklist/create?workOrderId=${workOrder?._id}&jobCardId=${jobCards[0]?._id}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Post-Checklist
                </button>
                
                {/* <button
                  onClick={() => {
                    const opportunityId = typeof workOrder?.opportunityId === 'object' 
                      ? workOrder.opportunityId._id 
                      : workOrder?.opportunityId;
                    if (opportunityId) {
                      lifecycleIntegrationService.checkStageRequirements(opportunityId)
                        .then(check => {
                          setPostChecklistStatus({
                            needsPostChecklist: check.postChecklistNeeded,
                            reason: check.postChecklistStatus.reason,
                            checking: false
                          });
                        });
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Check Again
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If current stage is jobcard and no job card exists (non-redirect version)
  if (stageOverview?.currentStage?.id === 'jobcard' && 
      jobCardStatus.needsJobCard && 
      !jobCardStatus.checking) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Create Job Card</h2>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Action Required
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">
                Pre-checklist completed. You need to create a job card with technician assignments to proceed.
              </p>
              
              {/* Status Message */}
              <div className={`p-4 rounded-lg mb-6 ${
                jobCardStatus.reason.includes('No job cards') 
                  ? 'bg-blue-50 border border-blue-200' 
                  : jobCardStatus.reason.includes('not properly assigned')
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-start gap-3">
                  {jobCardStatus.reason.includes('No job cards') ? (
                    <FilePlus className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : jobCardStatus.reason.includes('not properly assigned') ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      {jobCardStatus.reason.includes('No job cards') 
                        ? 'Job Card Not Created' 
                        : 'Job Card Needs Setup'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {jobCardStatus.reason}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push(`/job-cards/create?workOrderId=${workOrder?._id}&opportunityId=${workOrder?.opportunityId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Job Card
                </button>
                
                <button
                  onClick={() => {
                    // Refresh job card status
                    const opportunityId = typeof workOrder?.opportunityId === 'object' 
                      ? workOrder.opportunityId._id 
                      : workOrder?.opportunityId;
                    if (opportunityId) {
                      lifecycleIntegrationService.checkJobCardCreationNeeded(opportunityId)
                        .then(check => {
                          setJobCardStatus({
                            needsJobCard: check.needsJobCard,
                            reason: check.reason,
                            checking: false
                          });
                        });
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Check Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
    
    // Only show stage overview if we have data
    if (!stageOverview) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <span className="text-gray-600">Loading workflow status...</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Original stage overview display when we have data
    const { currentStage, nextStage, progress, actions } = stageOverview;
    
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className={`text-2xl ${currentStage.color === 'green' ? 'text-green-600' :
                currentStage.color === 'blue' ? 'text-blue-600' :
                currentStage.color === 'yellow' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {currentStage.icon === '✅' ? <ClipboardCheck className="h-6 w-6" /> :
                currentStage.icon === '🔧' ? <Wrench className="h-6 w-6" /> :
                currentStage.icon === '📋' ? <ClipboardList className="h-6 w-6" /> :
                currentStage.icon === '💰' ? <ReceiptIcon className="h-6 w-6" /> :
                <ClipboardCheck className="h-6 w-6" />}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Current Stage: {currentStage.label}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentStage.status === 'completed' ? 'bg-green-100 text-green-800' :
                  currentStage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  currentStage.status === 'needs_approval' ? 'bg-yellow-100 text-yellow-800' :
                  currentStage.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentStage.status.toUpperCase().replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{currentStage.description}</p>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Stage Progress</span>
                  <span className="text-lg font-bold text-blue-600">{currentStage.progress}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentStage.status === 'completed' || currentStage.status === 'approved' ? 'bg-green-500' :
                      currentStage.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                      currentStage.status === 'needs_approval' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${currentStage.progress}%` }}
                  />
                </div>
              </div>
              
              {/* Document Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Document Status</div>
                      <div className="font-medium text-gray-900">
                        {currentStage.hasDocument ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Document Created</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FilePlus className="h-4 w-4 text-yellow-600" />
                            <span>No Document</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className={`text-sm font-medium ${
                        currentStage.documentStatus === 'approved' ? 'text-green-600' :
                        currentStage.documentStatus === 'completed' ? 'text-blue-600' :
                        currentStage.documentStatus === 'paid' ? 'text-green-600' :
                        'text-yellow-600'
                      }`}>
                        {currentStage.documentStatus || 'Not started'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Next Action</div>
                  <div className="font-medium text-gray-900">
                    {currentStage.canProceed ? 'Ready to proceed' : 'Complete requirements'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentStage.requirements[0] || 'Pending'}
                  </div>
                </div>
              </div>
              
              {/* Requirements */}
              {currentStage.requirements.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Requirements to proceed:</h4>
                  <ul className="space-y-2">
                    {currentStage.requirements.map((req: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {currentStage.canProceed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <span className={`text-sm ${currentStage.canProceed ? 'text-green-700' : 'text-gray-700'}`}>
                          {req}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {actions.map((action: any) => (
                  <button
                    key={action.id}
                    onClick={() => handleOverviewAction(action, currentStage)}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                      action.type === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                      action.type === 'secondary' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' :
                      action.type === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
                      'bg-yellow-600 text-white hover:bg-yellow-700'
                    }`}
                    title={action.description}
                  >
                    {getActionIcon(action.icon)}
                    {action.label}
                  </button>
                ))}
                
                {/* Refresh Button */}
                <button
                  onClick={refreshAllData}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  title="Refresh workflow status"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 mb-1">{progress.percentage}%</div>
            <div className="text-sm text-gray-600">Overall Progress</div>
            <div className="text-xs text-gray-500 mt-1">
              {progress.completed} of {progress.total} stages
            </div>
          </div>
        </div>
        
        {/* Next Stage Preview */}
        {nextStage && (
          <div className="border-t border-blue-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Next: {nextStage.label}</h4>
                  <p className="text-sm text-gray-600">{nextStage.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">Requirements:</div>
                <div className="text-xs text-gray-600">
                  {nextStage.isReady ? '✓ Ready' : nextStage.requirements.join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function for action icons
  const getActionIcon = (icon: string) => {
    switch (icon) {
      case 'plus':
        return <Plus className="h-4 w-4" />;
      case 'eye':
        return <Eye className="h-4 w-4" />;
      case 'check':
        return <Check className="h-4 w-4" />;
      case 'check-circle':
        return <CheckCircle className="h-4 w-4" />;
      case 'arrow-right':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  // Handle overview actions
  const handleOverviewAction = async (action: any, currentStage: any) => {
    if (!workOrder) return;
    
    try {
      switch (action.action) {
        case 'create':
          await handleCreateStageDocument(currentStage.id);
          break;
        case 'view':
          if (currentStage.hasDocument && workOrder) {
            switch (currentStage.id) {
              case 'prechecklist':
              case 'pre_checklist':
                router.push(`/pre-checklist/${workOrder.preChecklistId}`);
                break;
              case 'jobcard':
              case 'job_card':
                const jobCards = await jobCardService.getJobCardsByOpportunity(
                  typeof workOrder.opportunityId === 'object' 
                    ? workOrder.opportunityId._id 
                    : workOrder.opportunityId
                );
                if (jobCards.length > 0) {
                  router.push(`/job-cards/${jobCards[0]._id}`);
                }
                break;
              case 'postchecklist':
              case 'post_checklist':
                router.push(`/post-checklist/${workOrder.postChecklistId}`);
                break;
              case 'invoice':
                router.push(`/invoices/${workOrder.invoiceId}`);
                break;
            }
          }
          break;
        case 'approve':
          if (currentStage.hasDocument && workOrder) {
            if (currentStage.id === 'prechecklist' || currentStage.id === 'pre_checklist') {
              await approvePreChecklist(workOrder.preChecklistId!);
            } else if (currentStage.id === 'postchecklist' || currentStage.id === 'post_checklist') {
              await approvePostChecklist(workOrder.postChecklistId!);
            }
          }
          break;
        case 'complete':
          if (currentStage.hasDocument && workOrder) {
            const jobCards = await jobCardService.getJobCardsByOpportunity(
              typeof workOrder.opportunityId === 'object' 
                ? workOrder.opportunityId._id 
                : workOrder.opportunityId
            );
            if (jobCards.length > 0) {
              await completeJobCard(jobCards[0]._id);
            }
          }
          break;
        case 'transition':
          if (currentStage.canProceed) {
            const currentWorkflowStage = workflowStages.find(stage => stage.isCurrent);
            if (currentWorkflowStage) {
              await handleTransitionToNextStage(currentWorkflowStage);
            }
          }
          break;
      }
      
      // Refresh data after action
      // setTimeout(refreshAllData, 1000);
    } catch (error) {
      console.error('Action error:', error);
      showToast('Action failed', 'error');
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

  const transformWorkOrderToStages = async (order: WorkOrder) => {
    if (!order) {
      setWorkflowStages([]);
      return;
    }
    
    try {
      const opportunityId = typeof order.opportunityId === 'object' 
        ? order.opportunityId._id 
        : order.opportunityId;
      
      if (!opportunityId) {
        fallbackTransform(order);
        return;
      }
      
      // Get workflow UI
      let workflowUI;
      try {
        workflowUI = await lifecycleIntegrationService.getEnhancedWorkflowUI(opportunityId);
      } catch (error) {
        // If no workflow exists but we have a pre-checklist, initialize it
        if (order.preChecklistId) {
          await lifecycleIntegrationService.initializeWorkOrderWorkflow(opportunityId);
          workflowUI = await lifecycleIntegrationService.getEnhancedWorkflowUI(opportunityId);
        } else {
          fallbackTransform(order);
          return;
        }
      }
      
      const stages = workflowUI.stages.map((stage: any, index: number) => {
        // Determine correct status based on document
        let status: StageStatus = 'not_started';
        let completed = false;
        
        switch (stage.stage) {
          case 'prechecklist':
            // Auto-approved when created (client signs form)
            status = stage.document?.approved ? 'approved' : 'in_progress';
            completed = !!stage.document;
            break;
            
          case 'jobcard':
            // Status depends on job card state
            if (stage.document?.status === 'completed') {
              status = 'completed';
              completed = true;
            } else if (stage.document?.status === 'in_progress') {
              status = 'in_progress';
            } else if (stage.document) {
              status = 'in_progress'; // Created but not started
            }
            break;
            
          case 'postchecklist':
            // Auto-approved when created (client signs form)
            status = stage.document?.approved ? 'approved' : 'in_progress';
            completed = !!stage.document;
            break;
            
          case 'invoice':
            status = stage.document?.status === 'paid' ? 'completed' : 
                    stage.document ? 'in_progress' : 'not_started';
            completed = stage.document?.status === 'paid';
            break;
        }
        
        const statusDisplay = getStageStatusDisplay(status);
        
        // Build actions
        const actions = buildStageActionsFromEnhanced(stage, order);
        
        return {
          id: `stage-${stage.stage}`,
          stage: stage.stage,
          label: stage.label,
          description: stage.description,
          status,
          completed,
          isCurrent: stage.isCurrent,
          document: stage.document,
          documentId: stage.documentId,
          documentType: stage.documentType,
          actions,
          statusLabel: statusDisplay.label,
          statusColor: statusDisplay.color,
          bgColor: statusDisplay.bgColor,
          statusIcon: statusDisplay.icon,
          icon: getStageIcon(stage.stage),
          mandatory: true,
          estimatedTime: getStageEstimatedTime(stage.stage),
          canSkip: false,
          progress: stage.progress || 0,
          validation: stage.validation,
          nextAction: stage.nextAction
        };
      });
      
      setWorkflowStages(stages);
      
    } catch (error) {
      console.error('Error transforming work order to stages:', error);
      fallbackTransform(order);
    }
  };

  // Helper functions that need to be defined or updated:

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
    let actions: any[] = [];

    // Map enhanced actions to our component actions
    if (stage.actions && Array.isArray(stage.actions)) {
      stage.actions.forEach((enhancedAction: any) => {
        const action = mapEnhancedAction(enhancedAction, stage, order);
        if (action) actions.push(action);
      });
    }

    // Remove manual approve actions for checklists (they auto-approve)
    if (stage.stage === 'prechecklist' || stage.stage === 'postchecklist') {
      actions = actions.filter((a) => a.id !== 'approve');
    }

    // Enhance job card stage actions
    if (stage.stage === 'jobcard') {
      const jobCardId = stage.documentId || stage.document?._id || stage.document?.id;
      const status = (stage.document?.status || '').toLowerCase();

      // Create job card if doesn't exist
      if (!jobCardId) {
        if (!actions.some((a) => a.id === 'create')) {
          actions.unshift({
            id: 'create',
            label: 'Create Job Card',
            icon: <FilePlus className="h-4 w-4" />,
            variant: 'primary',
            description: 'Create the job card from a form',
            // action: () => handleCreateDocumentForStage('jobcard')
          });
        }
      } else {
        // Add technician flow actions
        if (['draft', 'created', 'pending'].includes(status)) {
          actions.push({
            id: 'start_job',
            label: 'Start Job',
            icon: <Play className="h-4 w-4" />,
            variant: 'primary',
            description: 'Technician starts the job',
            action: () => router.push(`/job-cards/${jobCardId}?action=start`)
          });
        }
        
        if (['in_progress', 'started'].includes(status)) {
          actions.push({
            id: 'add_delay',
            label: 'Add Delay',
            icon: <Clock className="h-4 w-4" />,
            variant: 'warning',
            description: 'Record a delay and reason',
            action: () => router.push(`/job-cards/${jobCardId}?action=delay`)
          });
          
          actions.push({
            id: 'complete_job',
            label: 'Complete Job',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success',
            description: 'Mark job as completed',
            action: () => router.push(`/job-cards/${jobCardId}?action=complete`)
          });
        }
      }
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

  // Fallback transformation for when workflow data is not available
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
    if (!order) return 'not_started';
    
    // Map work order stage to workflow stage
    const workOrderStage = order.currentStage || 'pre_checklist';
    const mappedWorkOrderStage = workOrderStage === 'pre_checklist' ? 'prechecklist' :
                                workOrderStage === 'job_card' ? 'jobcard' :
                                workOrderStage === 'post_checklist' ? 'postchecklist' :
                                workOrderStage;
    
    const stageOrder = ['prechecklist', 'jobcard', 'postchecklist', 'invoice'];
    const currentIndex = stageOrder.indexOf(mappedWorkOrderStage);
    const stageIndex = stageOrder.indexOf(stage);
    
    if (currentIndex === -1 || stageIndex === -1) return 'not_started';
    
    // If this stage is before the current stage, it should be completed
    if (stageIndex < currentIndex) {
      const documentId = getStageDocumentId(order, stage);
      const isApproved = checkStageApproval(order, stage);
      
      if (documentId && isApproved) {
        return 'completed';
      }
      return 'approved';
    }
    
    // If this is the current stage
    if (stageIndex === currentIndex) {
      const documentId = getStageDocumentId(order, stage);
      
      if (documentId) {
        const isApproved = checkStageApproval(order, stage);
        
        if (isApproved) {
          return 'approved';
        }
        
        // For pre-checklist, check if it's approved in the document
        if (stage === 'prechecklist' && preChecklist) {
          return preChecklist.approved ? 'approved' : 'needs_approval';
        }
        
        return 'needs_approval';
      }
      
      // No document but this is current stage
      return 'in_progress';
    }
    
    // Future stage
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
    
    // Also check if we have document-specific approval
    if (stage === 'pre_checklist' && preChecklist) {
      return preChecklist.approved || stageApproval?.approved || false;
    }
    
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
              // Check if we have job cards
              const jobCards = await jobCardService.getJobCardsByOpportunity(
                typeof order.opportunityId === 'object' 
                  ? order.opportunityId._id 
                  : order.opportunityId
              );
              
              if (jobCards.length > 0) {
                router.push(`/job-cards/${jobCards[0]._id}`);
              } else {
                router.push(`/job-cards/create?workOrderId=${order._id}`);
              }
            }
          }
        ],
        needs_approval: [
          {
            id: 'approve-job-card',
            label: 'Approve Job Card',
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'success' as const,
            action: async () => {
              handleApproveStage(stageKey, documentId);
            }
          },
          {
            id: 'view-job-card',
            label: 'View Job Card',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              router.push(`/${stageKey}/${documentId}`);
            }
          }
        ],
        approved: [
          {
            id: 'view-approved-job-card',
            label: 'View Approved Job Card',
            icon: <Eye className="h-4 w-4" />,
            variant: 'secondary' as const,
            action: async () => {
              if (documentId) {
                router.push(`/job-cards/${documentId}`);
              }
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
      if (!workOrder) return;
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      let documentData: any = {};
      
      switch (stage) {
        case 'prechecklist':
        case 'pre_checklist':
          // Create pre-checklist

          try {
            await lifecycleIntegrationService.initializeWorkOrderLifecycle(opportunityId);
          } catch (error) {
            console.log('Workflow may already be initialized:', error);
          }
            
          router.push(`/pre-checklist/create?workOrderId=${workOrder._id}&opportunityId=${opportunityId}&vehicleId=${workOrder.vehicleId}`);
          return;
          
        case 'jobcard':
        case 'job_card':
          // Navigate to job card creation
          router.push(`/job-cards/create?workOrderId=${workOrder._id}`);
          return;
          
        case 'postchecklist':
        case 'post_checklist':
          // Create post-checklist
          documentData = {
            opportunityId,
            vehicleId: workOrder.vehicleId || '',
            jobCardId: jobCards[0]?._id || '',
            inspectionItems: [
              { item: 'Work Quality', status: 'incomplete', required: true, category: 'quality' },
              { item: 'Safety Check', status: 'incomplete', required: true, category: 'safety' },
              { item: 'Cleanliness', status: 'incomplete', required: true, category: 'cleanliness' },
            ],
            notes: `Post-service quality check for ${workOrder.notes || 'work order'}`,
            overallCondition: 'pending'
          };
          
          await lifecycleIntegrationService.createDocumentAndUpdateWorkflow(
            'postchecklist',
            opportunityId,
            documentData,
            'current-user-id' // Replace with actual user
          );
          
          showToast('Post-checklist created', 'success');
          break;
          
        case 'invoice':
          setShowGenerateInvoiceModal(true);
          return;
      }
      
      // Refresh all data
      // setTimeout(refreshAllData, 1500);
      
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

  const mapStageToWorkOrderStage = (stage: string): 'pre_checklist' | 'job_card' | 'post_checklist' | 'invoice' => {
    switch (stage) {
      case 'prechecklist':
      case 'pre_checklist':
        return 'pre_checklist';
      case 'jobcard':
      case 'job_card':
        return 'job_card';
      case 'postchecklist':
      case 'post_checklist':
        return 'post_checklist';
      case 'invoice':
        return 'invoice';
      default:
        return 'pre_checklist';
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
        
        // Use the mapping function
        const mappedStage = mapStageToWorkOrderStage(nextStage);
        
        await workOrderService.updateWorkOrder(workOrder._id, {
          currentStage: mappedStage,  // Now this is the correct type
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

  // In your job card service or component
const handleCompleteJobCard = async (jobCardId: string) => {
  try {
    // Mark job card as completed
    const completedJobCard = await jobCardService.updateJobCard(jobCardId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
    
    // Get opportunity ID from job card
    const opportunityId = typeof completedJobCard.opportunityId === 'object' 
      ? completedJobCard.opportunityId._id 
      : completedJobCard.opportunityId;
    
    if (opportunityId) {
      // Auto-transition to post-checklist stage
      await lifecycleIntegrationService.transitionToStage(
        opportunityId,
        'postchecklist',
        {
          skipValidation: true,
          metadata: {
            autoTransition: true,
            jobCardId,
            triggeredBy: 'job-card-completion'
          }
        }
      );
      
      // Update work order stage
      const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
      if (workOrders.length > 0) {
        const workOrder = workOrders[0];
        await workOrderService.updateWorkOrder(workOrder._id, {
          currentStage: 'post_checklist',
          updatedAt: new Date().toISOString()
        });
      }
      
      showToast('Job Card completed! Moved to Post-Checklist stage.', 'success');
    }
  } catch (error) {
    console.error('Error completing job card:', error);
    showToast('Failed to complete job card', 'error');
  }
};

  const handleAutoTransitionNow = async (stage: string) => {
    if (!workOrder) return;
    
    try {
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      const result = await lifecycleIntegrationService.oneClickCompleteStage(
        opportunityId,
        stage,
        'current-user-id' // Replace with actual user ID
      );
      
      if (result.success) {
        showToast(`Auto-transitioned from ${stage} to ${result.nextStage || 'complete'}`, 'success');
        setShowAutoTransition(false);
        setAutoTransitionCountdown(5);
        fetchWorkOrder();
      }
    } catch (error) {
      console.error('Auto-transition error:', error);
      showToast('Auto-transition failed', 'error');
      setShowAutoTransition(false);
    }
  };

  // Add this function for auto-transition on approval
  const handleAutoTransitionOnApproval = (stage: WorkflowStage) => {
    if (stage.document && stage.isCurrent) {
      // Check if we should show auto-transition
      const shouldAutoTransition = 
        (stage.stage === 'prechecklist' && stage.document.approved) ||
        (stage.stage === 'jobcard' && stage.document.status === 'completed') ||
        (stage.stage === 'postchecklist' && stage.document.approved) ||
        (stage.stage === 'invoice' && stage.document.status === 'paid');
      
      if (shouldAutoTransition) {
        setAutoTransitionStage(stage.stage);
        setShowAutoTransition(true);
      }
    }
  };

  // Add this function to update documents with auto-transition
  const updateDocumentWithAutoTransition = async (
    documentType: 'prechecklist' | 'jobcard' | 'postchecklist' | 'invoice',
    documentId: string,
    updates: any
  ) => {
    try {
      const result = await lifecycleIntegrationService.handleDocumentUpdateWithAutoTransition(
        documentType,
        documentId,
        updates
      );
      
      if (result.autoTransitioned) {
        showToast(`Document updated and auto-transitioned to ${result.nextStage}`, 'success');
        fetchWorkOrder();
      } else {
        showToast('Document updated', 'success');
      }
      
      return result;
    } catch (error) {
      console.error('Update with auto-transition failed:', error);
      showToast('Update failed', 'error');
      throw error;
    }
  };

  // Add this component for auto-transition overlay
  const AutoTransitionOverlay = () => {
    if (!showAutoTransition || !autoTransitionStage) return null;
    
    const stageLabel = workflowStages.find(s => s.stage === autoTransitionStage)?.label || autoTransitionStage;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Auto-Transition Active</h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">
                Completing <span className="font-semibold">{stageLabel}</span> and moving to next stage...
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                
                <div className="text-center mb-2">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {autoTransitionCountdown}
                  </div>
                  <div className="text-sm text-gray-600">seconds remaining</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  handleAutoTransitionNow(autoTransitionStage);
                  setAutoTransitionCountdown(5);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
              >
                <Bolt className="h-4 w-4" />
                Transition Now
              </button>
              
              <button
                onClick={() => {
                  setShowAutoTransition(false);
                  setAutoTransitionCountdown(5);
                }}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add this component for one-click completion buttons
  const OneClickCompletionSection = () => {
    const currentStage = workflowStages.find(stage => stage.isCurrent);
    
    if (!currentStage) return null;
    // Don't show one-click completion when the current stage still requires manual document creation/setup
    const stageId = currentStage.stage;
    if ((stageId === 'jobcard' || stageId === 'job_card') && jobCardStatus.needsJobCard) {
      return null;
    }
    if ((stageId === 'postchecklist' || stageId === 'post_checklist') && postChecklistStatus.needsPostChecklist) {
      return null;
    }

    
    const getOneClickAction = () => {
      switch (currentStage.stage) {
        case 'prechecklist':
        case 'pre_checklist':
          return {
            label: 'Approve Pre-Checklist & Move to Job Card Stage',
            description: 'Approve checklist (if eligible) and move workflow to Job Card stage',
            action: () => handleOneClickComplete('prechecklist'),
            icon: <ClipboardCheck className="h-5 w-5" />,
            color: 'from-green-500 to-emerald-600'
          };
        case 'jobcard':
        case 'job_card':
          return {
            label: 'Complete Job Card & Move to Post-Checklist Stage',
            description: 'Mark job card as completed and move workflow to Post-Checklist stage',
            action: () => handleOneClickComplete('jobcard'),
            icon: <Wrench className="h-5 w-5" />,
            color: 'from-blue-500 to-cyan-600'
          };
        case 'postchecklist':
        case 'post_checklist':
          return {
            label: 'Approve Post-Checklist & Move to Invoice Stage',
            description: 'Approve quality check and move to Invoice stage (invoice auto-creates)',
            action: () => handleOneClickComplete('postchecklist'),
            icon: <ClipboardList className="h-5 w-5" />,
            color: 'from-purple-500 to-violet-600'
          };
        case 'invoice':
          return {
            label: 'Mark Invoice Paid & Complete Work Order',
            description: 'Mark invoice as paid and complete the work order',
            action: () => handleOneClickComplete('invoice'),
            icon: <ReceiptIcon className="h-5 w-5" />,
            color: 'from-amber-500 to-orange-600'
          };
        default:
          return null;
      }
    };
    
    const action = getOneClickAction();
    if (!action) return null;
    
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            
            <div className="flex items-center gap-4">
              <button
                onClick={action.action}
                className={`px-6 py-3 bg-gradient-to-r ${action.color} text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-3`}
              >
                {action.icon}
                <span className="font-semibold">{action.label}</span>
              </button>
              
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span>Auto-creates next document and transitions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the StageCard component to include auto-transition features
  const EnhancedStageCard = ({ stage }: { stage: WorkflowStage }) => {
    const statusDisplay = getStageStatusDisplay(stage.status);
    const isCompleted = stage.status === 'completed' || stage.status === 'approved';
    const isCurrent = stage.isCurrent;
    const hasDocument = !!stage.documentId;
    
    // Get progress based on status
    const getActualProgress = () => {
      if (isCompleted) return 100;
      if (stage.status === 'needs_approval') return 75;
      if (stage.status === 'in_progress') return 50;
      if (hasDocument) return 25;
      return 0;
    };
    
    const actualProgress = getActualProgress();
    
    // Get next action text
    const getNextActionText = () => {
      if (isCompleted) return `✓ ${stage.label} Complete`;
      if (hasDocument) {
        if (stage.stage === 'prechecklist' && stage.document?.approved) return 'Ready for Job Card';
        if (stage.stage === 'jobcard' && stage.document?.status === 'completed') return 'Ready for Post-Checklist';
        if (stage.stage === 'postchecklist' && stage.document?.approved) return 'Ready for Invoice';
        if (stage.stage === 'invoice' && stage.document?.status === 'paid') return 'Work Order Complete';
        return 'Complete document';
      }
      return `Create ${stage.label}`;
    };

    if (stage.stage === 'jobcard') {
    const needsJobCard = jobCardStatus.needsJobCard;
    const isAssigned = jobCards.length > 0 && jobCards.some(jc => jc.assignedTo);
    
    return (
      <div
        className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
          stage.isCurrent
            ? needsJobCard 
              ? 'border-yellow-500 bg-yellow-50 transform scale-[1.02] shadow-lg' 
              : 'border-blue-500 bg-blue-50 transform scale-[1.02] shadow-lg'
            : stage.completed
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${
            needsJobCard ? 'bg-yellow-100' : 'bg-blue-100'
          }`}>
            <Wrench className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            {stage.isCurrent && needsJobCard && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs font-medium text-yellow-600">ACTION REQUIRED</span>
              </div>
            )}
            {stage.isCurrent && !needsJobCard && isAssigned && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-blue-600">IN PROGRESS</span>
              </div>
            )}
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              needsJobCard 
                ? 'bg-yellow-100 text-yellow-800'
                : stage.isCurrent && isAssigned
                ? 'bg-blue-100 text-blue-800'
                : stage.completed
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {needsJobCard ? 'Needs Setup' : 
               stage.isCurrent && isAssigned ? 'In Progress' :
               stage.completed ? 'Completed' : 
               stage.statusLabel}
            </span>
          </div>
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-3">{stage.label}</h4>
        <p className="text-sm text-gray-600 mb-4">
          {needsJobCard 
            ? 'Create job card with technician assignments'
            : stage.description}
        </p>
        
        {/* Job Card Status */}
        <div className="space-y-3">
          <div className="p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Job Card Status</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                needsJobCard 
                  ? 'bg-yellow-100 text-yellow-800'
                  : isAssigned
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {needsJobCard ? 'Not Ready' : 
                 isAssigned ? 'Assigned' : 
                 'No Job Card'}
              </span>
            </div>
            
            {needsJobCard && (
              <div className="text-xs text-yellow-600 mt-1">
                {jobCardStatus.reason}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {needsJobCard ? (
                <button
                  onClick={() => router.push(`/job-cards/create?workOrderId=${workOrder?._id}&opportunityId=${workOrder?.opportunityId}`)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Job Card
                </button>
              ) : jobCards.length > 0 ? (
                <>
                  <button
                    onClick={() => router.push(`/job-cards/${jobCards[0]._id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Job Card
                  </button>
                  {stage.canTransition && (
                    <button
                      onClick={() => handleTransitionToNextStage(stage)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Next Stage
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => router.push(`/job-cards/create?workOrderId=${workOrder?._id}&opportunityId=${workOrder?.opportunityId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Job Card
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage.stage === 'postchecklist') {
    const needsPostChecklist = postChecklistStatus.needsPostChecklist;
    const hasCompletePostChecklist = postChecklist && postChecklist.approved;
    
    return (
      <div
        className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
          stage.isCurrent
            ? needsPostChecklist 
              ? 'border-yellow-500 bg-yellow-50 transform scale-[1.02] shadow-lg' 
              : 'border-purple-500 bg-purple-50 transform scale-[1.02] shadow-lg'
            : stage.completed
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${
            needsPostChecklist ? 'bg-yellow-100' : 'bg-purple-100'
          }`}>
            <ClipboardList className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex items-center gap-2">
            {stage.isCurrent && needsPostChecklist && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs font-medium text-yellow-600">ACTION REQUIRED</span>
              </div>
            )}
            {stage.isCurrent && !needsPostChecklist && postChecklist && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-medium text-purple-600">IN PROGRESS</span>
              </div>
            )}
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              needsPostChecklist 
                ? 'bg-yellow-100 text-yellow-800'
                : stage.isCurrent && postChecklist
                ? 'bg-purple-100 text-purple-800'
                : stage.completed
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {needsPostChecklist ? 'Needs Setup' : 
               stage.isCurrent && postChecklist ? 'In Progress' :
               stage.completed ? 'Completed' : 
               stage.statusLabel}
            </span>
          </div>
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-3">{stage.label}</h4>
        <p className="text-sm text-gray-600 mb-4">
          {needsPostChecklist 
            ? 'Create post-checklist for quality verification'
            : stage.description}
        </p>
        
        {/* Post-Checklist Status */}
        <div className="space-y-3">
          <div className="p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Post-Checklist Status</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                needsPostChecklist 
                  ? 'bg-yellow-100 text-yellow-800'
                  : postChecklist?.approved
                  ? 'bg-green-100 text-green-800'
                  : postChecklist
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {needsPostChecklist ? 'Not Ready' : 
                 postChecklist?.approved ? 'Approved' :
                 postChecklist ? 'Pending Approval' : 
                 'No Post-Checklist'}
              </span>
            </div>
            
            {needsPostChecklist && (
              <div className="text-xs text-yellow-600 mt-1">
                {postChecklistStatus.reason}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {needsPostChecklist ? (
                <button
                  onClick={() => router.push(`/post-checklist/create?workOrderId=${workOrder?._id}&jobCardId=${jobCards[0]?._id}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Post-Checklist
                </button>
              ) : postChecklist ? (
                <>
                  <button
                    onClick={() => router.push(`/post-checklist/${postChecklist._id}`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Post-Checklist
                  </button>
                  {stage.canTransition && (
                    <button
                      onClick={() => handleTransitionToNextStage(stage)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Next Stage
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => router.push(`/post-checklist/create?workOrderId=${workOrder?._id}&jobCardId=${jobCards[0]?._id}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Post-Checklist
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
    
    return (
      <div
        className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
          isCurrent
            ? 'border-blue-500 bg-blue-50 transform scale-[1.02] shadow-lg'
            : isCompleted
            ? 'border-green-500 bg-green-50'
            : hasDocument
            ? 'border-yellow-500 bg-yellow-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${statusDisplay.bgColor}`}>
            {stage.icon}
          </div>
          <div className="flex items-center gap-2">
            {isCurrent && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-blue-600">CURRENT</span>
              </div>
            )}
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
              {statusDisplay.label}
            </span>
          </div>
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-3">{stage.label}</h4>
        <p className="text-sm text-gray-600 mb-4">{stage.description}</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="font-bold text-blue-600">{actualProgress}%</span>
          </div>
          
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isCompleted ? 'bg-green-500' : 
                isCurrent ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                hasDocument ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}
              style={{ width: `${actualProgress}%` }}
            />
          </div>
          
          {/* Next Action */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-900">
              Next: {getNextActionText()}
            </div>
          </div>
          
          {/* Document status */}
          {hasDocument ? (
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Document #{stage.documentId?.slice(-8)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {stage.documentType}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  {stage.label} document not found
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Create {stage.label.toLowerCase()} document to proceed
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-200">
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

  // Update your handleMarkAsDelayed function:
  const handleMarkAsDelayed = async () => {
    if (!delayReason.trim()) {
      showToast('Please provide a delay reason', 'warning');
      return;
    }

    try {
      // Create delay data with time information
      const delayData = {
        reason: delayReason,
        expectedCompletionDate: delayExpectedDate || undefined,
        // Add time tracking data
        daysDelayed: delayDays,
        hoursDelayed: delayHours,
        notes: `Delay recorded: ${delayDays} days, ${delayHours} hours. ${delayExpectedTime ? `Expected completion time: ${delayExpectedTime}` : ''}`
      };
      
      await workOrderService.markAsDelayed(orderId, delayData);
      
      setShowDelayModal(false);
      setDelayReason('');
      setDelayExpectedDate('');
      setDelayExpectedTime('');
      setDelayDays(0);
      setDelayHours(0);
      showToast('Work order marked as delayed', 'success');
      fetchWorkOrder();
    } catch (error) {
      console.error('Error marking as delayed:', error);
      showToast('Failed to mark as delayed', 'error');
    }
  };

  const handleResolveDelay = async () => {
    try {
      await workOrderService.resolveDelay(orderId);
      
      // Update local state immediately
      if (workOrder) {
        const updatedWorkOrder = {
          ...workOrder,
          delayInfo: {
            ...workOrder.delayInfo,
            resolvedAt: new Date().toISOString()
          }
        };
        setWorkOrder(updatedWorkOrder);
      }
      
      setShowResolveDelayModal(false);
      showToast('Delay resolved successfully', 'success');
      
      // Also refresh from server
      fetchWorkOrder();
    } catch (error) {
      console.error('Error resolving delay:', error);
      showToast('Failed to resolve delay', 'error');
    }
  };

  const handleLoadDelayHistory = async () => {
    try {
      // This would typically come from your API
      // For now, we'll simulate with workOrder.delayInfo
      if (workOrder?.delayInfo) {
        setDelayHistory([workOrder.delayInfo]);
      }
      setShowDelayHistoryModal(true);
    } catch (error) {
      console.error('Error loading delay history:', error);
      showToast('Failed to load delay history', 'error');
    }
  };

  // Add this helper function to get delay status
  const getDelayStatus = () => {
    if (!workOrder?.delayInfo) return null;
    
    const delayInfo = workOrder.delayInfo;
    const severity = workOrderService.getDelaySeverity(workOrder.delayDays || 0);
    const color = workOrderService.getDelayColor(workOrder.delayDays || 0);
    const isResolved = delayInfo.resolvedAt;
    
    return {
      isDelayed: !isResolved,
      severity,
      color,
      delayDays: workOrder.delayDays || 0,
      reason: delayInfo.reason,
      detectedAt: delayInfo.detectedAt,
      expectedCompletionDate: delayInfo.expectedCompletionDate,
      resolvedAt: delayInfo.resolvedAt,
      notes: delayInfo.notes
    };
  };

  // Add this helper function near your other utility functions
  const calculateDelayCost = (): number => {
    if (!workOrder || !workOrder.delayDays) return 0;
    
    // Simple calculation: daily cost impact
    // You can adjust this formula based on your business logic
    const dailyLaborCost = (workOrder.laborCost || 0) / (workOrder.totalHours || 1);
    const dailyOverhead = 500; // Example daily overhead cost
    
    return Math.round((dailyLaborCost + dailyOverhead) * (workOrder.delayDays || 0));
  };

  const getFormattedDelayDuration = (delayInfo?: DelayInfo | { days?: number; hours?: number; minutes?: number }): string => {
    if (!delayInfo) return '0h';
    
    let days = 0;
    let hours = 0;
    
    // Handle both delayInfo and delayDuration structures
    if ('daysDelayed' in delayInfo) {
      // It's a DelayInfo object
      days = delayInfo.daysDelayed || 0;
      hours = delayInfo.hoursDelayed || 0;
    } else if ('days' in delayInfo) {
      // It's a delayDuration object
      days = delayInfo.days || 0;
      hours = delayInfo.hours || 0;
    }
    
    const totalHours = days * 24 + hours;
    const formattedDays = Math.floor(totalHours / 24);
    const formattedHours = totalHours % 24;
    
    if (formattedDays > 0 && formattedHours > 0) {
      return `${formattedDays}d ${formattedHours}h`;
    } else if (formattedDays > 0) {
      return `${formattedDays}d`;
    } else {
      return `${formattedHours}h`;
    }
  };

  // Schedule impact helper
  const getScheduleImpact = (daysDelayed?: number): string => {
    if (!daysDelayed || daysDelayed === 0) return 'None';
    if (daysDelayed <= 1) return 'Minor';
    if (daysDelayed <= 3) return 'Moderate';
    if (daysDelayed <= 7) return 'Major';
    return 'Critical';
  };

  // Average delay calculation
  const calculateAverageDelayHours = (): number => {
    if (delayHistory.length === 0) return 0;
    
    const totalHours = delayHistory.reduce((sum, delay) => {
      const days = delay.daysDelayed || 0;
      const hours = delay.hoursDelayed || 0;
      return sum + (days * 24 + hours);
    }, 0);
    
    return Math.round(totalHours / delayHistory.length);
  };

  // Longest delay helper
  const getLongestDelay = (): string => {
    if (delayHistory.length === 0) return '0h';
    
    let maxHours = 0;
    delayHistory.forEach(delay => {
      const totalHours = (delay.daysDelayed || 0) * 24 + (delay.hoursDelayed || 0);
      maxHours = Math.max(maxHours, totalHours);
    });
    
    const days = Math.floor(maxHours / 24);
    const hours = maxHours % 24;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  // Delay duration calculation
  const getDelayDuration = (delay: any): string => {
    const days = delay.daysDelayed || 0;
    const hours = delay.hoursDelayed || 0;
    
    if (days > 0 && hours > 0) {
      return `${days}d ${hours}h`;
    } else if (days > 0) {
      return `${days}d`;
    } else {
      return `${hours}h`;
    }
  };

  // Current delay duration calculation
  const calculateCurrentDelayDuration = (): string => {
    if (!workOrder?.delayInfo) return '0h';
    
    const delayStart = new Date(workOrder.delayInfo.detectedAt);
    const now = new Date();
    const diffMs = now.getTime() - delayStart.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  // Time remaining helper
  const getTimeRemaining = (targetDate: string): string => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffMs = target.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Overdue';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  // Action handlers for delay operations
  const viewDelayDetails = async (delay: any) => {
    setShowDelayHistoryModal(true);
    // You could set a specific delay to view details here
  };

  const resolveDelay = async (delay: any) => {
    setStageToApprove({ stage: 'delay', documentId: delay._id });
    setShowResolveDelayModal(true);
  };

  const editDelay = async (delay: any) => {
    // Set up edit modal state
    setDelayReason(delay.reason || '');
    setDelayExpectedDate(delay.expectedCompletionDate || '');
    setDelayDays(delay.daysDelayed || 0);
    setDelayHours(delay.hoursDelayed || 0);
    setShowDelayModal(true);
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

  // Calculate time remaining
  const calculateTimeRemaining = (targetDate: string): string => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffMs = target.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Overdue';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else {
      return `${diffHours}h remaining`;
    }
  };

  // Get impact level based on duration
  const getImpactLevel = (days: number, hours: number = 0): string => {
    const totalHours = days * 24 + hours;
    
    if (totalHours > 72) return 'Critical';
    if (totalHours > 48) return 'High';
    if (totalHours > 24) return 'Medium';
    if (totalHours > 8) return 'Low';
    return 'Minor';
  };

  const getImpactLevelClass = (days: number, hours: number = 0): string => {
    const totalHours = days * 24 + hours;
    
    if (totalHours > 72) return 'bg-red-100 text-red-800';
    if (totalHours > 48) return 'bg-orange-100 text-orange-800';
    if (totalHours > 24) return 'bg-yellow-100 text-yellow-800';
    if (totalHours > 8) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Calculate downtime cost
  const calculateDowntimeCost = (delay: any): number => {
    const totalHours = (delay.daysDelayed || 0) * 24 + (delay.hoursDelayed || 0);
    const hourlyRate = 150; // Example hourly rate
    return totalHours * hourlyRate;
  };

  // Get elapsed time since delay started
  const getElapsedTime = (startTime: string): string => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Get time ago format
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  // Format duration to hours
  const formatDurationToHours = (duration: any): string => {
    if (!duration) return '0';
    const totalHours = (duration.days || 0) * 24 + (duration.hours || 0);
    return totalHours.toString();
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
    const completedStages = stages.filter(s => 
      s.status === 'completed' || s.status === 'approved'
    ).length;
    
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
                    w-10 h-10 rounded-full flex items-center justify-center z-10 mb-3 border-2
                    ${isCompleted ? 'bg-green-500 border-green-500' : 
                      isCurrent ? 'bg-blue-500 border-blue-500 animate-pulse' : 
                      isFuture ? 'bg-gray-300 border-gray-300' : 'bg-gray-200 border-gray-200'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : isCurrent ? (
                      isTransitioning ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <PlayCircle className="h-6 w-6 text-white" />
                      )
                    ) : (
                      <span className="text-sm font-medium text-white">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="text-center max-w-[120px]">
                    <div className={`font-medium text-sm mb-1 ${
                      isCurrent ? 'text-blue-600 font-bold' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-900'
                    }`}>
                      {stage.label}
                      {isCurrent && <span className="ml-1 text-xs">(Current)</span>}
                    </div>
                    <div className={`text-xs ${
                      isCurrent ? 'text-blue-500' : 
                      isCompleted ? 'text-green-500' : 
                      'text-gray-500'
                    }`}>
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
    const isCompleted = stage.status === 'completed' || stage.status === 'approved';
    const isCurrent = stage.isCurrent;

    const getActualProgress = () => {
      if (isCompleted) return 100;
      if (stage.status === 'needs_approval') return 75;
      if (stage.status === 'in_progress') return 50;
      if (stage.documentId) return 25;
      return 0;
    };
    
    const actualProgress = getActualProgress();
    return (
      <div
        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
          isCurrent
            ? 'border-blue-500 bg-blue-50 transform scale-105 shadow-lg'
            : isCompleted
            ? 'border-green-500 bg-green-50'
            : stage.documentId
            ? 'border-yellow-500 bg-yellow-50'
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
              {statusDisplay.label}
            </span>
          </div>
        </div>
        
        <h4 className="font-semibold text-gray-900 mb-2">{stage.label}</h4>
        <p className="text-xs text-gray-600 mb-3">{stage.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{actualProgress}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                isCompleted ? 'bg-green-500' : 
                isCurrent ? 'bg-blue-500' : 
                stage.documentId ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}
              style={{ width: `${actualProgress}%` }}
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
  const handleOneClickComplete = async (stage: string) => {
    if (!workOrder) return;
    
    try {
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      const result = await lifecycleIntegrationService.oneClickCompleteStage(
        opportunityId,
        stage === 'pre_checklist' ? 'prechecklist' :
        stage === 'job_card' ? 'jobcard' :
        stage === 'post_checklist' ? 'postchecklist' : stage,
        'current-user-id' // Replace with actual user ID
      );
      
      if (result.success) {
        showToast(result.message, 'success');
        fetchWorkOrder();
        
        // If auto-transition happened, show notification
        if (result.nextStage) {
          setTimeout(() => {
            showToast(`Auto-transitioned to ${result.nextStage}`, 'info');
          }, 500);
        }
      } else {
        showToast(result.message || 'Action could not be completed', 'warning');
      }
    } catch (error) {
      console.error('One-click completion error:', error);
      showToast('One-click completion failed', 'error');
    }
  };

  const approvePreChecklist = async (checklistId: string) => {
    try {
      const result = await updateDocumentWithAutoTransition(
        'prechecklist',
        checklistId,
        {
          approved: true,
          approvedAt: new Date().toISOString(),
          approvedBy: 'current-user-id' // Replace with actual user
        }
      );
      
      if (result.autoTransitioned) {
        // Refresh job cards since they might have been auto-created
        fetchJobCards();
      }
    } catch (error) {
      console.error('Error approving pre-checklist:', error);
    }
  };

  const completeJobCard = async (jobCardId: string) => {
    try {
      await updateDocumentWithAutoTransition(
        'jobcard',
        jobCardId,
        {
          status: 'completed',
          completedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error completing job card:', error);
    }
  };

  const approvePostChecklist = async (checklistId: string) => {
    try {
      await updateDocumentWithAutoTransition(
        'postchecklist',
        checklistId,
        {
          approved: true,
          approvedAt: new Date().toISOString(),
          approvedBy: 'current-user-id' // Replace with actual user
        }
      );
    } catch (error) {
      console.error('Error approving post-checklist:', error);
    }
  };

  const markInvoicePaid = async (invoiceId: string) => {
    try {
      await updateDocumentWithAutoTransition(
        'invoice',
        invoiceId,
        {
          status: 'paid',
          paidAt: new Date().toISOString(),
          paidBy: 'current-user-id' // Replace with actual user
        }
      );
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const WorkflowProgressWithAutoTransition = ({ stages }: { stages: WorkflowStage[] }) => {
    const completedStages = stages.filter(s => 
      s.status === 'completed' || s.status === 'approved'
    ).length;
    
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
              const isCompleted = stage.completed || stage.status === 'approved';
              const isCurrent = stage.isCurrent;
              const isFuture = index > stages.findIndex(s => s.isCurrent);
              
              return (
                <div key={stage.id} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center z-10 mb-3 border-2
                    ${isCompleted ? 'bg-green-500 border-green-500' : 
                      isCurrent ? 'bg-blue-500 border-blue-500 animate-pulse' : 
                      isFuture ? 'bg-gray-300 border-gray-300' : 'bg-gray-200 border-gray-200'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : isCurrent ? (
                      isTransitioning ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <PlayCircle className="h-6 w-6 text-white" />
                      )
                    ) : (
                      <span className="text-sm font-medium text-white">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="text-center max-w-[120px]">
                    <div className={`font-medium text-sm mb-1 ${
                      isCurrent ? 'text-blue-600 font-bold' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-900'
                    }`}>
                      {stage.label}
                      {isCurrent && <span className="ml-1 text-xs">(Current)</span>}
                    </div>
                    <div className={`text-xs ${
                      isCurrent ? 'text-blue-500' : 
                      isCompleted ? 'text-green-500' : 
                      'text-gray-500'
                    }`}>
                      {isCompleted ? '✓ Complete' : 
                      isCurrent ? 'In Progress' : 
                      'Pending'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

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
                      {/* {workOrderService.getStatusIcon(workOrder.status)} */}
                      {workOrderService.getStatusLabel(workOrder.status)}
                    </span>
                     {workOrder.status === 'delayed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Clock className="h-3 w-3" />
                          Delayed ({workOrder.delayDays || 0} days)
                        </span>
                      )}
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
              { id: 'delays', label: 'Delays', icon: <Clock className="h-4 w-4" /> },
              { id: 'job-cards', label: 'Job Cards', icon: <Wrench className="h-4 w-4" /> },
              { id: 'post-checklist', label: 'Post Checklist', icon: <ClipboardList className="h-4 w-4" /> },
              { id: 'invoice', label: 'Invoice', icon: <ReceiptIcon className="h-4 w-4" /> },
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
                {tab.id === 'delays' && workOrder.status === 'delayed' && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                    {workOrder.delayDays || 1}
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
        
            {/* Add auto-refresh toggle */}
            {/* <div className="flex items-center justify-end mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => {
                    setAutoRefresh(e.target.checked);
                    if (e.target.checked && !refreshInterval) {
                      clearInterval(refreshInterval);
                      setRefreshInterval(null);
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-refresh workflow status
              </label>
            </div> */}
          {activeTab === 'overview' && (
            
            <div className="space-y-6">
              <CurrentStageDisplay />
              {/* <OneClickCompletionSection /> */}

              {/* Add Workflow Status Component Here */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Status</h3>
                
                <div className="space-y-4">
                  {/* Pre-Checklist Stage */}
                  <div className={`p-4 rounded-lg border ${workOrder.preChecklistId ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ClipboardCheck className={`h-5 w-5 ${workOrder.preChecklistId ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <h4 className="font-medium text-gray-900">Pre-Checklist</h4>
                          <p className="text-sm text-gray-600">Pre-service inspection</p>
                        </div>
                      </div>
                      <div>
                        {workOrder.preChecklistId ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Completed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreateStageDocument('pre_checklist')}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Create
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Job Card Stage */}
                  <div className={`p-4 rounded-lg border ${workOrder.currentStage === 'job_card' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">Job Card</h4>
                            {workOrder.currentStage === 'job_card' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Technician work assignment</p>
                        </div>
                      </div>
                      <div>
                        {jobCards.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/job-cards/${jobCards[0]._id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                            >
                              View Job Card
                            </button>
                            {jobCards[0].status !== 'completed' && (
                              <button
                                onClick={() => handleCompleteJobCard(jobCards[0]._id)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreateStageDocument('job_card')}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Create
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Post-Checklist Stage */}
                  <div className={`p-4 rounded-lg border ${workOrder.postChecklistId ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ClipboardList className={`h-5 w-5 ${workOrder.postChecklistId ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <h4 className="font-medium text-gray-900">Post-Checklist</h4>
                          <p className="text-sm text-gray-600">Quality verification</p>
                        </div>
                      </div>
                      <div>
                        {workOrder.postChecklistId ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Completed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreateStageDocument('post_checklist')}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Create
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Invoice Stage */}
                  <div className={`p-4 rounded-lg border ${workOrder.invoiceId ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ReceiptIcon className={`h-5 w-5 ${workOrder.invoiceId ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <h4 className="font-medium text-gray-900">Invoice</h4>
                          <p className="text-sm text-gray-600">Billing and payment</p>
                        </div>
                      </div>
                      <div>
                        {workOrder.invoiceId ? (
                          <div className="flex items-center gap-2">
                            {workOrder.invoicePaid ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-green-700">Paid</span>
                              </>
                            ) : (
                              <button
                                onClick={() => router.push(`/invoices/${workOrder.invoiceId}`)}
                                className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-yellow-600 hover:to-orange-600 shadow-sm"
                              >
                                <DollarSign className="h-4 w-4 inline mr-1" />
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Will auto-generate after post-checklist</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
    
              {/* Auto-Transition Overlay */}
              <AutoTransitionOverlay />

              {/* Enhanced Workflow Progress */}
              <WorkflowProgressWithAutoTransition stages={workflowStages} />

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
                {workOrder.status === 'delayed' && (
                  <div className="bg-white rounded-xl border border-orange-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">Delay Information</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Delay Reason:</span>
                        <span className="font-semibold text-gray-900 text-right">
                          {workOrder.delayInfo?.reason || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Days Delayed:</span>
                        <span className="font-bold text-orange-600">{workOrder.delayDays || 0} days</span>
                      </div>
                      {workOrder.delayInfo?.expectedCompletionDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">New Completion:</span>
                          <span className="font-semibold text-gray-900">
                            {formatDate(workOrder.delayInfo.expectedCompletionDate)}
                          </span>
                        </div>
                      )}
                      <div className="pt-3 border-t border-orange-200">
                        <button
                          onClick={() => setShowResolveDelayModal(true)}
                          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                        >
                          Resolve Delay
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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

                    {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Hours Remaining:</span>
                          <span className={`font-semibold ${
                            workOrderService.isOverdue(workOrder.estimatedCompletionDate) 
                              ? 'text-red-600' 
                              : 'text-blue-600'
                          }`}>
                            {workOrderService.getHoursRemaining(workOrder.estimatedCompletionDate)} hours
                            {workOrderService.isOverdue(workOrder.estimatedCompletionDate) && ' (Overdue)'}
                          </span>
                        </div>
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
                    ...(workOrder.status === 'delayed' && workOrder.delayInfo ? [{
                        action: 'Work Order Delayed',
                        date: workOrder.delayInfo.detectedAt,
                        user: 'System',
                        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
                        details: `Reason: ${workOrder.delayInfo.reason}`
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {workflowStages.map((stage) => (
                    <EnhancedStageCard key={stage.id} stage={stage} />
                  ))}
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
                      {preChecklist?.approved && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Approved
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {preChecklist ? 'Pre-service inspection completed' : 'No pre-checklist created yet'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {workOrder?.preChecklistId ? (
                      <button
                        onClick={() => router.push(`/pre-checklist/${workOrder.preChecklistId}?workOrderId=${workOrder._id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {preChecklist?.approved ? 'View Approved' : 'View Checklist'}
                      </button>
                    ) : (
                      <button
                        onClick={handleCreatePreChecklistDirect}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        disabled={isTransitioning}
                      >
                        {isTransitioning ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Create Pre-Checklist
                      </button>
                    )}
                  </div>
                </div>

                {preChecklist ? (
                  <div className="space-y-6">
                    {/* Checklist Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {preChecklist.inspectionItems?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Total Items</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            {preChecklist.inspectionItems?.filter((item: any) => 
                              item.status === 'ok' || item.status === 'n/a'
                            ).length || 0}
                          </div>
                          <div className="text-sm text-green-600">OK / N/A</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 mb-2">
                            {preChecklist.inspectionItems?.filter((item: any) => 
                              item.status === 'fault'
                            ).length || 0}
                          </div>
                          <div className="text-sm text-red-600">Faults Found</div>
                        </div>
                      </div>
                      
                      {/* Checklist Status */}
                      <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Checklist Status</h4>
                            <p className="text-sm text-gray-600">
                              {preChecklist.approved ? 'Approved and ready for next stage' : 'Pending approval'}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-700">Approval</div>
                            <div className={`text-sm font-medium ${
                              preChecklist.approved ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {preChecklist.approved ? '✓ Approved' : 'Pending'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Auto-transition notice */}
                        {preChecklist.approved && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Zap className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  Ready for auto-transition to Job Card
                                </p>
                                <p className="text-xs text-green-700">
                                  {workflowStages.find(s => s.isCurrent)?.stage === 'jobcard' 
                                    ? '✓ Already transitioned to Job Card stage'
                                    : 'Will automatically create job card and move to next stage'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/pre-checklist/${workOrder.preChecklistId}?workOrderId=${workOrder._id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Full Checklist
                      </button>
                      
                      {!preChecklist.approved && (
                        <button
                          onClick={async () => {
                            try {
                              const result = await lifecycleIntegrationService.autoTransitionOnPreChecklistComplete(
                                workOrder.preChecklistId!,
                                'current-user-id'
                              );
                              
                              if (result.success) {
                                showToast('Pre-checklist approved and workflow advanced', 'success');
                                // Refresh all data
                                await fetchWorkOrder();
                                fetchStageOverview();
                              }
                            } catch (error) {
                              showToast('Failed to approve checklist', 'error');
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve & Continue
                        </button>
                      )}
                      
                      {preChecklist.approved && (
                        <button
                          onClick={async () => {
                            const currentStage = workflowStages.find(s => s.isCurrent);
                            if (currentStage && currentStage.stage === 'prechecklist') {
                              await handleTransitionToNextStage(currentStage);
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Move to Job Card
                        </button>
                      )}
                    </div>
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
                        onClick={() => handleCreatePreChecklistDirect()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        disabled={isTransitioning}
                      >
                        {isTransitioning ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
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
          <p className="text-sm text-gray-600">
            {workOrder?.currentStage === 'job_card' 
              ? 'Create and manage job cards for this work order'
              : 'Job cards will be available in the Job Card stage'}
          </p>
        </div>
        
        {/* Show create button only when job card is needed */}
        {workOrder?.currentStage === 'job_card' && jobCardStatus.needsJobCard && (
          <button
            onClick={() => router.push(`/job-cards/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Job Card
          </button>
        )}
      </div>

      {/* Show job card requirement message */}
      {/* {workOrder?.currentStage === 'job_card' && jobCardStatus.needsJobCard && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">Job Card Required</h4>
              <p className="text-gray-600 mb-4">
                {jobCardStatus.reason}. Create a job card with technician assignments to proceed.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/job-cards/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}`)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Job Card Now
                </button>
                
                <button
                  onClick={() => fetchJobCards()} // Refresh job cards
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Job Cards List - Only show if job cards exist and are assigned */}
      {jobCards.length > 0 ? (
        <div className="space-y-4">
          {jobCards
            .filter(jobCard => jobCard.assignedTo) // Only show assigned job cards
            .map((jobCard) => (
              <div key={jobCard._id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{jobCard.jobTitle || 'Job Card'}</h4>
                        <p className="text-sm text-gray-600">
                          Assigned to: {jobCard.assignedTo?.name || jobCard.assignedTo || 'Unassigned'}
                        </p>
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
                    
                    {/* Complete Button */}
                    {jobCard.status !== 'completed' && (
                      <button
                        onClick={() => handleCompleteJobCard(jobCard._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Completed
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/job-cards/${jobCard._id}`)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/job-cards/edit/${jobCard._id}`)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : workOrder?.currentStage === 'job_card' && !jobCardStatus.needsJobCard ? (
        // No job cards but stage says we don't need them (shouldn't happen)
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Job Cards</h4>
          <p className="text-gray-600 mb-6">
            Job cards will appear here once created and assigned.
          </p>
          <button
            onClick={() => router.push(`/job-cards/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Create Job Card
          </button>
        </div>
      ) : workOrder?.currentStage !== 'job_card' ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Job Card Stage Not Active</h4>
          <p className="text-gray-600 mb-6">
            Complete the pre-checklist stage to unlock job card creation.
          </p>
        </div>
      ) : null}
    </div>
  </div>
)}

          {activeTab === 'delays' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      Delay Management
                    </h3>
                    <p className="text-sm text-gray-600">Track and manage work order delays with time precision</p>
                  </div>
                  {workOrder.status === 'delayed' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          <AlertTriangle className="h-4 w-4" />
                          Delayed
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {getFormattedDelayDuration(workOrder.delayDuration)}
                          </div>
                          <div className="text-xs text-gray-500">Total delay</div>
                        </div>
                      </div>
                      {workOrder.delayInfo && !workOrder.delayInfo.resolvedAt && (
                        <button
                          onClick={() => setShowResolveDelayModal(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Resolve Delay
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      On Schedule
                    </span>
                  )}
                </div>

                {/* Current Delay Status with Time */}
                {workOrder.status === 'delayed' && workOrder.delayInfo && (
                <div className="mb-6">
                  <div className={`bg-gradient-to-r rounded-xl border-2 p-6 ${
                    workOrder.delayInfo.resolvedAt 
                      ? 'from-green-50 to-emerald-50 border-green-200'
                      : 'from-orange-50 to-amber-50 border-orange-200'
                  }`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 bg-white rounded-lg shadow-sm ${
                          workOrder.delayInfo.resolvedAt ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {workOrder.delayInfo.resolvedAt ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <AlertTriangle className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">
                            {workOrder.delayInfo.resolvedAt ? 'Resolved Delay' : 'Active Delay'}
                          </h4>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className={`h-4 w-4 ${
                                workOrder.delayInfo.resolvedAt ? 'text-green-500' : 'text-orange-500'
                              }`} />
                              <span className="text-sm text-gray-600">
                                Detected {formatDateTime(workOrder.delayInfo.detectedAt)}
                              </span>
                            </div>
                            {workOrder.delayInfo.resolvedAt && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-600">
                                  Resolved {formatDateTime(workOrder.delayInfo.resolvedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-orange-600 mb-1">
                          {getFormattedDelayDuration(workOrder.delayInfo)}
                        </div>
                        <div className="text-sm text-gray-600">total delay</div>
                        {workOrder.delayInfo.resolvedAt && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            ✓ Resolved
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conditionally show resolve button only for unresolved delays */}
                    {!workOrder.delayInfo.resolvedAt && (
                      <div className="pt-6 border-t border-orange-200">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => setShowResolveDelayModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Resolve Delay
                          </button>
                          <button
                            onClick={() => setShowDelayModal(true)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Update Delay Information
                          </button>
                          <button
                            onClick={handleLoadDelayHistory}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            <History className="h-4 w-4" />
                            View Delay History
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* Enhanced Delay Statistics with Time Metrics */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Delay Time Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {workOrder.status === 'delayed' 
                          ? formatDurationToHours(workOrder.delayDuration) 
                          : '0'}
                      </div>
                      <div className="text-sm text-gray-600">Total Hours Delayed</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {calculateAverageDelayHours()}
                      </div>
                      <div className="text-sm text-gray-600">Avg Delay per Incident</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {getLongestDelay()}
                      </div>
                      <div className="text-sm text-gray-600">Longest Delay</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {delayHistory.filter(d => !d.resolvedAt).length}
                      </div>
                      <div className="text-sm text-gray-600">Active Delays</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(calculateDelayCost())}
                      </div>
                      <div className="text-sm text-gray-600">Cost Impact</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Delay History Table with Time Columns */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Delay History Timeline</h4>
                    <button
                      onClick={() => setShowDelayModal(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Delay Record
                    </button>
                  </div>
                  
                  {delayHistory.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No delay history recorded for this work order.</p>
                      <button
                        onClick={() => setShowDelayModal(true)}
                        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Record First Delay
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Start Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reason
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Impact Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Resolved At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Downtime
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {delayHistory.map((delay, index) => {
                            const duration = getDelayDuration(delay);
                            const downtime = calculateDowntimeCost(delay);
                            
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatDateTime(delay.detectedAt)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {getTimeAgo(delay.detectedAt)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {duration}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {delay.daysDelayed} days, {delay.hoursDelayed || 0} hours
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="max-w-xs">
                                    <div className="text-sm text-gray-900 truncate">
                                      {delay.reason}
                                    </div>
                                    {delay.category && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Category: {delay.category}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    getImpactLevelClass(delay.daysDelayed, delay.hoursDelayed)
                                  }`}>
                                    {getImpactLevel(delay.daysDelayed, delay.hoursDelayed)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {delay.resolvedAt ? (
                                    <>
                                      <div className="text-sm text-gray-900">
                                        {formatDateTime(delay.resolvedAt)}
                                      </div>
                                      <div className="text-xs text-green-600">
                                        Resolved
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-sm text-orange-600">Active</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatCurrency(downtime)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Cost impact
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => viewDelayDetails(delay)}
                                      className="text-blue-600 hover:text-blue-900"
                                      title="View details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    {!delay.resolvedAt && (
                                      <button
                                        onClick={() => resolveDelay(delay)}
                                        className="text-green-600 hover:text-green-900"
                                        title="Resolve delay"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => editDelay(delay)}
                                      className="text-gray-600 hover:text-gray-900"
                                      title="Edit delay"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Real-time Delay Tracker */}
                {workOrder.status === 'delayed' && workOrder.delayInfo && !workOrder.delayInfo.resolvedAt && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Real-time Delay Tracker</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {calculateCurrentDelayDuration()}
                        </div>
                        <div className="text-xs text-gray-500">Current delay duration</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="text-xs text-gray-600">Started</div>
                        <div className="font-medium">
                          {formatDateTime(workOrder.delayInfo.detectedAt)}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="text-xs text-gray-600">Elapsed Time</div>
                        <div className="font-medium text-orange-600">
                          {getElapsedTime(workOrder.delayInfo.detectedAt)}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="text-xs text-gray-600">Remaining (Est.)</div>
                        <div className="font-medium text-green-600">
                          {workOrder.delayInfo.expectedCompletionDate
                            ? getTimeRemaining(workOrder.delayInfo.expectedCompletionDate)
                            : 'TBD'}
                        </div>
                      </div>
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
      {/* Mark as Delayed Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Report Delay</h3>
              </div>
              <button
                onClick={() => setShowDelayModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay Duration *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Days</label>
                    <input
                      type="number"
                      min="0"
                      value={delayDays}
                      onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={delayHours}
                      onChange={(e) => setDelayHours(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay Reason *
                </label>
                <textarea
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="Describe the reason for the delay (e.g., awaiting parts, technician unavailable, additional work required)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[100px]"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Completion Date & Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={delayExpectedDate}
                    onChange={(e) => setDelayExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="time"
                    value={delayExpectedTime}
                    onChange={(e) => setDelayExpectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>       
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDelayModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkAsDelayed}
                    disabled={!delayReason.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Mark as Delayed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Delay Modal */}
      {showResolveDelayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Resolve Delay</h3>
              </div>
              <button
                onClick={() => setShowResolveDelayModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-700">
                      This will mark the delay as resolved and update the work order status. 
                      The delay will be recorded in the work order history.
                    </p>
                  </div>
                </div>
              </div>
              
              {workOrder?.delayInfo && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Current Delay Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reason:</span>
                      <span className="font-medium">{workOrder.delayInfo.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Delayed:</span>
                      <span className="font-medium text-orange-600">{workOrder.delayDays || 0} days</span>
                    </div>
                    {workOrder.delayInfo.expectedCompletionDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Completion:</span>
                        <span className="font-medium">{formatDate(workOrder.delayInfo.expectedCompletionDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowResolveDelayModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolveDelay}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Resolve Delay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delay History Modal */}
      {showDelayHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delay History</h3>
              </div>
              <button
                onClick={() => setShowDelayHistoryModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {delayHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No delay history found for this work order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {delayHistory.map((delay, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            delay.resolvedAt ? 'bg-green-500' : 'bg-orange-500'
                          }`} />
                          <span className="font-medium text-gray-900">
                            {delay.resolvedAt ? 'Resolved Delay' : 'Active Delay'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(delay.detectedAt)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Reason:</span>
                          <p className="font-medium mt-1">{delay.reason}</p>
                        </div>
                        
                        {delay.expectedCompletionDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Expected Completion:</span>
                            <span className="font-medium">{formatDate(delay.expectedCompletionDate)}</span>
                          </div>
                        )}
                        
                        {delay.notes && (
                          <div>
                            <span className="text-gray-600">Notes:</span>
                            <p className="font-medium mt-1">{delay.notes}</p>
                          </div>
                        )}
                        
                        {delay.resolvedAt ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {formatDateTime(delay.resolvedAt)}
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                Resolved
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-600">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDelayHistoryModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
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