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
  ClipboardCheck, ClipboardList, Car
} from 'lucide-react';
import { workOrderService } from '@/services/workOrderService';
import { lifecycleIntegrationService, LifecycleStageUI } from '@/services/lifecycleIntegrationService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import WorkOrderLifecycleVisualization from '@/components/orders/work-orders/WorkOrderLifecycleVisualization';

interface WorkOrderDetailPageProps {
  orderId: string;
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
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkOrder();
  }, [orderId, refreshKey]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const data = await workOrderService.getWorkOrderById(orderId);
      setWorkOrder(data);
      
      // Fetch lifecycle if opportunity exists
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
    } catch (error) {
      console.error('Error fetching lifecycle:', error);
    } finally {
      setLifecycleLoading(false);
    }
  };

  const handleWorkflowAction = async (action: string, stage?: string) => {
    try {
      if (!workOrder) return;
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) {
        showToast('Cannot perform action: No opportunity found', 'error');
        return;
      }
      
      switch (action) {
        case 'create-quote':
          router.push(`/quotes/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
          break;
          
        case 'create-waiver':
          router.push(`/waivers/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
          break;
          
        case 'create-jobcard':
          router.push(`/jobcards/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
          break;
          
        case 'create-prechecklist':
          router.push(`/prechecklists/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
          break;
          
        case 'create-postchecklist':
          router.push(`/postchecklists/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
          break;
          
        case 'create-invoice':
          router.push(`/invoices/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
          break;
          
        case 'transition':
          if (stage) {
            setWorkflowLoading(true);
            const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId);
            if (result.success) {
              showToast(`Moved to ${result.nextStage} stage`, 'success');
              fetchWorkOrder();
            }
          }
          break;
          
        case 'complete':
          showToast('Work order completed!', 'success');
          fetchWorkOrder();
          break;
          
        default:
          break;
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleStageAction = async (stage: LifecycleStageUI, action: string) => {
    try {
      if (!workOrder) return;
      
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      if (!opportunityId) {
        showToast('Cannot perform action: No opportunity found', 'error');
        return;
      }
      
      if (action === 'view' && stage.document) {
        const documentType = stage.documentType?.toLowerCase() || stage.stage;
        const route = documentType === 'job card' ? 'jobcards' :
                     documentType === 'pre-checklist' ? 'prechecklists' :
                     documentType === 'post-checklist' ? 'postchecklists' :
                     `${documentType}s`;
        router.push(`/${route}/${stage.documentId}`);
      } else if (action === 'create') {
        switch (stage.stage) {
          case 'quote':
            router.push(`/quotes/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
            break;
          case 'waiver':
            router.push(`/waivers/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
            break;
          case 'jobcard':
            router.push(`/jobcards/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
            break;
          case 'prechecklist':
            router.push(`/prechecklists/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
            break;
          case 'postchecklist':
            router.push(`/postchecklists/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
            break;
          case 'invoice':
            router.push(`/invoices/create?opportunityId=${opportunityId}&workOrderId=${workOrder._id}`);
            break;
        }
      } else if (action === 'transition') {
        setWorkflowLoading(true);
        const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId);
        if (result.success) {
          showToast(`Moved to ${result.nextStage} stage`, 'success');
          fetchWorkOrder();
        }
      } else if (action === 'skip') {
        const result = await lifecycleIntegrationService.transitionToNextStage(opportunityId, {
          skipValidation: true,
          metadata: { skippedStage: stage.stage }
        });
        if (result.success) {
          showToast(`Skipped ${stage.label} stage`, 'info');
          fetchWorkOrder();
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await workOrderService.updateWorkOrderStatus(orderId, newStatus);
      showToast(`Work order status updated to ${newStatus}`, 'success');
      fetchWorkOrder();
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const copyOrderNumber = () => {
    if (workOrder?.workOrderNumber) {
      navigator.clipboard.writeText(workOrder.workOrderNumber);
      showToast('Work order number copied to clipboard', 'success');
    }
  };

  const addNote = async () => {
    if (!notes.trim()) return;
    
    try {
      setAddingNote(true);
      // await workOrderService.addNoteToWorkOrder(orderId, notes);
      showToast('Note added successfully', 'success');
      setNotes('');
    } catch (error) {
      console.error('Error adding note:', error);
      showToast('Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handlePrint = () => {
    window.print();
    showToast('Print dialog opened', 'info');
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      showToast(`Exporting to ${format.toUpperCase()}...`, 'info');
      // Add export logic here
    } catch (error) {
      console.error('Error exporting:', error);
      showToast('Export failed', 'error');
    }
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
    return icons[stage] || <FileText className="h-5 w-5" />;
  };

  const getStageColor = (stage: LifecycleStageUI) => {
    if (stage.completed) return 'bg-green-50 border-green-200';
    if (stage.isCurrent) return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getStageTextColor = (stage: LifecycleStageUI) => {
    if (stage.completed) return 'text-green-700';
    if (stage.isCurrent) return 'text-blue-700';
    return 'text-gray-500';
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
  const opportunityId = typeof workOrder.opportunityId === 'object' 
    ? workOrder.opportunityId._id 
    : workOrder.opportunityId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-teal-600 to-blue-500 p-4 sm:p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/orders/work-orders')}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                aria-label="Back to list"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-white">{workOrder.workOrderNumber}</h1>
                  <button
                    onClick={copyOrderNumber}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Copy work order number"
                  >
                    <Copy className="h-3 w-3 text-white/80" />
                  </button>
                </div>
                <p className="text-blue-100 text-xs sm:text-sm">Work Order Details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                aria-label="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              
              {/* Share Button */}
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                  aria-label="Share"
                >
                  <Share2 className="h-5 w-5 text-white" />
                </button>
                
                {showShareMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowShareMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 animate-fade-in">
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                        <QrCode className="h-4 w-4" />
                        Generate QR Code
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                        <Mail className="h-4 w-4" />
                        Email Order
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* Start Workflow Button */}
              <button
                onClick={startWorkflow}
                disabled={workflowLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl ${
                  workflowLoading
                    ? 'bg-blue-400 text-white'
                    : 'bg-gradient-to-r from-white to-blue-50 text-blue-600 hover:shadow-lg transition-all duration-300'
                } shadow-sm`}
              >
                {workflowLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Start Workflow</span>
                    <span className="sm:hidden">Start</span>
                  </>
                )}
              </button>
              
              {/* Edit Button */}
              <Link
                href={`/orders/work-orders/${workOrder._id}/edit`}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                aria-label="Edit work order"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>
              
              {/* More Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                  aria-label="More actions"
                >
                  <MoreVertical className="h-5 w-5 text-white" />
                </button>
                
                {showActionsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActionsMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 animate-fade-in">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Quick Actions</span>
                      </div>
                      
                      {/* Status Change Options */}
                      <div className="px-3 py-2 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Change Status</span>
                        <div className="space-y-1">
                          {['draft', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((status) => (
                            status !== workOrder.status && (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 flex items-center gap-2 capitalize"
                              >
                                <div className={`w-2 h-2 rounded-full ${getStatusBadge(status).bg.split(' ')[0]}`}></div>
                                {status.replace('_', ' ')}
                              </button>
                            )
                          ))}
                        </div>
                      </div>
                      
                      {/* Export Options */}
                      <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                        <Download className="h-4 w-4" />
                        Export as PDF
                      </button>
                      <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                        <Download className="h-4 w-4" />
                        Export as Excel
                      </button>
                      <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                        <Printer className="h-4 w-4" />
                        Print Work Order
                      </button>
                      
                      {/* Danger Zone */}
                      <div className="border-t border-gray-200 mt-1 pt-1">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                          <Trash2 className="h-4 w-4" />
                          Delete Work Order
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.icon}
              <span className="text-xs font-medium capitalize">{workOrder.status.replace('_', ' ')}</span>
            </div>
            
            {workOrder.priority && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                workOrder.priority === 'high' ? 'bg-red-100 text-red-800' :
                workOrder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs font-medium capitalize">{workOrder.priority} Priority</span>
              </div>
            )}
            
            {workOrder.requiresApproval && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-800">
                <ShieldAlert className="h-3 w-3" />
                <span className="text-xs font-medium">Requires Approval</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-8 px-4 sm:px-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
              { id: 'workflow', label: 'Workflow', icon: <TrendingUp className="h-4 w-4" /> },
              { id: 'services', label: 'Services', icon: <Wrench className="h-4 w-4" /> },
              { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
              { id: 'activity', label: 'Activity', icon: <History className="h-4 w-4" /> },
              { id: 'notes', label: 'Notes', icon: <MessageSquare className="h-4 w-4" /> },
              { id: 'settings', label: 'Settings', icon: <SettingsIcon className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'activity' && activityLog.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {activityLog.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Visualization */}
            {activeTab === 'workflow' && opportunityId && (
              <WorkOrderLifecycleVisualization
                opportunityId={opportunityId}
                workOrderId={workOrder._id}
                mode="stepper"
                showStats={true}
              />
            )}

            {/* Overview Content */}
            {activeTab === 'overview' && (
              <>
                {/* Work Order Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Work Order Summary</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Last updated: {formatDateTime(workOrder.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Start Date</div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{formatDate(workOrder.startDate)}</span>
                            </div>
                          </div>
                          
                          {workOrder.estimatedCompletionDate && (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wider">Est. Completion</div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{formatDate(workOrder.estimatedCompletionDate)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {workOrder.actualCompletionDate && (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Actual Completion</div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium text-green-600">{formatDate(workOrder.actualCompletionDate)}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          {workOrder.estimatedHours && (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wider">Est. Hours</div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{workOrder.estimatedHours} hrs</span>
                              </div>
                            </div>
                          )}
                          
                          {workOrder.actualHours && (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wider">Actual Hours</div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-blue-600">{workOrder.actualHours} hrs</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Labor Cost</span>
                            <span className="font-medium">{formatCurrency(workOrder.laborCost || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Parts Cost</span>
                            <span className="font-medium">{formatCurrency(workOrder.partsCost || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-medium">{formatCurrency(workOrder.tax || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Discount</span>
                            <span className="font-medium text-red-600">-{formatCurrency(workOrder.discount || 0)}</span>
                          </div>
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-gray-900">Total Cost</span>
                              <span className="text-xl font-bold text-blue-600">
                                {formatCurrency(
                                  (workOrder.laborCost || 0) + 
                                  (workOrder.partsCost || 0) + 
                                  (workOrder.tax || 0) - 
                                  (workOrder.discount || 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push(`/quotes/create?workOrderId=${orderId}&source=work-order`)}
                    className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-left">Create Quote</h4>
                        <p className="text-xs text-gray-600 mt-1 text-left">Generate quote for this work</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push(`/jobcards/create?workOrderId=${orderId}`)}
                    className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                        <Wrench className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-left">Create Job Card</h4>
                        <p className="text-xs text-gray-600 mt-1 text-left">Create job card for technicians</p>
                      </div>
                    </div>
                  </button>

                  {workOrder.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange('on_hold')}
                      className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-yellow-300 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition-colors">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-left">Put on Hold</h4>
                          <p className="text-xs text-gray-600 mt-1 text-left">Temporarily pause work</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {workOrder.status === 'on_hold' && (
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                          <Wrench className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-left">Resume Work</h4>
                          <p className="text-xs text-gray-600 mt-1 text-left">Continue work progress</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {workOrder.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-left">Mark as Complete</h4>
                          <p className="text-xs text-gray-600 mt-1 text-left">Complete work order</p>
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/invoices/create?workOrderId=${orderId}`)}
                    className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                        <ReceiptIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-left">Create Invoice</h4>
                        <p className="text-xs text-gray-600 mt-1 text-left">Generate invoice for billing</p>
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
                  <h2 className="text-lg font-semibold text-gray-900">Services & Work Details</h2>
                </div>
                
                <div className="p-5">
                  {workOrder.jobCards && workOrder.jobCards.length > 0 ? (
                    <div className="space-y-4">
                      {workOrder.jobCards.map((jobCard: any, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Wrench className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">Job Card #{index + 1}</h4>
                                <p className="text-sm text-gray-600">ID: {jobCard}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/jobcards/${jobCard}`)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No job cards created yet</p>
                      <button
                        onClick={() => router.push(`/jobcards/create?workOrderId=${orderId}`)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Create Job Card →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Log */}
            {activeTab === 'activity' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
                </div>
                
                <div className="p-5">
                  {activityLog.length > 0 ? (
                    <div className="space-y-4">
                      {activityLog.map((activity, index) => (
                        <div key={activity._id || index} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === 'status_change' ? 'bg-blue-100' :
                              activity.type === 'note_added' ? 'bg-green-100' :
                              activity.type === 'document_created' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {activity.type === 'status_change' ? (
                                <RefreshCw className="h-4 w-4 text-blue-600" />
                              ) : activity.type === 'note_added' ? (
                                <MessageSquare className="h-4 w-4 text-green-600" />
                              ) : activity.type === 'document_created' ? (
                                <FileText className="h-4 w-4 text-purple-600" />
                              ) : (
                                <History className="h-4 w-4 text-gray-600" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDateTime(activity.timestamp)}
                              </span>
                              {activity.user && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-600">
                                    by {activity.user.name || activity.user.email}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No activity yet</p>
                      <p className="text-sm text-gray-400 mt-1">Actions will appear here as they happen</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                    <button
                      onClick={() => document.getElementById('note-input')?.focus()}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Note
                    </button>
                  </div>
                </div>
                
                <div className="p-5">
                  {/* Add Note Form */}
                  <div className="mb-6">
                    <textarea
                      id="note-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add a note about this work order..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={addNote}
                        disabled={!notes.trim() || addingNote}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          !notes.trim() || addingNote
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {addingNote ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </span>
                        ) : (
                          'Add Note'
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Notes List */}
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-gray-800">Initial work order created for vehicle service and maintenance.</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-600">System</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(workOrder.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {workOrder.notes && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-800">{workOrder.notes}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-600">Created with order</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(workOrder.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
                  {typeof workOrder.opportunityId === 'object' && workOrder.opportunityId.customer?._id && (
                    <Link
                      href={`/customers/${workOrder.opportunityId.customer._id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="p-5">
                {typeof workOrder.opportunityId === 'object' && workOrder.opportunityId.customer ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {workOrder.opportunityId.customer.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{workOrder.opportunityId.customer.name}</h3>
                        {workOrder.opportunityId.customer.companyName && (
                          <p className="text-sm text-gray-600">{workOrder.opportunityId.customer.companyName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {workOrder.opportunityId.customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{workOrder.opportunityId.customer.email}</span>
                        </div>
                      )}
                      
                      {workOrder.opportunityId.customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{workOrder.opportunityId.customer.phone}</span>
                        </div>
                      )}
                      
                      {workOrder.opportunityId.subject && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">Opportunity</div>
                          <p className="text-sm text-gray-700">{workOrder.opportunityId.subject}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Customer info not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Documents Card */}
            {lifecycle && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Related Documents</h2>
                </div>
                
                <div className="p-5">
                  <div className="space-y-3">
                    {lifecycle.stages
                      .filter((s: LifecycleStageUI) => s.document)
                      .map((stage: LifecycleStageUI) => (
                        <div 
                          key={stage.stage}
                          onClick={() => {
                            const route = stage.documentType === 'Job Card' ? 'jobcards' :
                                         stage.documentType === 'Pre-Checklist' ? 'prechecklists' :
                                         stage.documentType === 'Post-Checklist' ? 'postchecklists' :
                                         stage.documentType === 'Waiver' ? 'waivers' :
                                         `${stage.documentType?.toLowerCase()}s`;
                            router.push(`/${route}/${stage.documentId}`);
                          }}
                          className="group flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              stage.completed ? 'bg-green-100 text-green-600' :
                              stage.isCurrent ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {getStageIcon(stage.stage)}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                {stage.label}
                              </span>
                              {stage.document?.totalAmount && (
                                <p className="text-xs text-gray-500">
                                  {formatCurrency(stage.document.totalAmount)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                              #{stage.documentId?.slice(-6)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        </div>
                      ))}
                    
                    {lifecycle.stages.filter((s: LifecycleStageUI) => s.document).length === 0 && (
                      <div className="text-center py-6">
                        <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No documents created yet</p>
                        <p className="text-xs text-gray-400 mt-1">Start the workflow to create documents</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Information Card */}
            {workOrder.vehicleId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Information</h2>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Car className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      {typeof workOrder.vehicleId === 'object' ? (
                        <>
                          <h3 className="font-medium text-gray-900">
                            {workOrder.vehicleId.make} {workOrder.vehicleId.model}
                          </h3>
                          <p className="text-sm text-gray-600">{workOrder.vehicleId.registrationNumber}</p>
                        </>
                      ) : (
                        <h3 className="font-medium text-gray-900">Vehicle ID: {workOrder.vehicleId}</h3>
                      )}
                    </div>
                  </div>
                  
                  {typeof workOrder.vehicleId === 'object' && (
                    <div className="space-y-2 text-sm">
                      {workOrder.vehicleId.vin && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">VIN</span>
                          <span className="font-medium">{workOrder.vehicleId.vin}</span>
                        </div>
                      )}
                      {workOrder.vehicleId.year && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Year</span>
                          <span className="font-medium">{workOrder.vehicleId.year}</span>
                        </div>
                      )}
                      {workOrder.vehicleId.color && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color</span>
                          <span className="font-medium">{workOrder.vehicleId.color}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assigned To Card */}
            {workOrder.assignedTo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Assigned To</h2>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {typeof workOrder.assignedTo === 'object' 
                        ? `${workOrder.assignedTo.firstName?.charAt(0)}${workOrder.assignedTo.lastName?.charAt(0)}`
                        : 'T'}
                    </div>
                    <div>
                      {typeof workOrder.assignedTo === 'object' ? (
                        <>
                          <h3 className="font-medium text-gray-900">
                            {workOrder.assignedTo.firstName} {workOrder.assignedTo.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">Technician</p>
                        </>
                      ) : (
                        <h3 className="font-medium text-gray-900">Technician ID: {workOrder.assignedTo}</h3>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Work Order Metadata Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Work Order Details</h2>
              </div>
              
              <div className="p-5 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Created</div>
                    <div className="font-medium">{formatDateTime(workOrder.createdAt)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Last Updated</div>
                    <div className="font-medium">{formatDateTime(workOrder.updatedAt)}</div>
                  </div>
                </div>
                
                {workOrder.workOrderType && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Work Type</div>
                    <div className="font-medium">{workOrder.workOrderType}</div>
                  </div>
                )}
                
                {workOrder.priority && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Priority</div>
                    <div className="font-medium capitalize">{workOrder.priority}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}