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
      router.push('/work-orders');
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
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700';
      case 'in_progress': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700';
      case 'on_hold': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700';
      case 'completed': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700';
      case 'cancelled': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'in_progress': return <Wrench className="h-4 w-4" />;
      case 'on_hold': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!workOrder) {
    return null;
  }

  const totalCost = workOrder.laborCost + workOrder.partsCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/work-orders')}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{workOrder.workOrderNumber}</h1>
                <p className="text-green-100 text-sm">Work Order Details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/work-orders/${workOrder._id}/edit`)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Edit"
              >
                <Edit className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Print"
              >
                <Printer className="h-5 w-5 text-white" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  title="More actions"
                >
                  <MoreVertical className="h-5 w-5 text-white" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Share Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Work Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Work Order Summary</h2>
                    <p className="text-gray-500 text-sm">Order #{workOrder.workOrderNumber}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(workOrder.status)}`}>
                    {getStatusIcon(workOrder.status)}
                    <span className="capitalize">{workOrder.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-700">Schedule</h3>
                    </div>
                    <div className="space-y-2">
                      {workOrder.startDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span className="font-medium">{formatDate(workOrder.startDate)}</span>
                        </div>
                      )}
                      {workOrder.estimatedCompletionDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Completion:</span>
                          <span className="font-medium">{formatDate(workOrder.estimatedCompletionDate)}</span>
                        </div>
                      )}
                      {workOrder.actualCompletionDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Actual Completion:</span>
                          <span className="font-medium">{formatDate(workOrder.actualCompletionDate)}</span>
                        </div>
                      )}
                      {workOrder.estimatedHours && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Hours:</span>
                          <span className="font-medium">{workOrder.estimatedHours} hours</span>
                        </div>
                      )}
                      {workOrder.actualHours && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Actual Hours:</span>
                          <span className="font-medium">{workOrder.actualHours} hours</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-700">Cost Breakdown</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor Cost:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(workOrder.laborCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parts Cost:</span>
                        <span className="font-medium text-green-600">{formatCurrency(workOrder.partsCost)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-800">Total Cost:</span>
                        <span className="text-xl font-bold text-green-600">{formatCurrency(totalCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Vehicle Information */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                <h2 className="text-xl font-bold text-gray-800">Customer & Vehicle Info</h2>
              </div>
              
              <div className="p-6">
                {typeof workOrder.opportunityId === 'object' ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-teal-100">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{workOrder.opportunityId.customer.name}</h3>
                          <p className="text-gray-500">Customer</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Email</span>
                          </div>
                          <p className="text-gray-800">{workOrder.opportunityId.customer.email || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Phone</span>
                          </div>
                          <p className="text-gray-800">{workOrder.opportunityId.customer.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading customer information...</p>
                )}
              </div>
            </div>

            {/* Job Cards */}
            {workOrder.jobCards && workOrder.jobCards.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                  <h2 className="text-xl font-bold text-gray-800">Job Cards</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {workOrder.jobCards.map((jobCard, index) => (
                      <div key={index} className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">Job Card #{index + 1}</p>
                            <p className="text-sm text-gray-500">ID: {jobCard}</p>
                          </div>
                          <button
                            onClick={() => router.push(`/job-cards/${jobCard}`)}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm hover:from-green-600 hover:to-teal-700"
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
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/work-orders/${workOrder._id}/edit`)}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700 flex items-center justify-center gap-2"
                  >
                    <Edit className="h-5 w-5" />
                    Edit Work Order
                  </button>
                  
                  <button
                    onClick={() => window.print()}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Printer className="h-5 w-5" />
                    Print Order
                  </button>
                  
                  <button className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Download className="h-5 w-5" />
                    Download PDF
                  </button>
                  
                  {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
                    <button
                      onClick={async () => {
                        try {
                          const nextStatus = workOrder.status === 'draft' ? 'in_progress' :
                                           workOrder.status === 'in_progress' ? 'on_hold' :
                                           workOrder.status === 'on_hold' ? 'completed' :
                                           'cancelled';
                          await workOrderService.updateWorkOrderStatus(workOrder._id, nextStatus);
                          showToast(`Work order status updated to ${nextStatus.replace('_', ' ')}`, 'success');
                          fetchWorkOrder(workOrder._id);
                        } catch (error) {
                          console.error('Error updating status:', error);
                          showToast('Failed to update status', 'error');
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      {workOrder.status === 'draft' ? 'Start Work' :
                       workOrder.status === 'in_progress' ? 'Put on Hold' :
                       workOrder.status === 'on_hold' ? 'Mark as Complete' :
                       'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Assigned To */}
            {workOrder.assignedTo && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                  <h2 className="text-xl font-bold text-gray-800">Assigned To</h2>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      {typeof workOrder.assignedTo === 'object' ? (
                        <>
                          <h3 className="font-bold text-gray-800">
                            {workOrder.assignedTo.firstName} {workOrder.assignedTo.lastName}
                          </h3>
                          <p className="text-gray-500 text-sm">Technician</p>
                        </>
                      ) : (
                        <h3 className="font-bold text-gray-800">Technician ID: {workOrder.assignedTo}</h3>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Related Documents */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                <h2 className="text-xl font-bold text-gray-800">Related Documents</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Quote</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  {workOrder.waiverId && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Waiver</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  
                  {workOrder.invoiceId && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50">
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
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                  <h2 className="text-xl font-bold text-gray-800">Notes</h2>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-800">{workOrder.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}