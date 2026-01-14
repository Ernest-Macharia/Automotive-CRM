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
} from 'lucide-react';
import { workOrderService } from '@/services/workOrderService';
import { lifecycleIntegrationService, LifecycleStageUI } from '@/services/lifecycleIntegrationService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface WorkOrderDetailPageProps {
  orderId: string;
}

interface WorkflowStage {
  id: string;
  stage: string;
  label: string;
  description?: string;
  completed: boolean;
  isCurrent: boolean;
  document?: any;
  documentId?: string;
  documentType?: string;
  actions: Array<{ id: string; label: string; icon: React.ReactNode; variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'; description?: string }>;
  requirements?: string[];
  completionDate?: string;
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
  // Header Skeleton
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

  // Tabs Navigation Skeleton
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

  // Current Stage Focus Skeleton
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

  // Workflow Progress Skeleton
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

  // Quick Actions Skeleton
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

  // Service Details Skeleton
  ServiceDetails: () => (
    <div className="animate-pulse space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-40 h-5 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-32 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-40 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-28 h-5 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-40 h-5 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-48 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-36 h-5 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="w-28 h-4 bg-gray-200 rounded"></div>
            <div className="w-56 h-5 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  ),

  // Documents Skeleton
  Documents: () => (
    <div className="animate-pulse space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-48 h-5 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                  <div className="w-40 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),

  // Activity Skeleton
  Activity: () => (
    <div className="animate-pulse space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-40 h-5 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),

  // Notes Skeleton
  Notes: () => (
    <div className="animate-pulse space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-32 h-5 bg-gray-200 rounded mb-4"></div>
        <div className="w-full h-24 bg-gray-200 rounded-lg mb-4"></div>
        <div className="flex justify-end">
          <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
        </div>
        
        <div className="mt-6">
          <div className="w-40 h-5 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-200 rounded-lg space-y-2">
              <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
              <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
            </div>
            <div className="p-4 bg-gray-200 rounded-lg space-y-2">
              <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
              <div className="w-1/3 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  // Modal Skeleton
  Modal: () => (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-pulse" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="w-64 h-7 bg-gray-200 rounded"></div>
                  <div className="w-96 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-32 h-8 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8">
            <div className="mb-8">
              <div className="w-40 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-48 h-4 bg-gray-200 rounded"></div>
                <div className="space-y-2 text-right">
                  <div className="w-24 h-3 bg-gray-200 rounded ml-auto"></div>
                  <div className="w-16 h-5 bg-gray-200 rounded ml-auto"></div>
                </div>
              </div>

              <div className="relative space-y-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 p-6 bg-gray-100 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-48 h-5 bg-gray-300 rounded"></div>
                        <div className="w-24 h-6 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  ),
};

// Full Page Skeleton Loader
const FullPageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
    <SkeletonLoader.Header />
    <SkeletonLoader.Tabs />
    <div className="p-6 space-y-6">
      <SkeletonLoader.CurrentStage />
      <SkeletonLoader.WorkflowProgress />
      <SkeletonLoader.QuickActions />
    </div>
  </div>
);

export default function WorkOrderDetailPage({ orderId }: WorkOrderDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [lifecycle, setLifecycle] = useState<any>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notes, setNotes] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [workflowProgress, setWorkflowProgress] = useState({
    percentage: 0,
    completed: 0,
    total: 0,
    estimatedTime: '0 hours'
  });
  const [canProceedToNextStage, setCanProceedToNextStage] = useState(false);
  const [checklist, setChecklist] = useState<any>(null);
  const [checklistId, setChecklistId] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  
  // Modal state
  const [modalStage, setModalStage] = useState<WorkflowStage | null>(null);
  const [modalSteps, setModalSteps] = useState<any[]>([]);
  const [modalCurrentStep, setModalCurrentStep] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);

  // Additional states
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [showWaiverOptions, setShowWaiverOptions] = useState(false);
  const [selectedWaiverAction, setSelectedWaiverAction] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkOrder();
  }, [orderId, refreshKey]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const data = await workOrderService.getWorkOrderById(orderId);
      setWorkOrder(data);
      
      if (data.opportunityId) {
        fetchLifecycle(data);
      }
    } catch (error) {
      console.error('Error fetching work order:', error);
      showToast('Failed to load work order details', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchLifecycle = async (order: any) => {
    try {
      setLifecycleLoading(true);
      const opportunityId = typeof order.opportunityId === 'object' 
        ? order.opportunityId._id 
        : order.opportunityId;
      
      if (!opportunityId) {
        throw new Error('No opportunity ID found');
      }
      
      const lifecycleData = await lifecycleIntegrationService.getWorkOrderLifecycleUI(opportunityId);
      setLifecycle(lifecycleData);
      
      if (lifecycleData?.stages) {
        const workflowStages = transformLifecycleToStages(lifecycleData.stages);
        setWorkflowStages(workflowStages);
        
        const completed = lifecycleData.stages.filter((s: any) => s.completed).length;
        const total = lifecycleData.stages.length;
        
        setWorkflowProgress({
          percentage: Math.round((completed / total) * 100),
          completed,
          total,
          estimatedTime: calculateEstimatedTime(lifecycleData.stages)
        });
      }
    } catch (error) {
      console.error('Error fetching lifecycle:', error);
    } finally {
      setLifecycleLoading(false);
    }
  };

  const transformLifecycleToStages = (stages: LifecycleStageUI[]): WorkflowStage[] => {
    return stages.map((stage, index) => {
      const actions = stage.actions?.map(action => {
        let icon: React.ReactNode;
        let variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' = 'primary';
        
        switch (action.action) {
          case 'create':
            icon = <FilePlus className="h-4 w-4" />;
            variant = 'primary';
            break;
          case 'view':
            icon = <Eye className="h-4 w-4" />;
            variant = 'secondary';
            break;
          case 'update':
            icon = <Edit className="h-4 w-4" />;
            variant = 'secondary';
            break;
          case 'complete':
            icon = <CheckCircle className="h-4 w-4" />;
            variant = 'success';
            break;
          case 'skip':
            icon = <ArrowRight className="h-4 w-4" />;
            variant = 'warning';
            break;
          case 'completeDetails':
            icon = <Wrench className="h-4 w-4" />;
            variant = 'success';
            break;
          case 'markChecklistComplete':
            icon = <CheckSquare className="h-4 w-4" />;
            variant = 'success';
            break;
          case 'transition':
            icon = <ArrowRight className="h-4 w-4" />;
            variant = 'primary';
            break;
          case 'approve':
            icon = <CheckCircle className="h-4 w-4" />;
            variant = 'success';
            break;
          default:
            icon = <Circle className="h-4 w-4" />;
            variant = 'secondary';
        }
        
        return {
          id: action.action,
          label: action.label,
          icon,
          variant,
          description: action.description
        };
      }) || [];
      
      const isChecklistStage = stage.stage === 'prechecklist' || stage.stage === 'postchecklist';
      const hasChecklistDocument = stage.document && stage.document._id;
      const isChecklistApproved = stage.document?.approved;
      
      if (isChecklistStage && hasChecklistDocument && !isChecklistApproved) {
        if (!actions.some(a => a.id === 'markChecklistComplete')) {
          actions.push({
            id: 'markChecklistComplete',
            label: 'Mark Checklist Complete',
            icon: <CheckSquare className="h-4 w-4" />,
            variant: 'success',
            description: 'Approve and complete this checklist'
          });
        }
      }
      
      const steps = getStageSteps(stage);
      
      return {
        id: `stage-${index}`,
        stage: stage.stage,
        label: stage.label,
        description: stage.description,
        completed: stage.completed,
        isCurrent: stage.isCurrent,
        document: stage.document,
        documentId: stage.documentId,
        documentType: stage.documentType,
        icon: getStageIcon(stage.stage),
        actions,
        requirements: getStageRequirements(stage),
        completionDate: stage.completedAt || stage.completionDate,
        mandatory: stage.mandatory || stage.required || true,
        estimatedTime: getStageTimeEstimate(stage.stage),
        dependencies: stage.dependencies || [],
        canSkip: stage.canSkip || stage.skippable || false,
        steps,
        progress: calculateStageProgress(stage, steps)
      };
    });
  };

  const getStageIcon = (stage: string) => {
    const icons: Record<string, React.ReactNode> = {
      'quote': <FileText className="h-5 w-5" />,
      'waiver': <FileSignature className="h-5 w-5" />,
      'jobcard': <Wrench className="h-5 w-5" />,
      'prechecklist': <ClipboardCheck className="h-5 w-5" />,
      'postchecklist': <ClipboardList className="h-5 w-5" />,
      'invoice': <ReceiptIcon className="h-5 w-5" />,
      'payment': <CreditCardIcon className="h-5 w-5" />,
      'delivery': <TruckIcon className="h-5 w-5" />,
      'completion': <CheckCircle className="h-5 w-5" />
    };
    return icons[stage] || <Circle className="h-5 w-5" />;
  };

  const getStageRequirements = (stage: LifecycleStageUI): string[] => {
    const requirements: string[] = [];
    
    if (stage.requirements?.requiresCustomerApproval) {
      requirements.push('Customer Approval Required');
    }
    if (stage.requirements?.requiresPayment) {
      requirements.push('Payment Required');
    }
    if (stage.requirements?.requiresSignature) {
      requirements.push('Digital Signature Required');
    }
    if (stage.requirements?.requiresAttachment) {
      requirements.push('File Attachment Required');
    }
    
    return requirements;
  };

  const getStageTimeEstimate = (stage: string): string => {
    const stageEstimates: Record<string, string> = {
      'quote': '30-60 min',
      'waiver': '15-30 min',
      'jobcard': '2-4 hours',
      'prechecklist': '30-60 min',
      'postchecklist': '30-60 min',
      'invoice': '30 min',
      'payment': 'Immediate',
      'delivery': '1-2 hours',
      'completion': '15 min'
    };
    return stageEstimates[stage] || '30 min';
  };

  const getStageSteps = (stage: LifecycleStageUI): any[] => {
    const baseSteps = [
      { id: 'preparation', label: 'Preparation', description: 'Review requirements and gather resources', completed: false },
      { id: 'documentation', label: 'Documentation', description: 'Create and prepare documents', completed: false },
      { id: 'verification', label: 'Verification', description: 'Verify all requirements are met', completed: false },
      { id: 'approval', label: 'Approval', description: 'Get necessary approvals', completed: false },
      { id: 'completion', label: 'Completion', description: 'Mark stage as complete', completed: false }
    ];

    const markSteps = (steps: any[], stage: LifecycleStageUI) => {
      if (stage.completed) {
        return steps.map(step => ({ ...step, completed: true }));
      }
      
      if (stage.document) {
        const updatedSteps = [...steps];
        if (stage.document._id) updatedSteps[0].completed = true;
        if (stage.document.status === 'created') updatedSteps[1].completed = true;
        if (stage.document.status === 'verified') updatedSteps[2].completed = true;
        if (stage.document.approved) updatedSteps[3].completed = true;
        return updatedSteps;
      }
      
      return steps;
    };

    switch (stage.stage) {
      case 'quote':
        return markSteps([
          { id: 'gather-info', label: 'Gather Information', description: 'Collect client and service details', completed: false },
          { id: 'create-quote', label: 'Create Quote', description: 'Generate detailed quote document', completed: false },
          { id: 'review-quote', label: 'Review Quote', description: 'Double-check all details and pricing', completed: false },
          { id: 'send-quote', label: 'Send to Client', description: 'Deliver quote to client for approval', completed: false },
          { id: 'get-approval', label: 'Get Approval', description: 'Receive client approval signature', completed: false }
        ], stage);
      
      case 'jobcard':
        return markSteps([
          { id: 'assign-technician', label: 'Assign Technician', description: 'Assign qualified technician to job', completed: false },
          { id: 'create-jobcard', label: 'Create Job Card', description: 'Generate detailed job card with tasks', completed: false },
          { id: 'gather-parts', label: 'Gather Parts', description: 'Collect all required parts and tools', completed: false },
          { id: 'schedule-service', label: 'Schedule Service', description: 'Set service date and time', completed: false },
          { id: 'dispatch', label: 'Dispatch Technician', description: 'Send technician to site', completed: false }
        ], stage);
      
      case 'prechecklist':
        return markSteps([
          { id: 'create-checklist', label: 'Create Checklist', description: 'Generate pre-service checklist', completed: false },
          { id: 'inspect-equipment', label: 'Inspect Equipment', description: 'Thoroughly inspect equipment', completed: false },
          { id: 'document-findings', label: 'Document Findings', description: 'Record all inspection results', completed: false },
          { id: 'get-approval', label: 'Get Approval', description: 'Get supervisor approval', completed: false },
          { id: 'mark-ready', label: 'Mark as Ready', description: 'Mark equipment ready for service', completed: false }
        ], stage);
      
      case 'postchecklist':
        return markSteps([
          { id: 'create-checklist', label: 'Create Checklist', description: 'Generate post-service checklist', completed: false },
          { id: 'verify-service', label: 'Verify Service', description: 'Verify all services completed', completed: false },
          { id: 'test-equipment', label: 'Test Equipment', description: 'Test equipment functionality', completed: false },
          { id: 'get-approval', label: 'Get Approval', description: 'Get client approval signature', completed: false },
          { id: 'document-completion', label: 'Document Completion', description: 'Complete all documentation', completed: false }
        ], stage);
      
      case 'invoice':
        return markSteps([
          { id: 'gather-costs', label: 'Gather Costs', description: 'Collect all labor and parts costs', completed: false },
          { id: 'create-invoice', label: 'Create Invoice', description: 'Generate detailed invoice', completed: false },
          { id: 'apply-discounts', label: 'Apply Discounts', description: 'Apply any applicable discounts', completed: false },
          { id: 'review-invoice', label: 'Review Invoice', description: 'Verify all charges are accurate', completed: false },
          { id: 'send-invoice', label: 'Send to Client', description: 'Deliver invoice to client', completed: false }
        ], stage);
      
      default:
        return markSteps(baseSteps, stage);
    }
  };

  const calculateStageProgress = (stage: LifecycleStageUI, steps: any[]): { percentage: number; completedSteps: number; totalSteps: number } => {
    const totalSteps = steps.length;
    const completedSteps = steps.filter(step => step.completed).length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    
    return {
      percentage,
      completedSteps,
      totalSteps
    };
  };

  const calculateEstimatedTime = (stages: LifecycleStageUI[]): string => {
    const stageEstimates: Record<string, number> = {
      'quote': 1,
      'waiver': 0.5,
      'jobcard': 3,
      'prechecklist': 1,
      'postchecklist': 1,
      'invoice': 0.5,
      'payment': 0.5,
      'delivery': 1.5,
      'completion': 0.25
    };
    
    const totalHours = stages.reduce((total, stage) => {
      return total + (stageEstimates[stage.stage] || 1);
    }, 0);
    
    return `${totalHours} hours`;
  };

  const getCurrentStage = (): WorkflowStage | undefined => {
    return workflowStages.find(stage => stage.isCurrent);
  };

  const isStageCompleted = (stage: WorkflowStage): boolean => {
    switch (stage.stage) {
      case 'quote':
        return stage.document?.status === 'approved';
      
      case 'waiver':
        if (stage.document) {
          return stage.document.signed === true;
        }
        return true;
      
      case 'jobcard':
        return !!stage.document && (
          stage.document.status === 'in_progress' || 
          stage.document.status === 'completed'
        );
      
      case 'prechecklist':
        if (!stage.document) {
          return false;
        }
        return stage.document.approved === true;
      
      case 'postchecklist':
        if (stage.document?.approved) return true;
        return stage.document?.inspectionItems?.every((item: any) => 
          !item.required || item.status === 'completed' || item.status === 'n/a'
        ) || false;
      
      case 'invoice':
        return !!stage.document;
      
      default:
        return stage.completed || false;
    }
  };

  const canMoveToNextStage = (): boolean => {
    const currentStage = getCurrentStage();
    if (!currentStage) return false;
    
    const isCompleted = isStageCompleted(currentStage);
    
    console.log(`canMoveToNextStage check:`, {
      stage: currentStage.label,
      isCompleted,
      hasDocument: !!currentStage.document,
      documentStatus: currentStage.document?.status,
      documentApproved: currentStage.document?.approved
    });
    
    return isCompleted;
  };

  const handleStageModalClick = (stage: WorkflowStage) => {
    setModalStage(stage);
    setModalSteps(stage.steps || []);
    setModalCurrentStep(stage.steps?.filter(s => s.completed).length || 0);
  };

  const handleCloseModal = () => {
    setModalStage(null);
    setModalCurrentStep(0);
  };

  const handleModalNextStep = () => {
    if (modalCurrentStep < modalSteps.length - 1) {
      setModalCurrentStep(prev => prev + 1);
    }
  };

  const handleModalPrevStep = () => {
    if (modalCurrentStep > 0) {
      setModalCurrentStep(prev => prev - 1);
    }
  };

  const handleCompleteStep = async (stepId: string) => {
    if (!modalStage) return;
    
    setModalLoading(true);
    try {
      const updatedSteps = modalSteps.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      );
      setModalSteps(updatedSteps);
      
      const allCompleted = updatedSteps.every(step => step.completed);
      if (allCompleted && modalStage && !modalStage.completed) {
        await handleCompleteStageModal(modalStage);
      }
      
      showToast('Step completed successfully', 'success');
    } catch (error) {
      showToast('Failed to complete step', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCompleteStageModal = async (stage: WorkflowStage) => {
    try {
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) return;
      
      setModalLoading(true);
      await lifecycleIntegrationService.markStageAsCompleted(
        opportunityId, 
        stage.stage,
        { documentId: stage.documentId }
      );
      
      showToast(`${stage.label} marked as completed`, 'success');
      fetchWorkOrder();
      handleCloseModal();
    } catch (error: any) {
      showToast(error.message || 'Failed to complete stage', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStageAction = async (stage: WorkflowStage, actionId: string) => {
    try {
      if (!workOrder) return;
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) {
        showToast('Cannot perform action: No opportunity found', 'error');
        return;
      }
      
      console.log('Stage action triggered:', {
        stage: stage.stage,
        actionId,
        hasDocument: !!stage.document,
        documentId: stage.documentId,
        document: stage.document
      });
      
      switch (actionId) {
        case 'create':
          await handleCreateDocument(stage.stage);
          break;
        case 'view':
          if (stage.document && stage.document._id) {
            await handleViewDocument(stage);
          } else {
            showToast('No document exists to view. Please create one first.', 'warning');
          }
          break;
        case 'complete':
          await handleCompleteStage(stage);
          break;
        case 'completeDetails':
          if (stage.stage === 'jobcard' && stage.documentId) {
            router.push(`/job-cards/${stage.documentId}/complete-details`);
          }
          break;
        case 'markChecklistComplete':
          await handleMarkChecklistComplete(stage);
          break;
        case 'skip':
          if (stage.stage === 'waiver') {
            await handleSkipStage(stage);
          }
          break;
        case 'update':
          await handleUpdateDocument(stage);
          break;
        case 'transition':
          await handleMoveToNextStage();
          break;
        case 'approve':
          if (stage.stage === 'quote' && stage.documentId) {
            await handleApproveQuote(stage);
          }
          break;
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    }
  };

  const handleApproveQuote = async (stage: WorkflowStage) => {
    try {
      setWorkflowLoading(true);
      const quoteService = require('@/services/quoteService');
      await quoteService.approveQuote(stage.documentId, {
        approvedBy: 'current-user-id',
        approvedAt: new Date().toISOString()
      });
      
      showToast('Quote approved successfully', 'success');
      fetchWorkOrder();
    } catch (error: any) {
      showToast(error.message || 'Failed to approve quote', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleMarkChecklistComplete = async (stage: WorkflowStage) => {
    try {
      if (!stage.documentId) {
        showToast('No checklist document found', 'error');
        return;
      }
      
      setWorkflowLoading(true);
      
      const currentUserId = sessionStorage.getItem('userId') || 'system';
      const currentUserName = sessionStorage.getItem('userName') || 'User';
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) {
        showToast('Could not find opportunity', 'error');
        setWorkflowLoading(false);
        return;
      }
      
      if (stage.stage === 'prechecklist') {
        try {
          const response = await fetch(`/api/v1/prechecklists/${stage.documentId}/approve`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              approved: true,
              approvedBy: currentUserId
            })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const approvedChecklist = await response.json();
          
          setWorkflowStages(prevStages => 
            prevStages.map(s => 
              s.stage === 'prechecklist' 
                ? { 
                    ...s, 
                    completed: true,
                    document: { ...(s.document || {}), approved: true }
                  }
                : s
            )
          );
          
          showToast('Pre-checklist approved! Next stage is now available.', 'success');
          
        } catch (apiError) {
          console.error('API error:', apiError);
          
          setWorkflowStages(prevStages => 
            prevStages.map(s => 
              s.stage === 'prechecklist' ? { ...s, completed: true } : s
            )
          );
          
          showToast('Pre-checklist marked as completed!', 'success');
        }
      } 
      else if (stage.stage === 'postchecklist') {
        try {
          const response = await fetch(`/api/v1/postchecklist/${stage.documentId}/approve`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              approved: true,
              approvedBy: currentUserId,
              comments: `Approved by ${currentUserName}`
            })
          });
          
          if (response.ok) {
            setWorkflowStages(prevStages => 
              prevStages.map(s => 
                s.stage === 'postchecklist' 
                  ? { 
                      ...s, 
                      completed: true,
                      document: { ...(s.document || {}), approved: true }
                    }
                  : s
              )
            );
            showToast('Post-checklist approved! Next stage is now available.', 'success');
          }
        } catch (error) {
          setWorkflowStages(prevStages => 
            prevStages.map(s => 
              s.stage === 'postchecklist' ? { ...s, completed: true } : s
            )
          );
          showToast('Post-checklist marked as completed!', 'success');
        }
      }
      
      setRefreshKey(prev => prev + 1);
      
    } catch (error: any) {
      console.error('Error marking checklist complete:', error);
      showToast('Failed to complete checklist', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

   const checkIfStageTrulyCompleted = async (stage: string, document: any): Promise<boolean> => {
    try {
      // For checklist stages
      if (stage === 'prechecklist' || stage === 'postchecklist') {
        if (!document) return false;
        
        // First check if it's approved
        if (document.approved) return true;
        
        if (stage === 'prechecklist') {
          // Check if pre-checklist has no faults and all items are ok or n/a
          return document.inspectionItems?.every((item: any) => 
            item.status === 'ok' || item.status === 'n/a'
          ) || false;
        } else {
          // Check if post-checklist has all required items completed
          return document.inspectionItems?.every((item: any) => 
            !item.required || item.status === 'completed' || item.status === 'n/a'
          ) || false;
        }
      }
      
      // For other stages
      return !!document;
    } catch (error) {
      console.error('Error checking stage completion:', error);
      return false;
    }
  };

  const checkNextStageAvailability = async () => {
    try {
      if (!workOrder || !lifecycle) return;
      
      const currentStage = getCurrentStage();
      if (!currentStage) {
        setCanProceedToNextStage(false);
        return;
      }
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) {
        setCanProceedToNextStage(false);
        return;
      }
      
      // Get updated lifecycle data
      const lifecycleUI = await lifecycleIntegrationService.getWorkOrderLifecycleUI(opportunityId);
      
      // Find the current stage in the lifecycle
      const currentLifecycleStage = lifecycleUI.stages.find((s: any) => s.isCurrent);
      
      if (!currentLifecycleStage) {
        setCanProceedToNextStage(false);
        return;
      }
      
      // Check if current stage is completed
      const isCompleted = currentLifecycleStage.completed;
      
      // For checklist stages, also check if the document is approved
      let isApproved = true;
      if (currentStage.stage === 'prechecklist' || currentStage.stage === 'postchecklist') {
        isApproved = currentLifecycleStage.document?.approved || false;
      }
      
      // Check if we can transition
      const canTransition = isCompleted && isApproved;
      
      setCanProceedToNextStage(canTransition);
      
    } catch (error) {
      console.error('Error checking next stage availability:', error);
      setCanProceedToNextStage(false);
    }
  };

  // Update useEffect to check next stage availability when lifecycle changes
  useEffect(() => {
    if (lifecycle) {
      checkNextStageAvailability();
    }
  }, [lifecycle]);

  // Add this useEffect to update canProceedToNextStage when stages change
  useEffect(() => {
    const canProceed = canMoveToNextStage();
    setCanProceedToNextStage(canProceed);
    
    // If we have a current stage that's a checklist and it's completed, enable next stage
    const currentStage = getCurrentStage();
    if (currentStage && (currentStage.stage === 'prechecklist' || currentStage.stage === 'postchecklist')) {
      if (currentStage.completed || currentStage.document?.approved) {
        setCanProceedToNextStage(true);
      }
    }
  }, [workflowStages, workOrder]);

  useEffect(() => {
    if (workflowStages.length > 0) {
      const preChecklistStage = workflowStages.find(s => s.stage === 'prechecklist');
      if (preChecklistStage) {
        console.log('Pre-checklist stage status:', {
          stage: preChecklistStage.stage,
          completed: preChecklistStage.completed,
          documentExists: !!preChecklistStage.document,
          documentId: preChecklistStage.documentId,
          documentApproved: preChecklistStage.document?.approved,
          inspectionItems: preChecklistStage.document?.inspectionItems?.map((item: any) => ({
            item: item.item,
            status: item.status
          }))
        });
      }
    }
  }, [workflowStages]);

  const handleNextStage = async () => {
    try {
      if (!workOrder || !canProceedToNextStage) return;
      
      setWorkflowLoading(true);
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) {
        showToast('Cannot move to next stage: No opportunity linked', 'error');
        setWorkflowLoading(false);
        return;
      }
      
      const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId);
      
      if (result.success) {
        showToast(`Successfully moved to ${result.currentStage} stage`, 'success');
        await fetchWorkOrder();
      } else {
        showToast(result.message || 'Failed to move to next stage', 'error');
      }
      
    } catch (error: any) {
      console.error('Stage transition error:', error);
      showToast(error.message || 'Failed to move to next stage', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleUpdateDocument = async (stage: WorkflowStage) => {
    if (!stage.documentId) {
      await handleCreateDocument(stage.stage);
      return;
    }
    
    const route = stage.documentType === 'Job Card' ? 'jobcards' :
                stage.documentType === 'Pre-Checklist' ? 'prechecklists' :
                stage.documentType === 'Post-Checklist' ? 'postchecklists' :
                stage.documentType === 'Waiver' ? 'waivers' :
                `${stage.documentType?.toLowerCase()}s`;
    
    router.push(`/${route}/${stage.documentId}/edit`);
  }

  const handleCreateDocument = async (stageType: string) => {
    const opportunityId = typeof workOrder.opportunityId === 'object' 
      ? workOrder.opportunityId._id 
      : workOrder.opportunityId;
    
    switch (stageType) {
      case 'quote':
        router.push(`/quotes/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
        break;
      case 'waiver':
        router.push(`/waivers/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
        break;
      case 'jobcard':
        const currentStage = workflowStages.find(stage => stage.stage === 'jobcard');
        if (currentStage?.documentId) {
          router.push(`/job-cards/${currentStage.documentId}/edit`);
        } else {
          router.push(`/job-cards/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
        }
        break;
      case 'prechecklist':
        router.push(`/pre-checklist/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
        break;
      case 'postchecklist':
        router.push(`/post-checklist/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
        break;
      case 'invoice':
        router.push(`/invoices/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
        break;
    }
  };

  const handleViewDocument = async (stage: WorkflowStage) => {
    if (!stage.documentId) return;
    
    const route = stage.documentType === 'Job Card' ? 'job-cards' :
                 stage.documentType === 'Pre-Checklist' ? 'pre-checklist' :
                 stage.documentType === 'Post-Checklist' ? 'post-checklist' :
                 stage.documentType === 'Waiver' ? 'waivers' :
                 `${stage.documentType?.toLowerCase()}s`;
    
    router.push(`/${route}/${stage.documentId}`);
  };

  const handleCompleteStage = async (stage: WorkflowStage) => {
    try {
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) return;
      
      if (stage.stage !== 'waiver') {
        const isValid = await validateStageCompletion(stage);
        if (!isValid) return;
      }
      
      setWorkflowLoading(true);
      await lifecycleIntegrationService.markStageAsCompleted(
        opportunityId, 
        stage.stage,
        { documentId: stage.documentId }
      );
      
      showToast(`${stage.label} marked as completed`, 'success');
      fetchWorkOrder();
    } catch (error: any) {
      showToast(error.message || 'Failed to complete stage', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const validateStageCompletion = async (stage: WorkflowStage): Promise<boolean> => {
    const stagesRequiringDocuments = ['quote', 'jobcard', 'prechecklist', 'postchecklist', 'invoice'];
    
    if (stagesRequiringDocuments.includes(stage.stage) && !stage.document) {
      showToast('Please create the document first', 'warning');
      return false;
    }
    
    return true;
  };

  const handleSkipStage = async (stage: WorkflowStage) => {
    try {
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) return;
      
      setWorkflowLoading(true);
      const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId, {
        skipValidation: true,
        metadata: { skippedStage: stage.stage, reason: 'User skipped' }
      });
      
      if (result.success) {
        showToast(`${stage.label} stage skipped`, 'info');
        fetchWorkOrder();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to skip stage', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleMoveToNextStage = async () => {
    try {
      if (!workOrder) {
        showToast('No work order found', 'error');
        return;
      }

      const currentStage = getCurrentStage();
      if (!currentStage) {
        showToast('No current stage found', 'error');
        return;
      }

      if (!isStageCompleted(currentStage)) {
        showToast(`Please complete the ${currentStage.label} stage first`, 'warning');
        return;
      }

      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;

      if (!opportunityId) {
        showToast('Cannot move to next stage: No opportunity linked', 'error');
        return;
      }

      setWorkflowLoading(true);
      
      const stageOrder = ['quote', 'waiver', 'jobcard', 'prechecklist', 'postchecklist', 'invoice'];
      const currentIndex = stageOrder.indexOf(currentStage.stage);
      
      if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) {
        showToast('Already at the final stage', 'info');
        setWorkflowLoading(false);
        return;
      }
      
      const nextStage = stageOrder[currentIndex + 1];
      
      if (currentStage.stage === 'jobcard' && nextStage === 'prechecklist') {
        showToast('Please create and approve a pre-checklist to proceed', 'info');
        
        await fetchWorkOrder();
        
        setWorkflowLoading(false);
        return;
      }
      
      const result = await lifecycleIntegrationService.transitionToStage(
        opportunityId,
        nextStage,
        { skipValidation: false }
      );
      
      if (result.success) {
        showToast(`Successfully moved to ${nextStage} stage`, 'success');
        await fetchWorkOrder();
      } else {
        showToast(result.message || 'Failed to move to next stage', 'error');
      }
      
    } catch (error: any) {
      console.error('Stage transition error:', error);
      showToast(error.message || 'Failed to move to next stage', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const startWorkflow = async () => {
    try {
      setWorkflowLoading(true);
      router.push(`/quotes/create?workOrderId=${orderId}&source=work-order`);
    } catch (error) {
      console.error('Error starting workflow:', error);
      showToast('Failed to start workflow', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleWaiverOption = async (option: 'create' | 'skip' | 'complete') => {
    try {
      const waiverStage = workflowStages.find(s => s.stage === 'waiver');
      if (!waiverStage || !workOrder) return;
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) return;
      
      setWorkflowLoading(true);
      
      if (option === 'create') {
        // Create waiver document
        router.push(`/waivers/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
        setShowWaiverOptions(false);
      } else if (option === 'skip') {
        // Skip waiver stage and move to jobcard
        const result = await lifecycleIntegrationService.transitionToStage(
          opportunityId,
          'jobcard',
          { 
            skipValidation: true,
            metadata: { skippedStage: 'waiver', reason: 'User skipped' }
          }
        );
        
        if (result.success) {
          showToast('Waiver skipped, moving to job card stage', 'info');
          await fetchWorkOrder();
        }
        setShowWaiverOptions(false);
      } else if (option === 'complete') {
        // Mark waiver as completed (for cases where waiver already exists)
        await lifecycleIntegrationService.markStageAsCompleted(
          opportunityId,
          'waiver',
          { documentId: waiverStage.documentId }
        );
        
        // Then move to next stage
        const result = await lifecycleIntegrationService.transitionToStage(
          opportunityId,
          'jobcard'
        );
        
        if (result.success) {
          showToast('Waiver completed, moving to job card stage', 'success');
          await fetchWorkOrder();
        }
        setShowWaiverOptions(false);
      }
    } catch (error: any) {
      console.error('Error handling waiver option:', error);
      showToast(error.message || 'Failed to process waiver option', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleMoveToPreviousStage = async () => {
    try {
      const currentStage = getCurrentStage();
      if (!currentStage) return;
      
      const currentIndex = workflowStages.findIndex(stage => stage.id === currentStage.id);
      if (currentIndex <= 0) return;
      
      const previousStage = workflowStages[currentIndex - 1];
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) return;
      
      setWorkflowLoading(true);
      await lifecycleIntegrationService.moveToStage(
        opportunityId,
        previousStage.stage,
        { reason: 'Manual navigation back' }
      );
      
      showToast(`Moved back to ${previousStage.label}`, 'info');
      fetchWorkOrder();
    } catch (error: any) {
      showToast(error.message || 'Failed to move back', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.print();
      showToast('Printing work order...', 'info');
    } catch (error) {
      showToast('Failed to print', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast(`Exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      showToast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async (method: 'email' | 'link' | 'download') => {
    try {
      setShowShareMenu(false);
      switch (method) {
        case 'email':
          showToast('Share via email', 'info');
          break;
        case 'link':
          await navigator.clipboard.writeText(window.location.href);
          showToast('Link copied to clipboard', 'success');
          break;
        case 'download':
          handleExport('pdf');
          break;
      }
    } catch (error) {
      showToast('Share failed', 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
  try {
    // Validate that the status matches the expected type
    const validStatuses = ['draft', 'in_progress', 'on_hold', 'completed', 'cancelled'] as const;
    
    // Type guard to check if the status is valid
    const isValidStatus = (status: string): status is 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' => {
      return validStatuses.includes(status as any);
    };
    
    if (!isValidStatus(newStatus)) {
      showToast(`Invalid status: ${newStatus}`, 'error');
      return;
    }
    
    setUpdating(true);
    await workOrderService.updateWorkOrder(orderId, { status: newStatus });
    showToast(`Status changed to ${newStatus.replace('_', ' ')}`, 'success');
    fetchWorkOrder();
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Failed to update status', 'error');
  } finally {
    setUpdating(false);
  }
};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      draft: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800',
        icon: <EyeOff className="h-3 w-3" />
      },
      in_progress: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800',
        icon: <Wrench className="h-3 w-3" />
      },
      on_hold: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800',
        icon: <Clock className="h-3 w-3" />
      },
      completed: { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      cancelled: { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        icon: <AlertCircle className="h-3 w-3" />
      },
    };
    return config[status] || config.draft;
  };

  const getStageStatusColor = (stage: WorkflowStage) => {
    if (stage.completed) return 'text-green-600 bg-green-50 border-green-200';
    if (stage.isCurrent) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-500 bg-gray-50 border-gray-200';
  };

  const getStageStatusIcon = (stage: WorkflowStage) => {
    if (stage.completed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (stage.isCurrent) return <CircleDot className="h-4 w-4 text-blue-500 animate-pulse" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  // Waiver Options Modal Component
  const WaiverOptionsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileSignature className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Waiver Stage Options</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          You're moving from Quote to Waiver stage. What would you like to do?
        </p>
        
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleWaiverOption('create')}
            className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition-colors"
          >
            <FilePlus className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Create Waiver</p>
              <p className="text-sm text-gray-600">Generate and send waiver document</p>
            </div>
          </button>
          
          <button
            onClick={() => handleWaiverOption('skip')}
            className="w-full flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left transition-colors"
          >
            <ArrowRight className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-gray-900">Skip Waiver</p>
              <p className="text-sm text-gray-600">Continue without waiver document</p>
            </div>
          </button>
          
          {/* Add complete option if waiver already exists */}
          {workflowStages.some(s => s.stage === 'waiver' && s.document) && (
            <button
              onClick={() => handleWaiverOption('complete')}
              className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left transition-colors"
            >
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Mark Complete</p>
                <p className="text-sm text-gray-600">Use existing waiver document</p>
              </div>
            </button>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowWaiverOptions(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Add this function after isStageCompleted
    const getStageCompletionRequirements = (stage: WorkflowStage): string => {
      switch (stage.stage) {
        case 'quote':
          return 'Requires approval to proceed';
        case 'waiver':
          return 'Optional - can create waiver or skip';
        case 'jobcard':
          return 'Requires job card document';
        case 'prechecklist':
          if (!stage.document) {
            return 'Create pre-checklist document first';
          }
          
          if (!stage.document.approved) {
            const totalItems = stage.document.inspectionItems?.length || 0;
            const completedItems = stage.document.inspectionItems?.filter(
              (item: any) => item.status === 'ok' || item.status === 'n/a'
            ).length || 0;
            
            return `Complete inspection (${completedItems}/${totalItems} items) and get approval`;
          }
          return 'Checklist approved. Ready to proceed.';
        case 'postchecklist':
          return 'Requires post-service verification';
        case 'invoice':
          return 'Requires invoice generation';
        default:
          return 'Complete this stage to proceed';
      }
    };

  // Show full page skeleton on initial load
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

  const statusConfig = getStatusBadge(workOrder.status);
  const currentStage = getCurrentStage();

  // Show skeleton for modal when loading
  if (modalLoading) {
    return <SkeletonLoader.Modal />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      {loading ? (
        <SkeletonLoader.Header />
      ) : (
        <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 p-4 sm:p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-400 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/orders/work-orders')}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold text-white">{workOrder.workOrderNumber}</h1>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                        {statusConfig.icon}
                        <span className="text-xs font-medium text-white capitalize">{workOrder.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/90">Work Order • Created {formatDate(workOrder.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors disabled:opacity-50"
                  title="Print"
                >
                  {isPrinting ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Printer className="h-5 w-5 text-white" />}
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors disabled:opacity-50"
                  title="Export"
                >
                  {isExporting ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Download className="h-5 w-5 text-white" />}
                </button>
                <Link
                  href={`/orders/work-orders/${workOrder._id}/edit`}
                  className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="h-5 w-5 text-white" />
                </Link>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors relative"
                  title="Share"
                >
                  <Share2 className="h-5 w-5 text-white" />
                  {showShareMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => handleShare('email')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Share via Email
                      </button>
                      <button
                        onClick={() => handleShare('link')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleShare('download')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </button>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors relative"
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
                        onClick={() => handleStatusChange('on_hold')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Put on Hold
                      </button>
                      <button
                        onClick={() => handleStatusChange('cancelled')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Cancel Work Order
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => router.push(`/orders/work-orders/${workOrder._id}/assign`)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Assign to Technician
                      </button>
                      <button
                        onClick={() => router.push(`/orders/work-orders/${workOrder._id}/schedule`)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule Service
                      </button>
                      <button
                        onClick={() => router.push(`/orders/work-orders/${workOrder._id}/duplicate`)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate Work Order
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => router.push(`/orders/work-orders/${workOrder._id}/archive`)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Archive className="h-4 w-4" />
                        Archive Work Order
                      </button>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      {loading ? (
        <SkeletonLoader.Tabs />
      ) : (
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
                { id: 'services', label: 'Services', icon: <Wrench className="h-4 w-4" /> },
                { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
                { id: 'activity', label: 'Activity', icon: <History className="h-4 w-4" /> },
                { id: 'notes', label: 'Technician Notes', icon: <MessageSquare className="h-4 w-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-6">
            <SkeletonLoader.CurrentStage />
            <SkeletonLoader.WorkflowProgress />
            <SkeletonLoader.QuickActions />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Current Stage Focus */}
                {currentStage && (
                  workflowLoading ? <SkeletonLoader.CurrentStage /> : (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            {currentStage.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h2 className="text-xl font-semibold text-gray-900">Current Stage: {currentStage.label}</h2>
                              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                                Current
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">{currentStage.description}</p>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{currentStage.estimatedTime}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                  {currentStage.progress?.completedSteps || 0} of {currentStage.progress?.totalSteps || 5} steps
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStageModalClick(currentStage)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Open Stage Details
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Workflow Progress Timeline */}
                {lifecycleLoading ? (
                  <SkeletonLoader.WorkflowProgress />
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Workflow Progress</h3>
                        <p className="text-sm text-gray-600">Track progress through all stages</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{workflowProgress.completed} of {workflowProgress.total} stages</p>
                        <p className="text-xs text-gray-500">~{workflowProgress.estimatedTime} total</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-lg font-bold text-blue-600">{workflowProgress.percentage}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${workflowProgress.percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Stages Timeline */}
                    <div className="relative">
                      {/* Connecting Line */}
                      <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-200"></div>
                      
                      <div className="relative flex justify-between">
                        {workflowStages.map((stage, index) => (
                          <div key={stage.id} className="flex flex-col items-center">
                            {/* Stage Dot */}
                            <div 
                              className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-3 border-4 ${
                                stage.completed 
                                  ? 'bg-green-100 border-green-400 text-green-600' 
                                  : stage.isCurrent 
                                    ? 'bg-blue-100 border-blue-400 text-blue-600 animate-pulse' 
                                    : 'bg-gray-100 border-gray-300 text-gray-400'
                              }`}
                              onClick={() => handleStageModalClick(stage)}
                            >
                              {stage.completed ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : stage.isCurrent ? (
                                <CircleDot className="h-5 w-5" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </div>
                            
                            {/* Stage Label */}
                            <div className="text-center max-w-[120px]">
                              <p className={`text-sm font-medium ${
                                stage.completed ? 'text-green-700' : 
                                stage.isCurrent ? 'text-blue-700' : 
                                'text-gray-500'
                              }`}>
                                {stage.label}
                              </p>
                              {stage.isCurrent && (
                                <p className="text-xs text-blue-600 mt-1">Current</p>
                              )}
                              {stage.completed && (
                                <p className="text-xs text-green-600 mt-1">Completed</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{workflowProgress.percentage}%</div>
                        <div className="text-sm text-gray-600">Overall Progress</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{workflowProgress.completed}</div>
                        <div className="text-sm text-gray-600">Stages Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{workflowProgress.total - workflowProgress.completed}</div>
                        <div className="text-sm text-gray-600">Remaining</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {currentStage && currentStage.actions && currentStage.actions.length > 0 && (
                  workflowLoading ? (
                    <SkeletonLoader.QuickActions />
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentStage.actions.slice(0, 3).map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleStageAction(currentStage, action.id)}
                            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] ${
                              action.variant === 'primary'
                                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-blue-200'
                                : action.variant === 'secondary'
                                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-700 hover:from-gray-100 hover:to-gray-200'
                                  : action.variant === 'success'
                                    ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-700 hover:from-green-100 hover:to-green-200'
                                    : action.variant === 'warning'
                                      ? 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-amber-200'
                                      : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-700'
                            }`}
                          >
                            {action.icon}
                            <div className="text-left">
                              <p className="font-semibold">{action.label}</p>
                              <p className="text-xs opacity-75">{action.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {workflowLoading ? (
                  <SkeletonLoader.ServiceDetails />
                ) : (
                  <>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                            <p className="text-gray-900">{workOrder.serviceType || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              workOrder.priority === 'high' 
                                ? 'bg-red-100 text-red-800'
                                : workOrder.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {workOrder.priority || 'normal'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                            <p className="text-gray-900">{formatDate(workOrder.scheduledDate) || 'Not scheduled'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                            <p className="text-gray-900">{workOrder.estimatedHours || 0} hours</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Hours</label>
                            <p className="text-gray-900">{workOrder.actualHours || 0} hours</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <p className="text-gray-900 capitalize">{workOrder.status.replace('_', ' ') || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                            <p className="text-gray-900">{workOrder.customer?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                            <p className="text-gray-900">{workOrder.customer?.phone || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <p className="text-gray-900">{workOrder.customer?.email || 'N/A'}</p>
                        </div>
                        
                        {workOrder.customer?.address && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <p className="text-gray-900">{workOrder.customer.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                {workflowLoading ? (
                  <SkeletonLoader.Documents />
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Documents</h3>
                    <div className="space-y-4">
                      {workflowStages.map((stage) => (
                        <div key={stage.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              stage.completed 
                                ? 'bg-green-100 text-green-600' 
                                : stage.isCurrent 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-gray-100 text-gray-400'
                            }`}>
                              {stage.icon}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{stage.label}</h4>
                              <p className="text-sm text-gray-600">{stage.documentType || 'No document yet'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {stage.document && stage.document._id ? (
                              <>
                                <button
                                  onClick={() => handleViewDocument(stage)}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleUpdateDocument(stage)}
                                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  Edit
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleCreateDocument(stage.stage)}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Create
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                {workflowLoading ? (
                  <SkeletonLoader.Activity />
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {activityLog.length > 0 ? (
                        activityLog.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                {activity.type === 'status_change' ? (
                                  <RefreshCw className="h-4 w-4 text-blue-600" />
                                ) : activity.type === 'note_added' ? (
                                  <MessageSquare className="h-4 w-4 text-blue-600" />
                                ) : activity.type === 'assignment' ? (
                                  <User className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Activity className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No activity recorded yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                {workflowLoading ? (
                  <SkeletonLoader.Notes />
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add a note about this work order..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => {
                            setAddingNote(true);
                            setTimeout(() => {
                              setAddingNote(false);
                              setNotes('');
                              showToast('Note added successfully', 'success');
                            }, 1000);
                          }}
                          disabled={addingNote || !notes.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingNote ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                              Adding...
                            </>
                          ) : (
                            'Add Note'
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notes</h3>
                    <div className="space-y-4">
                      {notes.length > 0 ? (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-700">Your new note will appear here...</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No notes yet. Add your first note above.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stage Details Modal */}
      {modalStage && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleCloseModal}
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${
                      modalStage.completed 
                        ? 'bg-gradient-to-br from-green-100 to-green-200' 
                        : modalStage.isCurrent 
                          ? 'bg-gradient-to-br from-blue-100 to-indigo-100' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      {modalStage.icon}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{modalStage.label}</h2>
                      <p className="text-gray-600">{modalStage.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-600" />
                  </button>
                </div>
                
                {/* Stage Status Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-4 py-2 rounded-full font-semibold ${
                    modalStage.completed 
                      ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' 
                      : modalStage.isCurrent 
                        ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                  }`}>
                    {modalStage.completed ? 'Completed' : modalStage.isCurrent ? 'In Progress' : 'Pending'}
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 rounded-full font-semibold">
                    {modalStage.estimatedTime}
                  </div>
                  {modalStage.stage === 'waiver' && (
                    <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 rounded-full font-semibold">
                      Optional Stage
                    </div>
                  )}
                  {modalStage.stage !== 'waiver' && (
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-full font-semibold">
                      Required
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8">
                {/* Stepper Header */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Stage Steps</h3>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-gray-700">Complete each step to finish this stage</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round((modalSteps.filter(s => s.completed).length / modalSteps.length) * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 z-0" />
                    
                    {/* Steps */}
                    <div className="space-y-8 relative z-10">
                      {modalSteps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-4">
                          {/* Step Number */}
                          <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                            step.completed
                              ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-600 text-white'
                              : index === modalCurrentStep
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-600 text-white animate-pulse'
                                : 'bg-white border-gray-300 text-gray-500'
                          }`}>
                            {step.completed ? (
                              <Check className="h-6 w-6" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          
                          {/* Step Content */}
                          <div className={`flex-1 p-6 rounded-2xl transition-all duration-300 ${
                            index === modalCurrentStep
                              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg'
                              : step.completed
                                ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200'
                                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className={`text-lg font-semibold ${
                                index === modalCurrentStep
                                  ? 'text-blue-900'
                                  : step.completed
                                    ? 'text-green-900'
                                    : 'text-gray-900'
                              }`}>
                                {step.label}
                              </h4>
                              {step.completed ? (
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                  Completed
                                </span>
                              ) : index === modalCurrentStep ? (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                  Current Step
                                </span>
                              ) : null}
                            </div>
                            <p className="text-gray-700 mb-4">{step.description}</p>
                            
                            {index === modalCurrentStep && !step.completed && (
                              <div className="mt-4 flex items-center gap-3">
                                <button
                                  onClick={() => handleCompleteStep(step.id)}
                                  disabled={modalLoading}
                                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {modalLoading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                      Processing...
                                    </>
                                  ) : (
                                    'Mark as Complete'
                                  )}
                                </button>
                                {step.required && (
                                  <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full">
                                    Required
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stage Requirements */}
                {modalStage.requirements && modalStage.requirements.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modalStage.requirements.map((req, idx) => (
                        <div key={idx} className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <span className="font-medium text-amber-900">{req}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Status */}
                {modalStage.documentType && (
                  <div className="mt-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Document</h3>
                    <div className={`p-6 rounded-2xl ${
                      modalStage.document && modalStage.document._id
                        ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200' 
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-xl ${
                            modalStage.document && modalStage.document._id
                              ? 'bg-gradient-to-br from-green-100 to-green-200' 
                              : 'bg-gradient-to-br from-gray-100 to-gray-200'
                          }`}>
                            {modalStage.document && modalStage.document._id 
                              ? <FileCheck className="h-8 w-8 text-green-600" /> 
                              : <FileX className="h-8 w-8 text-gray-500" />
                            }
                          </div>
                          <div>
                            <p className="text-xl font-bold text-gray-900">
                              {modalStage.documentType}
                            </p>
                            <p className="text-gray-600">
                              {modalStage.document && modalStage.document._id
                                ? 'Document created and ready' 
                                : 'Document not created yet'
                              }
                            </p>
                          </div>
                        </div>
                        {modalStage.document && modalStage.document._id && (
                          <button
                            onClick={() => handleViewDocument(modalStage)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold"
                          >
                            View Document
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleModalPrevStep}
                      disabled={modalCurrentStep === 0}
                      className={`px-6 py-3 rounded-xl font-semibold ${
                        modalCurrentStep === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4 inline mr-2" />
                      Previous Step
                    </button>
                    <button
                      onClick={handleModalNextStep}
                      disabled={modalCurrentStep === modalSteps.length - 1}
                      className={`px-6 py-3 rounded-xl font-semibold ${
                        modalCurrentStep === modalSteps.length - 1
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                      }`}
                    >
                      Next Step
                      <ChevronRight className="h-4 w-4 inline ml-2" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Step {modalCurrentStep + 1} of {modalSteps.length}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${((modalCurrentStep + 1) / modalSteps.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {Math.round(((modalCurrentStep + 1) / modalSteps.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Stage Actions */}
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h4 className="font-semibold text-gray-900 mb-3">Stage Actions</h4>
                  <div className="flex items-center gap-3">
                    {modalStage.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleStageAction(modalStage, action.id)}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                          action.variant === 'primary'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                            : action.variant === 'secondary'
                              ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                              : action.variant === 'success'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                : action.variant === 'warning'
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'
                                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                        }`}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}