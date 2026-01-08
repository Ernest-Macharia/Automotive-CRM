// src/app/orders/sales-orders/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Download as DownloadIcon, Upload as UploadIcon
} from 'lucide-react';
import { salesOrderService } from '@/services/salesOrderService';
import { lifecycleIntegrationService, LifecycleStageUI } from '@/services/lifecycleIntegrationService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface SalesOrderDetailPageProps {
  orderId: string;
}

interface WorkflowSidebarStage {
  id: string;
  stage: string;
  label: string;
  description?: string;
  completed: boolean;
  isCurrent: boolean;
  document?: any;
  documentId?: string;
  documentType?: string;
  actions: Array<{ id: string; label: string; icon: React.ReactNode; variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' }>;
  requirements?: string[];
  completionDate?: string;
  icon: React.ReactNode;
  mandatory: boolean;
  estimatedTime: string;
  dependencies?: string[];
  canSkip: boolean;
}

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
  const [selectedStage, setSelectedStage] = useState<WorkflowSidebarStage | null>(null);
  const [showStageDetail, setShowStageDetail] = useState(false);
  const [workflowStages, setWorkflowStages] = useState<WorkflowSidebarStage[]>([]);
  const [workflowProgress, setWorkflowProgress] = useState({
    percentage: 0,
    completed: 0,
    total: 0,
    estimatedTime: '0 hours'
  });

  useEffect(() => {
    fetchSalesOrder();
  }, [orderId, refreshKey]);

