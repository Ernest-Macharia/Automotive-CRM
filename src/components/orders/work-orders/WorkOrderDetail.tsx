'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, ArrowLeft, Calendar, User, DollarSign, 
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
  CheckSquare
} from 'lucide-react';
import { workOrderService } from '@/services/workOrderService';
import { lifecycleIntegrationService, LifecycleStageUI } from '@/services/lifecycleIntegrationService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface WorkOrderDetailPageProps {
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

  const getStageActions = (stage: LifecycleStageUI) => {
    const actions = [];
    
    // Check if we have a real document, not just a stage marked as complete
    const hasRealDocument = stage.document && stage.document._id;
    
    if (hasRealDocument) {
      actions.push({
        id: 'view',
        label: 'View Document',
        icon: <Eye className="h-4 w-4" />,
        variant: 'primary'
      });
      
      // Show update option for certain stages that can be updated
      if (['jobcard', 'prechecklist', 'postchecklist'].includes(stage.stage)) {
        actions.push({
          id: 'update',
          label: 'Update',
          icon: <Edit className="h-4 w-4" />,
          variant: 'secondary'
        });
      }
    } else if (stage.isCurrent) {
      // Show create button if no document exists AND stage is not completed
      if (!stage.completed) {
        actions.push({
          id: 'create',
          label: 'Create Document',
          icon: <FilePlus className="h-4 w-4" />,
          variant: 'primary'
        });
      } else {
        // Stage is marked as complete but has no document - show create option
        actions.push({
          id: 'create',
          label: 'Create Document',
          icon: <FilePlus className="h-4 w-4" />,
          variant: 'warning'
        });
      }
      
      // Only show skip for waiver when no document exists
      if (stage.stage === 'waiver' && !hasRealDocument) {
        actions.push({
          id: 'skip',
          label: 'Skip Waiver',
          icon: <ArrowRight className="h-4 w-4" />,
          variant: 'warning'
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
    } else if (hasRealDocument) {
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
    if (stage.stage === 'waiver') {
      // Waiver can be marked complete even without document
      return true;
    }
    
    // Check if we have a real document (not just an ID from lifecycle)
    const hasRealDocument = stage.document && stage.document._id;
    
    if (!hasRealDocument) {
      return false;
    }
    
    switch (stage.stage) {
      case 'quote':
        return stage.document?.status === 'approved';
      case 'jobcard':
        return stage.document?.status === 'completed' || stage.document?.status === 'closed';
      case 'prechecklist':
      case 'postchecklist':
        return stage.document?.completed === true;
      case 'invoice':
        return stage.document?.status === 'sent' || stage.document?.status === 'paid';
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
          // Special action for job card to complete details
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
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    }
  };

  const handleMarkChecklistComplete = async (stage: WorkflowSidebarStage) => {
    try {
      if (!stage.documentId) {
        showToast('No checklist document found', 'error');
        return;
      }
      
      setWorkflowLoading(true);
      
      // Update the checklist document to mark as completed
      // You'll need to import your checklist service
      const checklistService = stage.stage === 'prechecklist' 
        ? require('@/services/preChecklistService') 
        : require('@/services/postChecklistService');
      
      await checklistService.markChecklistAsCompleted(stage.documentId, {
        completedBy: 'current-user-id', // You need to get this from auth context
        completedAt: new Date().toISOString(),
        notes: 'Marked complete from workflow'
      });
      
      // Then mark the stage as completed in lifecycle
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      await lifecycleIntegrationService.markStageAsCompleted(
        opportunityId, 
        stage.stage,
        { 
          documentId: stage.documentId,
          completedBy: 'current-user-id'
        }
      );
      
      showToast(`${stage.label} marked as completed`, 'success');
      fetchWorkOrder();
      
    } catch (error: any) {
      console.error('Error marking checklist complete:', error);
      showToast(error.message || 'Failed to mark checklist as complete', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleUpdateDocument = async (stage: WorkflowSidebarStage) => {
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
    handleCloseStageDetail();
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
    handleCloseStageDetail();
  };

  const handleViewDocument = async (stage: WorkflowSidebarStage) => {
    if (!stage.documentId) return;
    
    const route = stage.documentType === 'Job Card' ? 'job-cards' :
                 stage.documentType === 'Pre-Checklist' ? 'pre-checklist' :
                 stage.documentType === 'Post-Checklist' ? 'post-checklist' :
                 stage.documentType === 'Waiver' ? 'waivers' :
                 `${stage.documentType?.toLowerCase()}s`;
    
    router.push(`/${route}/${stage.documentId}`);
    handleCloseStageDetail();
  };

  const handleCompleteStage = async (stage: WorkflowSidebarStage) => {
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
      handleCloseStageDetail();
    } catch (error: any) {
      showToast(error.message || 'Failed to complete stage', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const validateStageCompletion = async (stage: WorkflowSidebarStage): Promise<boolean> => {
    const stagesRequiringDocuments = ['quote', 'jobcard', 'prechecklist', 'postchecklist', 'invoice'];
    
    if (stagesRequiringDocuments.includes(stage.stage) && !stage.document) {
      showToast('Please create the document first', 'warning');
      return false;
    }
    
    return true;
  };

  const handleSkipStage = async (stage: WorkflowSidebarStage) => {
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
        handleCloseStageDetail();
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

      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;

      if (!opportunityId) {
        showToast('Cannot move to next stage: No opportunity linked', 'error');
        return;
      }

      setWorkflowLoading(true);
      
      const currentStage = getCurrentStage();
      
      if (currentStage?.stage === 'waiver') {
        const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId, {
          skipValidation: true,
          metadata: { 
            waiverSkipped: !currentStage.document,
            reason: currentStage.document ? 'Waiver completed' : 'Waiver not required'
          }
        });
        
        if (result.success) {
          showToast(`Moved to ${result.currentStage} stage`, 'success');
          await fetchWorkOrder();
        }
        return;
      }
      
      // For non-waiver stages, check if document exists
      if (currentStage?.stage !== 'waiver' && !currentStage?.document) {
        showToast('Please create the document for current stage first', 'warning');
        setWorkflowLoading(false);
        return;
      }
      
      // Then check if stage is completed
      if (currentStage && !currentStage.completed) {
        showToast('Please complete the current stage first', 'warning');
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
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <p className="text-gray-600">Loading work order details...</p>
        </div>
      </div>
    );
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
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              <Link
                href={`/orders/work-orders/${workOrder._id}/edit`}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors relative"
                title="More actions"
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
                    <h2 className="font-semibold text-gray-900">Workflow Stages</h2>
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
                              {!stage.mandatory && stage.stage === 'waiver' && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                                  Optional
                                </span>
                              )}
                            </div>

                            {stage.completed ? (
                              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {stage.document ? 'Completed' : 'Skipped'}
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
                  { id: 'services', label: 'Services', icon: <Wrench className="h-4 w-4" /> },
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
                            <p className="text-sm text-gray-600">Total Cost</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                              {formatCurrency(
                                (workOrder.laborCost || 0) + 
                                (workOrder.partsCost || 0) + 
                                (workOrder.tax || 0) - 
                                (workOrder.discount || 0)
                              )}
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
                            <p className="text-sm text-gray-600">Time Spent</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                              {workOrder.actualHours || workOrder.estimatedHours || 0} hours
                            </h3>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <Clock className="h-6 w-6 text-green-600" />
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
                  
                  {selectedStage.stage === 'waiver' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
                      <HelpCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Optional</span>
                    </div>
                  )}
                  
                  {selectedStage.stage !== 'waiver' && !selectedStage.completed && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Required</span>
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
                    selectedStage.document && selectedStage.document._id
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedStage.document && selectedStage.document._id
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {selectedStage.document && selectedStage.document._id 
                            ? <FileCheck className="h-5 w-5" /> 
                            : <FileX className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedStage.document && selectedStage.document._id
                              ? 'Document Created' 
                              : 'No Document Yet'
                            }
                          </p>
                          {selectedStage.documentType && (
                            <p className="text-sm text-gray-600">{selectedStage.documentType}</p>
                          )}
                          {selectedStage.document && selectedStage.document._id && (
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {selectedStage.document._id.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedStage.document && selectedStage.document._id && (
                        <button
                          onClick={() => handleViewDocument(selectedStage)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View →
                        </button>
                      )}
                    </div>
                    
                    {/* Show warning if stage shows as having document but doesn't really have one */}
                    {selectedStage.document && !selectedStage.document._id && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Document Data Issue</p>
                            <p className="text-xs text-red-700 mt-1">
                              This stage appears to have a document, but no actual document exists. 
                              Please create the document to proceed.
                            </p>
                            <button
                              onClick={() => handleStageAction(selectedStage, 'create')}
                              className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Create Document
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
                        selectedStage.stage === 'waiver' 
                          ? 'text-amber-600' 
                          : 'text-blue-600'
                      }`}>
                        {selectedStage.stage === 'waiver' ? 'Optional' : 'Required'}
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
                      {!selectedStage.document && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'create')}
                          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                          <FilePlus className="h-5 w-5" />
                          Create {selectedStage.label} Document
                        </button>
                      )}

                      {selectedStage.document && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'view')}
                          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                          View {selectedStage.label} Document
                        </button>
                      )}

                      {/* CHECKLIST COMPLETE BUTTON - NEW */}
                      {(selectedStage.stage === 'prechecklist' || selectedStage.stage === 'postchecklist') && 
                      selectedStage.document && selectedStage.document._id && !selectedStage.document.completed && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'markChecklistComplete')}
                          disabled={workflowLoading}
                          className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors ${
                            workflowLoading
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                          }`}
                        >
                          {workflowLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckSquare className="h-5 w-5" />
                              Mark Checklist as Complete
                            </>
                          )}
                        </button>
                      )}

                      {/* JOB CARD COMPLETE DETAILS BUTTON - NEW */}
                      {selectedStage.stage === 'jobcard' && selectedStage.document && selectedStage.document._id && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'completeDetails')}
                          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 font-medium transition-colors"
                        >
                          <Wrench className="h-5 w-5" />
                          Complete Job Card Details
                        </button>
                      )}

                      {/* JOB CARD UPDATE BUTTON - NEW */}
                      {selectedStage.stage === 'jobcard' && selectedStage.document && selectedStage.document._id && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'update')}
                          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 font-medium transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                          Update Job Card
                        </button>
                      )}

                      {/* CHECKLIST UPDATE BUTTON - NEW */}
                      {(selectedStage.stage === 'prechecklist' || selectedStage.stage === 'postchecklist') && 
                      selectedStage.document && selectedStage.document._id && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'update')}
                          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 font-medium transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                          Update Checklist
                        </button>
                      )}

                      {/* MARK STAGE AS COMPLETE BUTTON */}
                      {(selectedStage.document || selectedStage.stage === 'waiver') && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'complete')}
                          disabled={workflowLoading}
                          className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors ${
                            workflowLoading
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
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
                              {selectedStage.stage === 'waiver' && !selectedStage.document 
                                ? 'Mark Waiver as Complete (Skipped)' 
                                : 'Mark Stage as Complete'
                              }
                            </>
                          )}
                        </button>
                      )}

                      {/* WAIVER SKIP BUTTON */}
                      {selectedStage.stage === 'waiver' && (
                        <button
                          onClick={() => handleStageAction(selectedStage, 'skip')}
                          disabled={workflowLoading}
                          className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors ${
                            workflowLoading
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700'
                          }`}
                        >
                          <ArrowRight className="h-5 w-5" />
                          Skip Waiver Stage
                        </button>
                      )}

                      {/* STAGE REQUIREMENT MESSAGE */}
                      {selectedStage.stage !== 'waiver' && !selectedStage.document && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700 text-center">
                            This stage is required. Please create the document to proceed.
                          </p>
                        </div>
                      )}

                      {/* QUICK WAIVER SKIP LINK */}
                      {selectedStage.stage === 'waiver' && !selectedStage.document && (
                        <div className="text-center pt-2">
                          <button
                            onClick={handleMoveToNextStage}
                            disabled={workflowLoading}
                            className={`inline-flex items-center gap-2 text-sm font-medium ${
                              workflowLoading
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-amber-600 hover:text-amber-800'
                            }`}
                          >
                            {workflowLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                Skip waiver and proceed to next stage →
                              </>
                            )}
                          </button>
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
                        {selectedStage.stage === 'waiver' 
                          ? 'Waiver is optional - you can skip or complete it' 
                          : 'Complete this stage to unlock next stage'}
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