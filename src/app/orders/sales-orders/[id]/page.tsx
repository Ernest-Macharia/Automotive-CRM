'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, ArrowLeft, Calendar, User, DollarSign, 
  Package, Truck, CheckCircle, Clock, AlertCircle,
  Edit, Printer, Download, Share2, MoreVertical,
  MapPin, FileText, Phone, Mail, Building,
  ChevronRight, Sparkles
} from 'lucide-react';
import { salesOrderService, SalesOrder } from '@/services/salesOrderService';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { format } from 'date-fns';

export default function SalesOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSalesOrder(params.id as string);
    }
  }, [params.id]);

  const fetchSalesOrder = async (id: string) => {
    try {
      setLoading(true);
      const data = await salesOrderService.getSalesOrderById(id);
      setSalesOrder(data);
    } catch (error) {
      console.error('Error fetching sales order:', error);
      showToast('Failed to load sales order details', 'error');
      router.push('/sales-orders');
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
      case 'confirmed': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700';
      case 'processing': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700';
      case 'shipped': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700';
      case 'delivered': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700';
      case 'cancelled': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!salesOrder) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/sales-orders')}
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
                  onClick={() => router.push(`/sales-orders/${salesOrder._id}/edit`)}
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
              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
                      <p className="text-gray-500 text-sm">Order #{salesOrder.salesOrderNumber}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(salesOrder.status)}`}>
                      {getStatusIcon(salesOrder.status)}
                      <span className="capitalize">{salesOrder.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-700">Dates</h3>
                      </div>
                      <div className="space-y-2">
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
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-700">Financials</h3>
                      </div>
                      <div className="space-y-2">
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
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(salesOrder.discount || 0)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-bold text-gray-800">Total Amount:</span>
                          <span className="text-xl font-bold text-blue-600">{formatCurrency(salesOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h2 className="text-xl font-bold text-gray-800">Customer Information</h2>
                </div>
                
                <div className="p-6">
                  {typeof salesOrder.opportunityId === 'object' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{salesOrder.opportunityId.customer.name}</h3>
                          <p className="text-gray-500">{salesOrder.opportunityId.customer.companyName}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Email</span>
                          </div>
                          <p className="text-gray-800">{salesOrder.opportunityId.customer.email || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Phone</span>
                          </div>
                          <p className="text-gray-800">{salesOrder.opportunityId.customer.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading customer information...</p>
                  )}
                </div>
              </div>

              {/* Quote Items */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h2 className="text-xl font-bold text-gray-800">Order Items</h2>
                </div>
                
                <div className="p-6">
                  {typeof salesOrder.quoteId === 'object' && salesOrder.quoteId.items ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Quantity</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Unit Price</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesOrder.quoteId.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-800">{item.description}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-800">{item.quantity}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-800">{formatCurrency(item.unitPrice)}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-gray-800">{formatCurrency(item.total)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No items available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push(`/sales-orders/${salesOrder._id}/edit`)}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2"
                    >
                      <Edit className="h-5 w-5" />
                      Edit Order
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
                  </div>
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
                    {salesOrder.createdBy && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created By:</span>
                        <span className="font-medium">
                          {typeof salesOrder.createdBy === 'object' 
                            ? `${salesOrder.createdBy.firstName} ${salesOrder.createdBy.lastName}`
                            : salesOrder.createdBy}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {salesOrder.notes && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <h2 className="text-xl font-bold text-gray-800">Notes</h2>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-800">{salesOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}