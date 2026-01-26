'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, ArrowLeft, Calendar, User, DollarSign, 
  Edit, Printer, Download, MapPin, Phone, Mail,
  Building, CheckCircle, Truck, Package, Clock,
  Play, FileText, CreditCard, Loader2,
  TrendingUp, ChevronDown, ChevronUp, FileSignature, Receipt,
  ChevronRight, Share2, Copy, MoreVertical, AlertCircle,
  BarChart3, History, MessageSquare, Star, EyeOff,
  Users, Tag, Globe, Shield, Bell, Settings,
  PlusCircle, MinusCircle, ExternalLink, Filter,
  CopyCheck, QrCode, Lock, Unlock, BellOff,
  Save, Upload, Trash2, Eye, Settings as SettingsIcon,
  RefreshCw, ShieldAlert, Truck as TruckIcon, Package as PackageIcon,
  CreditCard as CreditCardIcon, Receipt as ReceiptIcon,
  ClipboardCheck, ClipboardList, Car, Layers, GitBranch,
  Workflow, Zap, Target, Rocket, LineChart, PieChart,
  ChevronLeft, ChevronsRight, FolderTree, GitPullRequest,
  BarChart, Circle, CircleCheck, CircleDot, CircleEllipsis,
  Clock4, FileCheck, FilePlus, FileX, ArrowRight,
  X, Maximize2, Minimize2, AlertTriangle, HelpCircle,
  MessageCircle, PhoneCall, Mail as MailIcon, UserCheck,
  FileSearch, FileBarChart, FileImage, FileVideo,
  Download as DownloadIcon, Upload as UploadIcon,
  Activity,
  Archive,
  Link as LinkIcon,
} from 'lucide-react';
import { salesOrderService } from '@/services/salesOrderService';
import { lifecycleIntegrationService, LifecycleStageUI } from '@/services/lifecycleIntegrationService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { Quote, quoteService } from '@/services/quoteService';
import { invoiceService } from '@/services/invoiceService';

interface SalesOrderDetailPageProps {
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

  // Order Details Skeleton
  OrderDetails: () => (
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

export default function SalesOrderDetailPage({ orderId }: SalesOrderDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [salesOrder, setSalesOrder] = useState<any>(null);
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
    estimatedTime: '0 days'
  });
  const [canProceedToNextStage, setCanProceedToNextStage] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  
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
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  useEffect(() => {
    fetchSalesOrder();
  }, [orderId, refreshKey]);
  

