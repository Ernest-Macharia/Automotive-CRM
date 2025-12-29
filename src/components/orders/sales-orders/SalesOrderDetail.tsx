'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, ArrowLeft, Calendar, User, DollarSign, 
  Edit, Printer, Download, MapPin, Phone, Mail,
  Building, CheckCircle, Truck, Package, Clock,
  Play, FileText, CreditCard, Loader2
} from 'lucide-react';
import { salesOrderService } from '@/services/salesOrderService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface SalesOrderDetailProps {
  orderId: string;
}

export default function SalesOrderDetailPage({ orderId }: SalesOrderDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [salesOrder, setSalesOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  useEffect(() => {
    fetchSalesOrder();
  }, [orderId]);

  const fetchSalesOrder = async () => {
    try {
      setLoading(true);
      const data = await salesOrderService.getSalesOrderById(orderId);
      setSalesOrder(data);
    } catch (error) {
      console.error('Error fetching sales order:', error);
      showToast('Failed to load sales order details', 'error');
      router.push('/orders/sales-orders');
    } finally {
      setLoading(false);
    }
  };

  const startWorkflow = async () => {
    try {
      setWorkflowLoading(true);
      router.push(`/quotes/create?orderId=${orderId}&source=sales-order`);
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
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!salesOrder) return null;

  // Helper: Get status badge
  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    return config[status] || config.draft;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔵🟣 Header — Preserved */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/orders/sales-orders')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Back to list"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">{salesOrder.salesOrderNumber}</h1>
                <p className="text-blue-100 text-xs sm:text-sm">Sales Order Details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={startWorkflow}
                disabled={workflowLoading}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  workflowLoading
                    ? 'bg-blue-400 text-white'
                    : 'bg-white text-blue-600 hover:bg-gray-100'
                }`}
              >
                {workflowLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Create Quote
                  </>
                )}
              </button>
              
              <Link
                href={`/orders/sales-orders/${salesOrder._id}/edit`}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                aria-label="Edit order"
              >
                <Edit className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(salesOrder.status).bg} ${getStatusBadge(salesOrder.status).text}`}>
                    {salesOrder.status.replace('_', ' ').charAt(0).toUpperCase() + salesOrder.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Date</span>
                      <span className="text-sm font-medium">{formatDate(salesOrder.orderDate)}</span>
                    </div>
                    {salesOrder.estimatedDeliveryDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Est. Delivery</span>
                        <span className="text-sm font-medium">{formatDate(salesOrder.estimatedDeliveryDate)}</span>
                      </div>
                    )}
                    {salesOrder.actualDeliveryDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Actual Delivery</span>
                        <span className="text-sm font-medium">{formatDate(salesOrder.actualDeliveryDate)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-medium">{formatCurrency(salesOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax</span>
                      <span className="text-sm font-medium">{formatCurrency(salesOrder.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping</span>
                      <span className="text-sm font-medium">{formatCurrency(salesOrder.shipping || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(salesOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Create Quote */}
                  <button
                    onClick={() => router.push(`/quotes/create?orderId=${orderId}&source=sales-order`)}
                    className="p-4 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Create Quote</h4>
                        <p className="text-xs text-gray-600 mt-1">Generate quote from this order</p>
                      </div>
                    </div>
                  </button>

                  {/* Create Invoice */}
                  <button
                    onClick={() => router.push(`/invoices/create?orderId=${orderId}&source=sales-order`)}
                    className="p-4 text-left rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Create Invoice</h4>
                        <p className="text-xs text-gray-600 mt-1">Generate invoice for billing</p>
                      </div>
                    </div>
                  </button>

                  {/* Mark as Shipped */}
                  {salesOrder.status === 'processing' && (
                    <button
                      onClick={async () => {
                        await salesOrderService.updateSalesOrderStatus(orderId, 'shipped');
                        showToast('Order marked as shipped', 'success');
                        fetchSalesOrder();
                      }}
                      className="p-4 text-left rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Truck className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Mark as Shipped</h4>
                          <p className="text-xs text-gray-600 mt-1">Update to shipped status</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Mark as Delivered */}
                  {salesOrder.status === 'shipped' && (
                    <button
                      onClick={async () => {
                        await salesOrderService.updateSalesOrderStatus(orderId, 'delivered');
                        showToast('Order marked as delivered', 'success');
                        fetchSalesOrder();
                      }}
                      className="p-4 text-left rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">Mark as Delivered</h4>
                          <p className="text-xs text-gray-600 mt-1">Complete order delivery</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Print */}
                  <button
                    onClick={() => window.print()}
                    className="p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Printer className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Print Order</h4>
                        <p className="text-xs text-gray-600 mt-1">Print this order</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
              </div>
              
              <div className="p-5">
                {typeof salesOrder.opportunityId === 'object' ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{salesOrder.opportunityId.customer?.name}</h3>
                      <p className="text-sm text-gray-600">{salesOrder.opportunityId.customer?.companyName}</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{salesOrder.opportunityId.customer?.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{salesOrder.opportunityId.customer?.phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Customer info not available</p>
                )}
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
              </div>
              
              <div className="p-5 space-y-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Shipping</span>
                  </div>
                  <p className="text-gray-600">{salesOrder.shippingAddress || 'Not specified'}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Billing</span>
                  </div>
                  <p className="text-gray-600">{salesOrder.billingAddress || 'Same as shipping'}</p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Details</h2>
              </div>
              
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{formatDateTime(salesOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">{formatDateTime(salesOrder.updatedAt)}</span>
                </div>
                {salesOrder.paymentTerms && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Terms</span>
                    <span className="font-medium">{salesOrder.paymentTerms}</span>
                  </div>
                )}
                {salesOrder.notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-gray-600">Notes</p>
                    <p className="mt-1 text-gray-800">{salesOrder.notes}</p>
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