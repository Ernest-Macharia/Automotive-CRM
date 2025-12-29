'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, ArrowLeft, Calendar, User, DollarSign, 
  Clock, Users, CheckCircle, AlertCircle,
  Edit, Printer, Download, Share2, MoreVertical,
  FileText, Phone, Mail,
  ChevronRight, Sparkles
} from 'lucide-react';
import { workOrderService, WorkOrder } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface WorkOrderDetailProps {
  orderId: string;
}

export default function WorkOrderDetail({ orderId }: WorkOrderDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchWorkOrder(orderId);
    }
  }, [orderId]);

  const fetchWorkOrder = async (id: string) => {
    try {
      setLoading(true);
      const data = await workOrderService.getWorkOrderById(id);
      setWorkOrder(data);
    } catch (error) {
      console.error('Error fetching work order:', error);
      showToast('Failed to load work order details', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
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
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
      draft: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        icon: <FileText className="h-4 w-4" /> 
      },
      in_progress: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        icon: <Wrench className="h-4 w-4" /> 
      },
      on_hold: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        icon: <Clock className="h-4 w-4" /> 
      },
      completed: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: <CheckCircle className="h-4 w-4" /> 
      },
      cancelled: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: <AlertCircle className="h-4 w-4" /> 
      }
    };
    return configs[status] || configs.draft;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!workOrder) {
    return null;
  }

  const totalCost = (workOrder.laborCost || 0) + (workOrder.partsCost || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🟢🟦 Header — Preserved your green-to-teal theme */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/orders/work-orders')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Back to list"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">{workOrder.workOrderNumber}</h1>
                <p className="text-green-100 text-xs sm:text-sm">Work Order Details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/orders/work-orders/${workOrder._id}/edit`)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                aria-label="Edit work order"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                aria-label="Print work order"
              >
                <Printer className="h-5 w-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  aria-haspopup="true"
                  aria-expanded={showActions}
                  aria-label="More actions"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                
                {showActions && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActions(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <button 
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => setShowActions(false)}
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </button>
                      <button 
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => setShowActions(false)}
                      >
                        <Share2 className="h-4 w-4" />
                        Share Order
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Work Order Summary */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Work Order Summary</h2>
                    <p className="text-sm text-gray-500">Order #{workOrder.workOrderNumber}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusConfig(workOrder.status).bg} ${getStatusConfig(workOrder.status).text}`}>
                    {getStatusConfig(workOrder.status).icon}
                    <span className="capitalize">{workOrder.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-700">Schedule</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      {workOrder.startDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date</span>
                          <span className="font-medium">{formatDate(workOrder.startDate)}</span>
                        </div>
                      )}
                      {workOrder.estimatedCompletionDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Completion</span>
                          <span className="font-medium">{formatDate(workOrder.estimatedCompletionDate)}</span>
                        </div>
                      )}
                      {workOrder.actualCompletionDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Actual Completion</span>
                          <span className="font-medium">{formatDate(workOrder.actualCompletionDate)}</span>
                        </div>
                      )}
                      {workOrder.estimatedHours && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Hours</span>
                          <span className="font-medium">{workOrder.estimatedHours} hrs</span>
                        </div>
                      )}
                      {workOrder.actualHours && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Actual Hours</span>
                          <span className="font-medium">{workOrder.actualHours} hrs</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-700">Cost Breakdown</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor Cost</span>
                        <span className="font-medium text-blue-600">{formatCurrency(workOrder.laborCost || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parts Cost</span>
                        <span className="font-medium text-green-600">{formatCurrency(workOrder.partsCost || 0)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-200">
                        <span className="font-bold text-gray-900">Total Cost</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(totalCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Vehicle Information */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Customer & Vehicle Info</h2>
              </div>
              
              <div className="p-5">
                {typeof workOrder.opportunityId === 'object' ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 text-base">
                        {workOrder.opportunityId.customer?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {workOrder.opportunityId.customer?.name || 'Customer'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">Email</span>
                        </div>
                        <p className="truncate">{workOrder.opportunityId.customer?.email || '—'}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">Phone</span>
                        </div>
                        <p>{workOrder.opportunityId.customer?.phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Customer info not available</p>
                )}
              </div>
            </div>

            {/* Job Cards */}
            {workOrder.jobCards && workOrder.jobCards.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Job Cards</h2>
                </div>
                
                <div className="p-5">
                  <div className="space-y-3">
                    {workOrder.jobCards.map((jobCard, index) => (
                      <div key={index} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Job Card #{index + 1}</p>
                            <p className="text-xs text-gray-500">ID: {jobCard}</p>
                          </div>
                          <button
                            onClick={() => router.push(`/job-cards/${jobCard}`)}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              </div>
              
              <div className="p-5 space-y-3">
                <button
                  onClick={() => router.push(`/orders/work-orders/${workOrder._id}/edit`)}
                  className="w-full px-4 py-2.5 text-left rounded-lg border border-gray-300 hover:border-green-300 hover:bg-green-50 transition-colors text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-gray-600" />
                    Edit Work Order
                  </div>
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-2.5 text-left rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4 text-gray-600" />
                    Print Order
                  </div>
                </button>
                
                <button className="w-full px-4 py-2.5 text-left rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-gray-600" />
                    Download PDF
                  </div>
                </button>
                
                {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
                  <button
                    onClick={async () => {
                      if (!workOrder._id) {
                        showToast('Cannot update status: Work order ID is missing', 'error');
                        return;
                      }
                      
                      try {
                        const nextStatus = workOrder.status === 'draft' ? 'in_progress' :
                                          workOrder.status === 'in_progress' ? 'on_hold' :
                                          workOrder.status === 'on_hold' ? 'completed' :
                                          'cancelled';
                        await workOrderService.updateWorkOrderStatus(workOrder._id, nextStatus);
                        showToast(`Work order status updated to ${nextStatus.replace('_', ' ')}`, 'success');
                        fetchWorkOrder(workOrder._id);
                        setShowActions(false);
                      } catch (error) {
                        console.error('Error updating status:', error);
                        showToast('Failed to update status', 'error');
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left rounded-lg border border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      {workOrder.status === 'draft' ? 'Start Work' :
                       workOrder.status === 'in_progress' ? 'Put on Hold' :
                       workOrder.status === 'on_hold' ? 'Mark as Complete' :
                       'Cancel Order'}
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Assigned To */}
            {workOrder.assignedTo && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Assigned To</h2>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
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

            {/* Related Documents */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Related Documents</h2>
              </div>
              
              <div className="p-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Quote</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  {workOrder.waiverId && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Waiver</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  
                  {workOrder.invoiceId && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Invoice</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {workOrder.notes && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                </div>
                
                <div className="p-5">
                  <p className="text-gray-800 text-sm">{workOrder.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}