  const fetchSalesOrder = async () => {
    try {
      setLoading(true);
      const data = await salesOrderService.getSalesOrderById(orderId);
      setSalesOrder(data);
      
      if (data.opportunityId) {
        await fetchLifecycle(data);
        
        // Check if invoice should exist but doesn't
        if (data.quoteId && !data.invoiceId) {
          const currentStage = getCurrentStage();
          if (currentStage?.stage === 'invoice') {
            // Invoice might be in the process of being created
            showToast('Creating invoice from quote...', 'info');
            
            // Wait a bit and check again
            setTimeout(async () => {
              const refreshedData = await salesOrderService.getSalesOrderById(orderId);
              if (refreshedData.invoiceId) {
                setSalesOrder(refreshedData);
                showToast('Invoice created successfully!', 'success');
              }
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching sales order:', error);
      showToast('Failed to load sales order details', 'error');
      router.push('/orders/sales-orders');
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
      
      const lifecycleData = await lifecycleIntegrationService.getSalesOrderLifecycleUI(opportunityId);
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
      'invoice': '30 min',
      'payment': 'Immediate',
      'delivery': '1-2 days',
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

    const markSteps = (steps: any[], stageObj: LifecycleStageUI) => {
      if (stageObj.completed) {
        return steps.map(step => ({ ...step, completed: true }));
      }
      
      if (stageObj.document) {
        const updatedSteps = [...steps];
        if (stageObj.document._id) updatedSteps[0].completed = true;
        if (stageObj.document.status === 'created') updatedSteps[1].completed = true;
        if (stageObj.document.status === 'verified') updatedSteps[2].completed = true;
        if (stageObj.document.approved) updatedSteps[3].completed = true;
        return updatedSteps;
      }
      
      return steps;
    };

    switch (stage.stage) {
      case 'quote':
        return markSteps([
          { id: 'gather-info', label: 'Gather Information', description: 'Collect client and order details', completed: false },
          { id: 'create-quote', label: 'Create Quote', description: 'Generate detailed quote document', completed: false },
          { id: 'review-quote', label: 'Review Quote', description: 'Double-check all details and pricing', completed: false },
          { id: 'send-quote', label: 'Send to Client', description: 'Deliver quote to client for approval', completed: false },
          { id: 'get-approval', label: 'Get Approval', description: 'Receive client approval signature', completed: false }
        ], stage);
      
      case 'invoice':
        return markSteps([
          { id: 'gather-costs', label: 'Gather Costs', description: 'Collect all item costs', completed: false },
          { id: 'create-invoice', label: 'Create Invoice', description: 'Generate detailed invoice', completed: false },
          { id: 'apply-discounts', label: 'Apply Discounts', description: 'Apply any applicable discounts', completed: false },
          { id: 'review-invoice', label: 'Review Invoice', description: 'Verify all charges are accurate', completed: false },
          { id: 'send-invoice', label: 'Send to Client', description: 'Deliver invoice to client', completed: false }
        ], stage);
      
      case 'payment':
        return markSteps([
          { id: 'verify-amount', label: 'Verify Amount', description: 'Confirm payment amount', completed: false },
          { id: 'process-payment', label: 'Process Payment', description: 'Collect payment from client', completed: false },
          { id: 'confirm-receipt', label: 'Confirm Receipt', description: 'Verify payment was received', completed: false },
          { id: 'issue-receipt', label: 'Issue Receipt', description: 'Send payment receipt to client', completed: false },
          { id: 'update-records', label: 'Update Records', description: 'Record payment in system', completed: false }
        ], stage);
      
      case 'delivery':
        return markSteps([
          { id: 'prepare-order', label: 'Prepare Order', description: 'Gather all items for shipment', completed: false },
          { id: 'schedule-delivery', label: 'Schedule Delivery', description: 'Arrange delivery date and time', completed: false },
          { id: 'dispatch', label: 'Dispatch Order', description: 'Send order for delivery', completed: false },
          { id: 'track-shipment', label: 'Track Shipment', description: 'Monitor delivery progress', completed: false },
          { id: 'confirm-delivery', label: 'Confirm Delivery', description: 'Verify order was delivered', completed: false }
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
      'invoice': 0.5,
      'payment': 0.5,
      'delivery': 2, // Days
      'completion': 0.25
    };
    
    const totalDays = stages.reduce((total, stage) => {
      return total + (stageEstimates[stage.stage] || 1);
    }, 0);
    
    return `${totalDays} days`;
  };

  const getCurrentStage = (): WorkflowStage | undefined => {
    return workflowStages.find(stage => stage.isCurrent);
  };

  const isStageCompleted = (stage: WorkflowStage): boolean => {
    switch (stage.stage) {
      case 'quote':
        return stage.document?.status === 'approved';
      
      case 'invoice':
        return stage.document?.status === 'paid' || stage.document?.status === 'sent';
      
      case 'payment':
        return salesOrder?.paymentStatus === 'paid' || stage.document?.status === 'completed';
      
      case 'delivery':
        return salesOrder?.status === 'delivered' || salesOrder?.status === 'shipped';
      
      default:
        return stage.completed || false;
    }
  };

  const canMoveToNextStage = (): boolean => {
    const currentStage = getCurrentStage();
    if (!currentStage) return false;
    
    const isCompleted = isStageCompleted(currentStage);
    
    return isCompleted;
  };

  useEffect(() => {
    const canProceed = canMoveToNextStage();
    setCanProceedToNextStage(canProceed);
  }, [workflowStages, salesOrder]);

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
      const opportunityId = typeof salesOrder.opportunityId === 'object' 
        ? salesOrder.opportunityId._id 
        : salesOrder.opportunityId;
      
      if (!opportunityId) return;
      
      setModalLoading(true);
      await lifecycleIntegrationService.markStageAsCompleted(
        opportunityId, 
        stage.stage,
        { documentId: stage.documentId }
      );
      
      showToast(`${stage.label} marked as completed`, 'success');
      fetchSalesOrder();
      handleCloseModal();
    } catch (error: any) {
      showToast(error.message || 'Failed to complete stage', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStageAction = async (stage: WorkflowStage, actionId: string) => {
    try {
      if (!salesOrder) return;
      
      const opportunityId = typeof salesOrder.opportunityId === 'object' 
        ? salesOrder.opportunityId._id 
        : salesOrder.opportunityId;
      
      if (!opportunityId) {
        showToast('Cannot perform action: No opportunity found', 'error');
        return;
      }
      
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
        case 'skip':
          await handleSkipStage(stage);
          break;
        case 'update':
          await handleUpdateDocument(stage);
          break;
        case 'transition':
          await handleMoveToNextStage();
          break;
        case 'approve':
          if (stage.stage === 'quote' && stage.documentId) {
            await handleApproveQuote(stage.documentId);
          }
          break;
        default:
          showToast(`Action ${actionId} not implemented`, 'warning');
          break;
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    }
  };

  const handleApproveQuote = async (quoteId: string) => {
    try {
      if (!quoteId) {
        showToast('No quote ID provided', 'error');
        return false;
      }
      
      setWorkflowLoading(true);
      
      // First check if quote exists and get its status
      const quote = await quoteService.getQuoteById(quoteId);
      
      if (quote.status === 'approved') {
        showToast('Quote is already approved', 'info');
        setWorkflowLoading(false);
        return true;
      }
      
      // Get user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user._id || user.id || 'system-auto';
      const userRole = user.role || 'system';
      
      // Approve the quote
      await quoteService.approveQuote(quoteId, userId, userRole);
      showToast('Quote approved successfully!', 'success');
      
      // Refresh the sales order data to reflect the change
      const updatedOrder = await salesOrderService.getSalesOrderById(orderId);
      setSalesOrder(updatedOrder);
      
      // Refresh lifecycle data
      if (updatedOrder.opportunityId) {
        await fetchLifecycle(updatedOrder);
      }
      
      setWorkflowLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('Error approving quote:', error);
      showToast(error.message || 'Failed to approve quote', 'error');
      setWorkflowLoading(false);
      return false;
    }
  };

  const handleMoveToNextStage = async () => {
    try {
      if (!salesOrder || !canProceedToNextStage) return;
      
      setWorkflowLoading(true);
      
      const opportunityId = typeof salesOrder.opportunityId === 'object' 
        ? salesOrder.opportunityId._id 
        : salesOrder.opportunityId;
      
      if (!opportunityId) {
        showToast('Cannot move to next stage: No opportunity linked', 'error');
        setWorkflowLoading(false);
        return;
      }
      
      const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId);
      
      if (result.success) {
        showToast(`Successfully moved to ${result.currentStage} stage`, 'success');
        await fetchSalesOrder();
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
    
    const route = stage.documentType === 'Quote' ? 'quotes' :
                 stage.documentType === 'Invoice' ? 'invoices' :
                 `${stage.documentType?.toLowerCase()}s`;
    
    router.push(`/${route}/${stage.documentId}/edit`);
  };

  const handleCreateDocument = async (stageType: string) => {
    if (!salesOrder) return;
    
    const opportunityId = typeof salesOrder.opportunityId === 'object' 
      ? salesOrder.opportunityId._id 
      : salesOrder.opportunityId;
    
    switch (stageType) {
      case 'quote':
        router.push(`/quotes/create?opportunityId=${opportunityId}&salesOrderId=${salesOrder._id}`);
        break;
      case 'invoice':
        router.push(`/invoices/create?opportunityId=${opportunityId}&salesOrderId=${salesOrder._id}`);
        break;
    }
  };

  const handleViewDocument = async (stage: WorkflowStage) => {
    if (!stage.documentId) return;
    
    const route = stage.documentType === 'Quote' ? 'quotes' :
                 stage.documentType === 'Invoice' ? 'invoices' :
                 `${stage.documentType?.toLowerCase()}s`;
    
    router.push(`/${route}/${stage.documentId}`);
  };

  // Update handleCompleteStage to trigger invoice auto-creation
  const handleCompleteStage = async (stage: WorkflowStage) => {
    try {
      const opportunityId = typeof salesOrder.opportunityId === 'object' 
        ? salesOrder.opportunityId._id 
        : salesOrder.opportunityId;
      
      if (!opportunityId) return;
      
      setWorkflowLoading(true);
      
      // Mark stage as completed - this should auto-create the invoice
      await lifecycleIntegrationService.markStageAsCompleted(
        opportunityId, 
        stage.stage,
        { 
          documentId: stage.documentId,
          completedBy: 'system-auto'
        }
      );
      
      showToast(`${stage.label} completed! Creating invoice...`, 'success');
      
      // Wait for invoice creation and refresh all data
      setTimeout(async () => {
        try {
          // Refresh the sales order data
          const refreshedOrder = await salesOrderService.getSalesOrderById(orderId);
          setSalesOrder(refreshedOrder);
          
          // Refresh lifecycle data
          if (refreshedOrder.opportunityId) {
            await fetchLifecycle(refreshedOrder);
          }
          
          // Check if invoice was created
          if (refreshedOrder.invoiceId) {
            showToast('Invoice created successfully!', 'success');
            
            // Also update the current stage in UI
            const currentStageAfterUpdate = getCurrentStage();
            if (currentStageAfterUpdate?.stage === 'invoice') {
              showToast('Now on invoice stage. Please review and send invoice.', 'info');
            }
          } else {
            showToast('Invoice creation may have failed. Please check or create manually.', 'warning');
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
          showToast('Failed to refresh data. Please refresh the page.', 'error');
        } finally {
          setWorkflowLoading(false);
        }
      }, 3000); // Increased timeout to ensure invoice creation completes
      
    } catch (error: any) {
      console.error('Error completing stage:', error);
      showToast(error.message || 'Failed to complete stage', 'error');
      setWorkflowLoading(false);
    }
  };

  useEffect(() => {
    // If invoice is created and we're on overview tab, suggest switching to invoice tab
    if (salesOrder?.invoiceId && activeTab === 'overview') {
      const timer = setTimeout(() => {
        showToast('Invoice created! Switching to invoice tab...', 'info');
        setActiveTab('invoice');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [salesOrder?.invoiceId, activeTab, showToast]);

  const handleMarkInvoiceAsPaid = async () => {
    try {
      if (!salesOrder?.invoiceId) return;
      
      const invoiceId = typeof salesOrder.invoiceId === 'object' 
        ? salesOrder.invoiceId._id 
        : salesOrder.invoiceId;
      
      if (!invoiceId) return;
      
      // Mock payment - update invoice status
      const paidInvoice = await invoiceService.markInvoiceAsPaid(
        invoiceId,
        undefined, // amount paid (full amount)
        undefined, // payment date (now)
        'mock_payment', // payment method
        `MOCK-${Date.now().toString(36).toUpperCase()}` // mock reference
      );
      
      // If we're in invoice stage, mark it as complete
      if (currentStage?.stage === 'invoice') {
        const opportunityId = typeof salesOrder.opportunityId === 'object' 
          ? salesOrder.opportunityId._id 
          : salesOrder.opportunityId;
        
        if (opportunityId) {
          await lifecycleIntegrationService.markStageAsCompleted(opportunityId, 'invoice', {
            documentId: invoiceId,
            completedBy: 'system',
            notes: 'Mock payment completed'
          });
          
          // Complete the sales order lifecycle
          await lifecycleIntegrationService.completeSalesOrder(opportunityId);
        }
      }
      
      showToast('Invoice marked as paid! Sales order completed.', 'success');
      
      // Refresh all data
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 500);
      
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      showToast(error.message || 'Failed to mark invoice as paid', 'error');
    }
  };

  const validateStageCompletion = async (stage: WorkflowStage): Promise<boolean> => {
    const stagesRequiringDocuments = ['quote', 'invoice'];
    
    if (stagesRequiringDocuments.includes(stage.stage) && !stage.document) {
      showToast('Please create the document first', 'warning');
      return false;
    }
    
    // For delivery stage, check if sales order is delivered
    if (stage.stage === 'delivery' && salesOrder?.status !== 'delivered') {
      showToast('Please mark the sales order as delivered first', 'warning');
      return false;
    }
    
    return true;
  };

  const handleSkipStage = async (stage: WorkflowStage) => {
    try {
      const opportunityId = typeof salesOrder.opportunityId === 'object' 
        ? salesOrder.opportunityId._id 
        : salesOrder.opportunityId;
      
      if (!opportunityId) return;
      
      setWorkflowLoading(true);
      const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId, {
        skipValidation: true,
        metadata: { skippedStage: stage.stage, reason: 'User skipped' }
      });
      
      if (result.success) {
        showToast(`${stage.label} stage skipped`, 'info');
        fetchSalesOrder();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to skip stage', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const startWorkflow = async () => {
    try {
      setWorkflowLoading(true);
      router.push(`/quotes/create?salesOrderId=${orderId}&source=sales-order`);
    } catch (error) {
      console.error('Error starting workflow:', error);
      showToast('Failed to start workflow', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.print();
      showToast('Printing sales order...', 'info');
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
      // Define valid sales order statuses
      const validSalesOrderStatuses = ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
      
      // Type guard to check if status is valid
      const isValidSalesOrderStatus = (status: string): status is 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' => {
        return validSalesOrderStatuses.includes(status as any);
      };
      
      if (!isValidSalesOrderStatus(newStatus)) {
        showToast(`Invalid status: ${newStatus}`, 'error');
        return;
      }
      
      await salesOrderService.updateSalesOrder(orderId, { status: newStatus });
      showToast(`Status changed to ${newStatus.replace('_', ' ')}`, 'success');
      fetchSalesOrder();
    } catch (error) {
      console.error('Error updating sales order status:', error);
      showToast('Failed to update status', 'error');
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
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      draft: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800',
        icon: <EyeOff className="h-3 w-3" />
      },
      confirmed: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      processing: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800',
        icon: <Clock className="h-3 w-3" />
      },
      shipped: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800',
        icon: <Truck className="h-3 w-3" />
      },
      delivered: { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        icon: <Package className="h-3 w-3" />
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

  const getStageCompletionRequirements = (stage: WorkflowStage): string => {
    switch (stage.stage) {
      case 'quote':
        return 'Requires approval to proceed';
      case 'invoice':
        return 'Requires invoice generation';
      case 'payment':
        return 'Requires payment confirmation';
      case 'delivery':
        return 'Requires delivery confirmation';
      default:
        return 'Complete this stage to proceed';
    }
  };

  // Show full page skeleton on initial load
  if (loading) {
    return <FullPageSkeleton />;
  }

  if (!salesOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Order Not Found</h3>
          <p className="text-gray-600 mb-6">The sales order you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/orders/sales-orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sales Orders
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusBadge(salesOrder.status);
  const currentStage = getCurrentStage();

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
                  onClick={() => router.push('/orders/sales-orders')}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold text-white">{salesOrder.salesOrderNumber}</h1>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                        {statusConfig.icon}
                        <span className="text-xs font-medium text-white capitalize">{salesOrder.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/90">Sales Order • Created {formatDate(salesOrder.createdAt)}</p>
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
                  href={`/orders/sales-orders/${salesOrder._id}/edit`}
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
                        onClick={() => handleStatusChange('delivered')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Mark as Delivered
                      </button>
                      <button
                        onClick={() => handleStatusChange('shipped')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Truck className="h-4 w-4 text-purple-600" />
                        Mark as Shipped
                      </button>
                      <button
                        onClick={() => handleStatusChange('cancelled')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Cancel Order
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => router.push(`/orders/sales-orders/${salesOrder._id}/duplicate`)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate Order
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => router.push(`/orders/sales-orders/${salesOrder._id}/archive`)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Archive className="h-4 w-4" />
                        Archive Order
                      </button>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation - Updated with Quotation and Invoice tabs */}
      {loading ? (
        <SkeletonLoader.Tabs />
      ) : (
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
                { id: 'quotation', label: 'Quotation', icon: <FileText className="h-4 w-4" /> },
                { id: 'invoice', label: 'Invoice', icon: <ReceiptIcon className="h-4 w-4" /> },
                { id: 'items', label: 'Items', icon: <Package className="h-4 w-4" /> },
                { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
                { id: 'activity', label: 'Activity', icon: <History className="h-4 w-4" /> },
                { id: 'notes', label: 'Notes', icon: <MessageSquare className="h-4 w-4" /> },
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
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          {currentStage.icon}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900">{currentStage.label}</h3>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              currentStage.completed 
                                ? 'bg-green-100 text-green-800' 
                                : currentStage.isCurrent 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {currentStage.completed ? 'Completed' : currentStage.isCurrent ? 'In Progress' : 'Pending'}
                            </div>
                          </div>
                          <p className="text-gray-600">{currentStage.description}</p>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              {currentStage.mandatory ? (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              <span className="text-sm text-gray-600">
                                {currentStage.mandatory ? 'Required' : 'Optional'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentStage.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleStageAction(currentStage, action.id)}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                              action.variant === 'primary'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                                : action.variant === 'success'
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
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

                {/* Workflow Progress */}
                {workflowStages.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Workflow Progress</h3>
                        <p className="text-sm text-gray-600">Track your order through the workflow stages</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Overall Progress</p>
                        <p className="text-2xl font-bold text-blue-600">{workflowProgress.percentage}%</p>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {workflowProgress.completed} of {workflowProgress.total} stages completed
                        </span>
                        <span className="text-sm font-medium text-blue-600">{workflowProgress.percentage}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${workflowProgress.percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="relative mb-8">
                      <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-200" />
                      <div className="relative flex justify-between">
                        {workflowStages.map((stage, index) => (
                          <div key={stage.id} className="flex flex-col items-center">
                            <button
                              onClick={() => handleStageModalClick(stage)}
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                stage.completed
                                  ? 'bg-green-100 border-green-300 text-green-600 hover:bg-green-200'
                                  : stage.isCurrent
                                    ? 'bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200 animate-pulse'
                                    : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {getStageStatusIcon(stage)}
                            </button>
                            <div className="text-center max-w-[120px] mt-3">
                              <p className="text-sm font-medium text-gray-900">{stage.label}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {stage.completed ? 'Completed' : stage.isCurrent ? 'Current' : 'Upcoming'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(salesOrder.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-600">Order Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatDate(salesOrder.estimatedDeliveryDate || salesOrder.orderDate)}
                        </div>
                        <div className="text-sm text-gray-600">Estimated Delivery</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {salesOrder.lineItems?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Items</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {salesOrder.quoteId && (
                      <Link
                        href={`/quotes/${typeof salesOrder.quoteId === 'object' ? salesOrder.quoteId._id : salesOrder.quoteId}`}
                        className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-3"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">View Quote</h4>
                          <p className="text-sm text-gray-600">Review the quotation details</p>
                        </div>
                      </Link>
                    )}
                    
                    {salesOrder.invoiceId && (
                      <Link
                        href={`/invoices/${typeof salesOrder.invoiceId === 'object' ? salesOrder.invoiceId._id : salesOrder.invoiceId}`}
                        className="p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors flex items-center gap-3"
                      >
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Receipt className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">View Invoice</h4>
                          <p className="text-sm text-gray-600">Check invoice details</p>
                        </div>
                      </Link>
                    )}
                    
                    <button
                      onClick={handlePrint}
                      className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-3"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Printer className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Print Order</h4>
                        <p className="text-sm text-gray-600">Generate printable version</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Special Quote Completion Message */}
                {currentStage?.stage === 'quote' && (
                  <div className="mt-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Complete Quote to Auto-Create Invoice</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            When you complete this quote stage, an invoice will be automatically generated from the quote data.
                          </p>
                          
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 bg-white rounded-lg p-3 border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Current Quote</span>
                                {salesOrder.quoteId && (
                                  <Link 
                                    href={`/quotes/${typeof salesOrder.quoteId === 'object' ? salesOrder.quoteId._id : salesOrder.quoteId}`}
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    View
                                  </Link>
                                )}
                              </div>
                              {salesOrder.quoteId && typeof salesOrder.quoteId === 'object' && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {salesOrder.quoteId.quoteNumber} • {formatCurrency(salesOrder.quoteId.totalAmount)}
                                </p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleCompleteStage(currentStage)}
                              disabled={workflowLoading}
                              className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                              {workflowLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowRight className="h-4 w-4" />
                              )}
                              {workflowLoading ? 'Processing...' : 'Complete & Create Invoice'}
                            </button>
                          </div>
                          
                          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="h-3 w-3" />
                              <span>Invoice will be auto-created with same items and amounts as quote</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quotation Tab */}
            {activeTab === 'quotation' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Quotation Details</h3>
                      <p className="text-sm text-gray-600">Associated quotation for this sales order</p>
                    </div>
                    {salesOrder.quoteId && (
                      <Link
                        href={`/quotes/${typeof salesOrder.quoteId === 'object' ? salesOrder.quoteId._id : salesOrder.quoteId}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Quote
                      </Link>
                    )}
                  </div>
                  
                  {salesOrder.quoteId ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quote Number</label>
                            <p className="text-gray-900 font-medium">
                              {typeof salesOrder.quoteId === 'object' 
                                ? salesOrder.quoteId.quoteNumber 
                                : `Quote #${salesOrder.quoteId.slice(-8)}`
                              }
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quote Status</label>
                            <p className="text-gray-900 font-medium">
                              {typeof salesOrder.quoteId === 'object' 
                                ? salesOrder.quoteId.status 
                                : 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
                              <p className="text-gray-900">
                                {typeof salesOrder.quoteId === 'object' 
                                  ? formatDate(salesOrder.quoteId.createdAt) 
                                  : 'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                              <p className="text-gray-900">
                                {typeof salesOrder.quoteId === 'object' 
                                  ? formatDate(salesOrder.quoteId.expiryDate) 
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quote Amount</label>
                              <p className="text-2xl font-bold text-blue-600">
                                {typeof salesOrder.quoteId === 'object' 
                                  ? formatCurrency(salesOrder.quoteId.totalAmount) 
                                  : 'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                              <p className="text-gray-900">
                                {typeof salesOrder.quoteId === 'object' && salesOrder.quoteId.expiryDate 
                                  ? `${Math.ceil((new Date(salesOrder.quoteId.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quotation Created</h3>
                      <p className="text-gray-600 mb-6">Create a quotation to proceed with this sales order.</p>
                      <button
                        onClick={() => handleCreateDocument('quote')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium"
                      >
                        <FilePlus className="h-4 w-4 inline mr-2" />
                        Create Quotation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Tab */}

            {activeTab === 'invoice' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
                      <p className="text-sm text-gray-600">
                        {salesOrder.invoiceId 
                          ? 'Invoice created from approved quote' 
                          : currentStage?.stage === 'quote'
                            ? 'Complete quote stage to auto-create invoice'
                            : 'Invoice will be created automatically'}
                      </p>
                    </div>
                    
                    {salesOrder.invoiceId ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/invoices/${typeof salesOrder.invoiceId === 'object' ? salesOrder.invoiceId._id : salesOrder.invoiceId}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Invoice
                        </Link>
                        
                        <button
                          onClick={() => router.push(`/invoices/${typeof salesOrder.invoiceId === 'object' ? salesOrder.invoiceId._id : salesOrder.invoiceId}/edit`)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Invoice
                        </button>
                        
                        <button
                          onClick={handleMarkInvoiceAsPaid}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Paid
                        </button>
                      </div>
                    ) : currentStage?.stage === 'quote' ? (
                      <button
                        onClick={() => handleCompleteStage(currentStage)}
                        disabled={workflowLoading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        {workflowLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Complete Quote & Create Invoice
                          </>
                        )}
                      </button>
                    ) : workflowLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Processing...</span>
                      </div>
                    ) : null}
                  </div>
                  
                  {salesOrder.invoiceId ? (
                    // SHOW THE CREATED INVOICE DETAILS
                    <div className="space-y-6">
                      {/* Invoice Header */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                          <p className="font-semibold text-lg text-blue-700">
                            {typeof salesOrder.invoiceId === 'object' 
                              ? salesOrder.invoiceId.invoiceNumber 
                              : 'INV-...'}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              (typeof salesOrder.invoiceId === 'object' ? salesOrder.invoiceId.status : 'draft') === 'paid' 
                                ? 'bg-green-500' 
                                : (typeof salesOrder.invoiceId === 'object' ? salesOrder.invoiceId.status : 'draft') === 'sent'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-500'
                            }`} />
                            <p className="font-semibold text-lg text-green-700 capitalize">
                              {typeof salesOrder.invoiceId === 'object' 
                                ? salesOrder.invoiceId.status 
                                : 'draft'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                          <p className="font-semibold text-lg text-purple-700">
                            {typeof salesOrder.invoiceId === 'object' 
                              ? formatCurrency(salesOrder.invoiceId.totalAmount)
                              : formatCurrency(salesOrder.totalAmount)}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-amber-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Due Date</p>
                          <p className="font-semibold text-lg text-amber-700">
                            {typeof salesOrder.invoiceId === 'object' && salesOrder.invoiceId.dueDate
                              ? formatDate(salesOrder.invoiceId.dueDate)
                              : formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                          </p>
                        </div>
                      </div>
                      
                      {/* Invoice Items */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Invoice Items</h4>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {/* Show invoice items if available, otherwise show sales order items */}
                              {((typeof salesOrder.invoiceId === 'object' && salesOrder.invoiceId.items) || salesOrder.lineItems)?.map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                              <tr>
                                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                                  Total
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                                  {typeof salesOrder.invoiceId === 'object' 
                                    ? formatCurrency(salesOrder.invoiceId.totalAmount)
                                    : formatCurrency(salesOrder.totalAmount)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                      
                      {/* Invoice Status Message */}
                      {typeof salesOrder.invoiceId === 'object' && salesOrder.invoiceId.status === 'draft' && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <div>
                              <p className="font-medium text-amber-800">Invoice is in draft status</p>
                              <p className="text-sm text-amber-700">
                                Review the invoice and mark it as sent to notify the customer.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : currentStage?.stage === 'quote' ? (
                    <div className="text-center py-12">
                      <ReceiptIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Not Created Yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Complete the quote stage to automatically generate an invoice from the approved quote.
                        The invoice will include all items and pricing from the quote.
                      </p>
                      <button
                        onClick={() => handleCompleteStage(currentStage)}
                        disabled={workflowLoading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50"
                      >
                        {workflowLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                            Creating Invoice...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 inline mr-2" />
                            Complete Quote & Create Invoice
                          </>
                        )}
                      </button>
                      
                      {workflowLoading && (
                        <div className="mt-4 text-sm text-gray-500">
                          This may take a few seconds. The page will refresh automatically.
                        </div>
                      )}
                    </div>
                  ) : currentStage?.stage === 'invoice' ? (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Stage Active</h3>
                        <p className="text-gray-600 mb-4">
                          You're currently on the invoice stage. An invoice should have been created.
                        </p>
                        <button
                          onClick={() => fetchSalesOrder()}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Check for Invoice
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Complete the current stage to proceed to invoice creation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Tab */}
            {activeTab === 'items' && salesOrder.lineItems && (
              <div className="space-y-6">
                {workflowLoading ? (
                  <SkeletonLoader.OrderDetails />
                ) : (
                  <>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                          <span className="text-sm text-gray-600">
                            {salesOrder.lineItems.length} item{salesOrder.lineItems.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {salesOrder.lineItems.map((item: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="text-sm text-gray-600">{item.description}</div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{item.quantity}</div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{formatCurrency(item.unitPrice)}</div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{formatCurrency(item.total)}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={4} className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                                Total
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-bold text-blue-600">
                                {formatCurrency(salesOrder.totalAmount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                            <p className="text-gray-900">{salesOrder.customer?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                            <p className="text-gray-900">{salesOrder.customer?.phone || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <p className="text-gray-900">{salesOrder.customer?.email || 'N/A'}</p>
                        </div>
                        
                        {salesOrder.customer?.address && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <p className="text-gray-900">{salesOrder.customer.address}</p>
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
                    
                    {/* Additional Documents Section */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Documents</h4>
                      {attachments.length > 0 ? (
                        <div className="space-y-3">
                          {attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <div>
                                  <p className="font-medium text-gray-900">{attachment.name}</p>
                                  <p className="text-xs text-gray-500">{attachment.type} • {formatDate(attachment.uploadedAt)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => window.open(attachment.url, '_blank')}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No additional documents attached.</p>
                      )}
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
                        <div className="text-center py-8">
                          <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No activity recorded yet.</p>
                        </div>
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
                        placeholder="Add a note about this sales order..."
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
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No notes yet. Add your first note above.</p>
                        </div>
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
                  {!modalStage.mandatory && (
                    <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 rounded-full font-semibold">
                      Optional Stage
                    </div>
                  )}
                  {modalStage.mandatory && (
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
                              <CheckCircle className="h-6 w-6" />
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