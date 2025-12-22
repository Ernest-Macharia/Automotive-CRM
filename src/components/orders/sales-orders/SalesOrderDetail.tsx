'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [salesOrder, setSalesOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const orderId = params.id as string;

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

  // SIMPLE WORKFLOW: Start Quote Creation
  const startWorkflow = async () => {
    try {
      setWorkflowLoading(true);
      
      // Navigate to create quote page with order data
      router.push(`/quotes/create?orderId=${orderId}&source=sales-order`);
      
    } catch (error) {
      console.error('Error starting workflow:', error);
      showToast('Failed to start workflow', 'error');
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
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!salesOrder) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/orders/sales-orders')}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{salesOrder.salesOrderNumber}</h1>
                <p className="text-blue-100 text-sm">Sales Order Details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={startWorkflow}
                disabled={workflowLoading}
                className={`px-4 py-2 font-medium rounded-xl flex items-center gap-2 ${
                  workflowLoading
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
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
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Edit"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    salesOrder.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    salesOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    salesOrder.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    salesOrder.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                    salesOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {salesOrder.status.charAt(0).toUpperCase() + salesOrder.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">{formatDate(salesOrder.orderDate)}</span>
                      </div>
                      {salesOrder.estimatedDeliveryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Delivery:</span>
                          <span className="font-medium">{formatDate(salesOrder.estimatedDeliveryDate)}</span>
                        </div>
                      )}
                      {salesOrder.actualDeliveryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Actual Delivery:</span>
                          <span className="font-medium">{formatDate(salesOrder.actualDeliveryDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(salesOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-medium">{formatCurrency(salesOrder.tax || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">{formatCurrency(salesOrder.shipping || 0)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-800">Total:</span>
                        <span className="text-xl font-bold text-blue-600">{formatCurrency(salesOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-xl font-bold text-gray-800">Workflow Actions</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Create Quote */}
                  <button
                    onClick={() => router.push(`/quotes/create?orderId=${orderId}&source=sales-order`)}
                    className="p-4 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">Create Quote</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Generate quote from this order
                        </p>
                      </div>
                      <Play className="h-5 w-5 text-blue-500" />
                    </div>
                  </button>

                  {/* Create Invoice */}
                  <button
                    onClick={() => router.push(`/invoices/create?orderId=${orderId}&source=sales-order`)}
                    className="p-4 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-green-100 to-green-200">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">Create Invoice</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Generate invoice for billing
                        </p>
                      </div>
                      <Play className="h-5 w-5 text-green-500" />
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
                      className="p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200">
                          <Truck className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">Mark as Shipped</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Update shipping status
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-purple-500" />
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
                      className="p-4 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-green-100 to-green-200">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">Mark as Delivered</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Complete order delivery
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </button>
                  )}

                  {/* Print Order */}
                  <button
                    onClick={() => window.print()}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200">
                        <Printer className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">Print Order</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Print order details
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Download PDF */}
                  <button
                    onClick={() => {/* Add PDF export logic */}}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200">
                        <Download className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">Download PDF</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Export order as PDF
                        </p>
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
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-xl font-bold text-gray-800">Customer Information</h2>
              </div>
              
              <div className="p-6">
                {typeof salesOrder.opportunityId === 'object' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{salesOrder.opportunityId.customer?.name}</h3>
                        <p className="text-gray-500 text-sm">{salesOrder.opportunityId.customer?.companyName}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{salesOrder.opportunityId.customer?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{salesOrder.opportunityId.customer?.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading customer information...</p>
                )}
              </div>
            </div>

            {/* Shipping & Billing */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-xl font-bold text-gray-800">Addresses</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Shipping Address</span>
                    </div>
                    <p className="text-gray-800 text-sm">{salesOrder.shippingAddress || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Billing Address</span>
                    </div>
                    <p className="text-gray-800 text-sm">{salesOrder.billingAddress || 'Same as shipping'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Metadata */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-xl font-bold text-gray-800">Order Info</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatDate(salesOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="font-medium">{formatDate(salesOrder.updatedAt)}</span>
                  </div>
                  {salesOrder.paymentTerms && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Terms:</span>
                      <span className="font-medium">{salesOrder.paymentTerms}</span>
                    </div>
                  )}
                  {salesOrder.notes && (
                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-sm text-gray-800 mt-1">{salesOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}