  const fetchSalesOrder = async () => {
    try {
      setLoading(true);
      const data = await salesOrderService.getSalesOrderById(orderId);
      setSalesOrder(data);
      
      if (data.opportunityId) {
        fetchLifecycle(data);
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
        const transformedStages = transformLifecycleToSidebarStages(lifecycleData.stages);
        setWorkflowStages(transformedStages);
        
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

  const transformLifecycleToSidebarStages = (stages: LifecycleStageUI[]): WorkflowSidebarStage[] => {
    return stages.map((stage, index) => ({
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
      actions: getStageActions(stage),
      requirements: getStageRequirements(stage),
      completionDate: stage.completedAt || stage.completionDate,
      mandatory: stage.mandatory || stage.required || true,
      estimatedTime: getStageTimeEstimate(stage.stage),
      dependencies: stage.dependencies || [],
      canSkip: stage.canSkip || stage.skippable || false
    }));
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

  const getStageActions = (stage: LifecycleStageUI) => {
    const actions = [];
    
    if (stage.completed && stage.document) {
      actions.push({
        id: 'view',
        label: 'View Document',
        icon: <Eye className="h-4 w-4" />,
        variant: 'primary'
      });
      
      // Show update option for certain stages that can be updated
      if (stage.stage === 'quote') {
        actions.push({
          id: 'update',
          label: 'Update Quote',
          icon: <Edit className="h-4 w-4" />,
          variant: 'secondary'
        });
      }
    } else if (stage.isCurrent) {
      // Show create button if no document exists
      if (!stage.document) {
        actions.push({
          id: 'create',
          label: 'Create Document',
          icon: <FilePlus className="h-4 w-4" />,
          variant: 'primary'
        });
      } else {
        // Show update button if document exists but stage isn't completed
        actions.push({
          id: 'update',
          label: 'Update Document',
          icon: <Edit className="h-4 w-4" />,
          variant: 'primary'
        });
      }
      
      // Show complete button only if stage is ready to be completed
      if (isStageReadyForCompletion(stage)) {
        actions.push({
          id: 'complete',
          label: 'Mark Complete',
          icon: <CheckCircle className="h-4 w-4" />,
          variant: 'success'
        });
      }
    } else if (stage.document) {
      // For non-current stages with documents
      actions.push({
        id: 'view',
        label: 'View Document',
        icon: <Eye className="h-4 w-4" />,
        variant: 'secondary'
      });
    }
    
    return actions;
  };

  const isStageReadyForCompletion = (stage: LifecycleStageUI): boolean => {
    // All sales order stages need a document to be completed
    if (!stage.document) {
      return false;
    }
    
    // Check stage-specific completion criteria
    switch (stage.stage) {
      case 'quote':
        return stage.document?.status === 'approved';
      case 'invoice':
        return stage.document?.status === 'sent' || stage.document?.status === 'paid';
      case 'delivery':
        // Delivery is complete when the sales order is marked as delivered
        return salesOrder?.status === 'delivered';
      default:
        return !!stage.document;
    }
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

  const calculateEstimatedTime = (stages: LifecycleStageUI[]): string => {
    const stageEstimates: Record<string, number> = {
      'quote': 1,
      'invoice': 0.5,
      'payment': 0.5,
      'delivery': 2, // Days, not hours
      'completion': 0.25
    };
    
    const totalDays = stages.reduce((total, stage) => {
      return total + (stageEstimates[stage.stage] || 1);
    }, 0);
    
    return `${totalDays} days`;
  };

  const getCurrentStage = (): WorkflowSidebarStage | undefined => {
    return workflowStages.find(stage => stage.isCurrent);
  };

  const canMoveToNextStage = (): boolean => {
    const currentStage = getCurrentStage();
    if (!currentStage) return false;
    
    if (!currentStage.completed) return false;
    
    const currentIndex = workflowStages.findIndex(stage => stage.id === currentStage.id);
    return currentIndex < workflowStages.length - 1;
  };

  const canMoveToPreviousStage = (): boolean => {
    const currentStage = getCurrentStage();
    if (!currentStage) return false;
    
    const currentIndex = workflowStages.findIndex(stage => stage.id === currentStage.id);
    return currentIndex > 0;
  };

  const handleStageClick = (stage: WorkflowSidebarStage) => {
    setSelectedStage(stage);
    setShowStageDetail(true);
  };

  const handleCloseStageDetail = () => {
    setShowStageDetail(false);
    setSelectedStage(null);
  };

  const handleStageAction = async (stage: WorkflowSidebarStage, actionId: string) => {
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
          if (stage.documentId) {
            await handleViewDocument(stage);
          }
          break;
        case 'complete':
          await handleCompleteStage(stage);
          break;
        case 'update':
          await handleUpdateDocument(stage);
          break;
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    }
  };

  const handleUpdateDocument = async (stage: WorkflowSidebarStage) => {
    if (!stage.documentId) {
      await handleCreateDocument(stage.stage);
      return;
    }
    
    const route = stage.documentType === 'Quote' ? 'quotes' :
                 stage.documentType === 'Invoice' ? 'invoices' :
                 `${stage.documentType?.toLowerCase()}s`;
    
    router.push(`/${route}/${stage.documentId}/edit`);
    handleCloseStageDetail();
  };

  const handleCreateDocument = async (stageType: string) => {
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
    handleCloseStageDetail();
  };

  const handleViewDocument = async (stage: WorkflowSidebarStage) => {
    if (!stage.documentId) return;
    
    const route = stage.documentType === 'Quote' ? 'quotes' :
                 stage.documentType === 'Invoice' ? 'invoices' :
                 `${stage.documentType?.toLowerCase()}s`;
    
    router.push(`/${route}/${stage.documentId}`);
    handleCloseStageDetail();
  };

  const handleCompleteStage = async (stage: WorkflowSidebarStage) => {
    try {
      const opportunityId = typeof salesOrder.opportunityId === 'object' 
        ? salesOrder.opportunityId._id 
        : salesOrder.opportunityId;
      
      if (!opportunityId) return;
      
      const isValid = await validateStageCompletion(stage);
      if (!isValid) return;
      
      setWorkflowLoading(true);
      await lifecycleIntegrationService.markStageAsCompleted(
        opportunityId, 
        stage.stage,
        { documentId: stage.documentId }
      );
      
      showToast(`${stage.label} marked as completed`, 'success');
      fetchSalesOrder();
      handleCloseStageDetail();
    } catch (error: any) {
      showToast(error.message || 'Failed to complete stage', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const validateStageCompletion = async (stage: WorkflowSidebarStage): Promise<boolean> => {
    // Check if document exists for stages that require it
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

  const handleMoveToNextStage = async () => {
    try {
      if (!salesOrder) {
        showToast('No sales order found', 'error');
        return;
      }

      const opportunityId = typeof salesOrder.opportunityId === 'object' 
        ? salesOrder.opportunityId._id 
        : salesOrder.opportunityId;

      if (!opportunityId) {
        showToast('Cannot move to next stage: No opportunity linked', 'error');
        return;
      }

      setWorkflowLoading(true);
      
      const currentStage = getCurrentStage();
      
      // Check completion for all stages
      if (currentStage && !currentStage.completed) {
        showToast('Please complete the current stage first', 'warning');
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

  const handleMoveToPreviousStage = async () => {
    try {
      const currentStage = getCurrentStage();
      if (!currentStage) return;
      
      const currentIndex = workflowStages.findIndex(stage => stage.id === currentStage.id);
      if (currentIndex <= 0) return;
      
      const previousStage = workflowStages[currentIndex - 1];
      
      const opportunityId = typeof salesOrder.opportunityId === 'object' 
        ? salesOrder.opportunityId._id 
        : salesOrder.opportunityId;
      
      if (!opportunityId) return;
      
      setWorkflowLoading(true);
      await lifecycleIntegrationService.moveToStage(
        opportunityId,
        previousStage.stage,
        { reason: 'Manual navigation back' }
      );
      
      showToast(`Moved back to ${previousStage.label}`, 'info');
      fetchSalesOrder();
    } catch (error: any) {
      showToast(error.message || 'Failed to move back', 'error');
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
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

  const getStageStatusColor = (stage: WorkflowSidebarStage) => {
    if (stage.completed) return 'text-green-600 bg-green-50 border-green-200';
    if (stage.isCurrent) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-500 bg-gray-50 border-gray-200';
  };

  const getStageStatusIcon = (stage: WorkflowSidebarStage) => {
    if (stage.completed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (stage.isCurrent) return <CircleDot className="h-4 w-4 text-blue-500 animate-pulse" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  // Skeleton Loading Components
  const SkeletonHeader = () => (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonSidebar = () => (
    <div className="animate-pulse h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4">
          <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
          <div className="h-2 w-full bg-gray-300 rounded-full mb-2"></div>
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-gray-300 rounded"></div>
            <div className="h-3 w-16 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SkeletonTabContent = () => (
    <div className="animate-pulse space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Stage Card */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border border-gray-300 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
            <div>
              <div className="h-6 w-48 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-64 bg-gray-300 rounded mb-4"></div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-16 bg-gray-300 rounded"></div>
                <div className="h-4 w-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
          <div className="w-24 h-10 bg-gray-300 rounded-lg"></div>
        </div>
      </div>

      {/* Additional Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading sales order details...</p>
        </div>
      </div>
    );
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
      {/* Header with Blue to Purple Gradient */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 p-4 sm:p-6 shadow-lg relative overflow-hidden">
        {/* Animated background elements */}
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
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.icon}
                      <span className="text-xs font-medium capitalize">{salesOrder.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/90">Sales Order • Created {formatDate(salesOrder.createdAt)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              <Link
                href={`/orders/sales-orders/${salesOrder._id}/edit`}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors relative"
              >
                <MoreVertical className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex h-[calc(100vh-88px)]">
        {/* Workflow Sidebar - Compact View */}
        <div className="w-80 bg-white border-r border-gray-200">
          {lifecycleLoading ? (
            <SkeletonSidebar />
          ) : (
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">Sales Workflow</h2>
                    <p className="text-sm text-gray-600">Click any stage for details</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startWorkflow}
                      disabled={workflowLoading || lifecycle}
                      className={`p-2 rounded-lg ${
                        workflowLoading || lifecycle
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title="Start Workflow"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Overview */}
                <div className="mt-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-bold text-blue-600">{workflowProgress.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${workflowProgress.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{workflowProgress.completed} of {workflowProgress.total} stages</span>
                      <span>~{workflowProgress.estimatedTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stages List - Full Height Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {workflowStages.map((stage) => (
                    <div
                      key={stage.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${getStageStatusColor(stage)}`}
                      onClick={() => handleStageClick(stage)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-lg ${
                            stage.completed 
                              ? 'bg-green-100 text-green-600' 
                              : stage.isCurrent 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-gray-100 text-gray-400'
                          }`}>
                            {stage.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{stage.label}</h3>
                              {getStageStatusIcon(stage)}
                            </div>
                            {stage.isCurrent && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {stage.estimatedTime}
                              </span>
                              {!stage.mandatory && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                                  Optional
                                </span>
                              )}
                            </div>
                            
                            {stage.completed ? (
                              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {stage.document ? 'Document ready' : 'No document'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleMoveToPreviousStage}
                    disabled={!canMoveToPreviousStage() || workflowLoading}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium ${
                      canMoveToPreviousStage() && !workflowLoading
                        ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={handleMoveToNextStage}
                    disabled={!canMoveToNextStage() || workflowLoading}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium ${
                      canMoveToNextStage() && !workflowLoading
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    Stage {workflowStages.findIndex(s => s.isCurrent) + 1} of {workflowStages.length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
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

          {/* Tab Content */}
          <div className="p-6">
            {lifecycleLoading ? (
              <SkeletonTabContent />
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                              {formatCurrency(salesOrder.totalAmount)}
                            </h3>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Order Status</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1 capitalize">
                              {salesOrder.status}
                            </h3>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            {statusConfig.icon}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Workflow Progress</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                              {workflowProgress.percentage}%
                            </h3>
                          </div>
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Stage Card */}
                    {currentStage && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                              {currentStage.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{currentStage.label}</h3>
                                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                                  Current Stage
                                </span>
                              </div>
                              <p className="text-gray-600 mb-4">{currentStage.description}</p>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-700">{currentStage.estimatedTime}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {currentStage.mandatory ? (
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <HelpCircle className="h-4 w-4 text-green-500" />
                                  )}
                                  <span className="text-sm text-gray-700">
                                    {currentStage.mandatory ? 'Required' : 'Optional'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleStageClick(currentStage)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Order Details Card */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                      </div>
                      
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Order Date</div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{formatDate(salesOrder.orderDate)}</span>
                                </div>
                              </div>
                              
                              {salesOrder.estimatedDeliveryDate && (
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500 uppercase tracking-wider">Est. Delivery</div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{formatDate(salesOrder.estimatedDeliveryDate)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {salesOrder.actualDeliveryDate && (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Actual Delivery</div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="font-medium text-green-600">{formatDate(salesOrder.actualDeliveryDate)}</span>
                                </div>
                              </div>
                            )}
                            
                            {salesOrder.paymentTerms && (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Payment Terms</div>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{salesOrder.paymentTerms}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatCurrency(salesOrder.subtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-medium">{formatCurrency(salesOrder.tax || 0)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium">{formatCurrency(salesOrder.shipping || 0)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Discount</span>
                                <span className="font-medium text-red-600">-{formatCurrency(salesOrder.discount || 0)}</span>
                              </div>
                              <div className="pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-bold text-gray-900">Total</span>
                                  <span className="text-xl font-bold text-blue-600">{formatCurrency(salesOrder.totalAmount)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'items' && salesOrder.lineItems && (
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
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stage Detail Drawer/Modal */}
      {showStageDetail && selectedStage && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={handleCloseStageDetail}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-[500px] bg-white z-50 shadow-2xl transform transition-transform duration-300">
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedStage.completed 
                        ? 'bg-green-100 text-green-600' 
                        : selectedStage.isCurrent 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {selectedStage.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedStage.label}</h2>
                      <p className="text-sm text-gray-600">Stage Details</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseStageDetail}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                {/* Stage Status */}
                <div className="mt-4 flex items-center gap-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    selectedStage.completed 
                      ? 'bg-green-100 text-green-800' 
                      : selectedStage.isCurrent 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getStageStatusIcon(selectedStage)}
                    <span className="text-sm font-medium">
                      {selectedStage.completed ? 'Completed' : selectedStage.isCurrent ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                  
                  {selectedStage.mandatory ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Required</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
                      <HelpCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Optional</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
                  <p className="text-gray-700">{selectedStage.description || 'No description available.'}</p>
                </div>

                {/* Document Status */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Document Status</h3>
                  <div className={`p-4 rounded-lg ${
                    selectedStage.document 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedStage.document ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {selectedStage.document ? <FileCheck className="h-5 w-5" /> : <FileX className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedStage.document ? 'Document Created' : 'No Document Yet'}
                          </p>
                          {selectedStage.documentType && (
                            <p className="text-sm text-gray-600">{selectedStage.documentType}</p>
                          )}
                        </div>
                      </div>
                      {selectedStage.document && selectedStage.documentId && (
                        <button
                          onClick={() => handleViewDocument(selectedStage)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View →
                        </button>
                      )}
                    </div>
                    
                    {/* Warning for stages without document */}
                    {!selectedStage.document && !selectedStage.completed && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Document Required</p>
                            <p className="text-xs text-blue-700 mt-1">
                              This stage requires a document to be created before proceeding.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                {selectedStage.requirements && selectedStage.requirements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Requirements</h3>
                    <ul className="space-y-2">
                      {selectedStage.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          <span className="text-sm text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stage Information */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Stage Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Estimated Time</p>
                      <p className="font-medium text-gray-900">{selectedStage.estimatedTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <p className={`font-medium ${
                        selectedStage.mandatory ? 'text-blue-600' : 'text-amber-600'
                      }`}>
                        {selectedStage.mandatory ? 'Required' : 'Optional'}
                      </p>
                    </div>
                    {selectedStage.completionDate && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Completed On</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedStage.completionDate)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Stage Actions - Only show for current stage */}
                {selectedStage.isCurrent && !selectedStage.completed && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Actions</h3>
                    <div className="space-y-3">
                      {/* Create Document Button - Show if no document */}
                      {!selectedStage.document && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'create')}
                          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                          <FilePlus className="h-5 w-5" />
                          Create {selectedStage.label} Document
                        </button>
                      )}

                      {/* View Document Button - Show if document exists */}
                      {selectedStage.document && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'view')}
                          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                          View {selectedStage.label} Document
                        </button>
                      )}

                      {/* Complete Stage Button - Show if document exists */}
                      {selectedStage.document && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'complete')}
                          disabled={workflowLoading}
                          className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors ${
                            workflowLoading
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {workflowLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5" />
                              Mark Stage as Complete
                            </>
                          )}
                        </button>
                      )}

                      {/* Special message for stages without document */}
                      {!selectedStage.document && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700 text-center">
                            This stage is required. Please create the document to proceed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Actions for All Stages */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Stage Navigation</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleMoveToPreviousStage}
                      disabled={!canMoveToPreviousStage() || workflowLoading}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium ${
                        canMoveToPreviousStage() && !workflowLoading
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                      Previous Stage
                    </button>
                    <button
                      onClick={handleMoveToNextStage}
                      disabled={!canMoveToNextStage() || workflowLoading}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium ${
                        canMoveToNextStage() && !workflowLoading
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next Stage
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {selectedStage.isCurrent && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-500">
                        Complete this stage to unlock next stage
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Stage {workflowStages.findIndex(s => s.id === selectedStage.id) + 1} of {workflowStages.length}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Print"
                    >
                      <Printer className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedStage.label)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Copy Stage Name"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
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