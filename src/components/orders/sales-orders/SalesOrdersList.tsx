'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Plus, Search, Filter, Download, 
  TrendingUp, DollarSign, Clock, Users, CheckCircle,
  Calendar, FileText, CreditCard, RefreshCw, ChevronRight,
  Eye, Edit, Trash2, Play, MoreVertical, Loader2
} from 'lucide-react';
import { salesOrderService } from '@/services/salesOrderService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

// Skeleton Loading Components
const SkeletonRow = () => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-4 px-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-200 animate-pulse">
          <div className="h-4 w-4 bg-gray-300 rounded"></div>
        </div>
        <div>
          <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-1"></div>
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </td>
    <td className="py-4 px-4">
      <div>
        <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-1"></div>
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
        <div className="h-3 w-20 bg-gray-300 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="h-6 w-16 bg-gray-300 rounded-full animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-8 w-24 bg-gray-300 rounded-lg animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </td>
  </tr>
);

const SkeletonStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-24 bg-blue-200 rounded mb-2"></div>
            <div className="h-8 w-16 bg-blue-300 rounded"></div>
          </div>
          <div className="p-3 rounded-xl bg-blue-200">
            <div className="h-6 w-6 bg-blue-300 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function SalesOrdersList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const fetchSalesOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await salesOrderService.getAllSalesOrders(params);
      setSalesOrders(response.data);
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      showToast('Failed to load sales orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await salesOrderService.getSalesOrderStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchSalesOrders(), fetchStats()]);
      showToast('Sales orders refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
    fetchStats();
  }, [fetchSalesOrders, fetchStats]);

  // SIMPLE WORKFLOW START
  const startWorkflow = async (orderId: string) => {
    try {
      setProcessingOrder(orderId);
      
      // Navigate to create quote page with order data
      router.push(`/quotes/create?orderId=${orderId}&source=sales-order`);
      
    } catch (error) {
      console.error('Error starting workflow:', error);
      showToast('Failed to start workflow', 'error');
      setProcessingOrder(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Sales Orders</h1>
              <p className="text-blue-100 text-sm">Manage sales orders and create quotes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 text-white" />
              )}
            </button>
            <Link
              href="/orders/sales-orders/create"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Order</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Stats Overview */}
          {statsLoading ? (
            <SkeletonStats />
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Total Sales Orders</p>
                    <p className="text-2xl font-bold text-green-800">{stats.total}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Confirmed Orders</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {stats.byStatus?.find((s: any) => s._id === 'confirmed')?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl p-4 border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-700">Total Revenue</p>
                    <p className="text-2xl font-bold text-teal-800">
                      {formatCurrency(stats.totalRevenue || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-500/20">
                    <DollarSign className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">Avg Order Value</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {formatCurrency(stats.avgOrderValue || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-yellow-500/20">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Filters - Fixed */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search sales orders..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table - Scrollable */}
            <div className="p-6 flex-1 overflow-y-auto">
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Workflow</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : salesOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                    <ShoppingBag className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No sales orders found</h3>
                  <p className="text-gray-500 mb-6">Create your first sales order</p>
                  <Link
                    href="/orders/sales-orders/create"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Create New Sales Order
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Workflow</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesOrders.map((order) => (
                        <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200">
                                <ShoppingBag className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{order.salesOrderNumber}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-800">
                                {typeof order.opportunityId === 'object' 
                                  ? order.opportunityId.customer?.name || 'N/A'
                                  : 'N/A'
                                }
                              </p>
                              <p className="text-xs text-gray-500">
                                {typeof order.opportunityId === 'object' 
                                  ? order.opportunityId.subject || ''
                                  : ''
                                }
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{formatDate(order.orderDate)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-gray-800">{formatCurrency(order.totalAmount)}</p>
                          </td>
                          <td className="py-4 px-4">
                            {/* SIMPLE WORKFLOW BUTTON */}
                            <button
                              onClick={() => startWorkflow(order._id)}
                              disabled={processingOrder === order._id}
                              className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 ${
                                processingOrder === order._id
                                  ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                              }`}
                            >
                              {processingOrder === order._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3" />
                                  Create Quote
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/orders/sales-orders/${order._id}`}
                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/quotes/create?orderId=${order._id}`}
                                className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                                title="Create Quote"
                              >
                                <FileText className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/invoices/create?orderId=${order._id}`}
                                className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                                title="Create Invoice"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          {!statsLoading && stats?.byStatus && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Status Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.byStatus.map((status: any) => (
                  <div
                    key={status._id}
                    className="p-3 rounded-xl bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${
                        status._id === 'draft' ? 'bg-gray-400' :
                        status._id === 'confirmed' ? 'bg-blue-400' :
                        status._id === 'processing' ? 'bg-yellow-400' :
                        status._id === 'shipped' ? 'bg-purple-400' :
                        status._id === 'delivered' ? 'bg-green-400' :
                        'bg-red-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {status._id}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">{status.count}</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(status.totalAmount || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}