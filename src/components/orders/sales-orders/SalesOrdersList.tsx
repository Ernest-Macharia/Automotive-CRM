'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Plus, Search, Filter, Download, 
  TrendingUp, DollarSign, Clock, Users, CheckCircle,
  Calendar, FileText, CreditCard, RefreshCw, ChevronRight,
  Eye, Edit, Trash2, Play, MoreVertical, Loader2,
  PackageCheck, Receipt
} from 'lucide-react';
import { salesOrderService } from '@/services/salesOrderService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

// ✨ Cleaner Skeletons
const SkeletonRow = () => (
  <tr className="border-b border-gray-100">
    <td className="py-4 px-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-14 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // ✅ Keep all your existing logic functions unchanged
  const fetchSalesOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await salesOrderService.getAllSalesOrders(params);
      setSalesOrders(response);
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
      setLastRefresh(Date.now());
      showToast('Sales orders refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Check for updates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSalesOrders();
      fetchStats();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchSalesOrders, fetchStats]);

  useEffect(() => {
    fetchSalesOrders();
    fetchStats();
  }, [fetchSalesOrders, fetchStats]);

  // Listen for refresh events from other pages
  useEffect(() => {
    const handleStorageChange = () => {
      const lastUpdate = localStorage.getItem('salesOrdersLastUpdate');
      if (lastUpdate) {
        const lastUpdateTime = parseInt(lastUpdate, 10);
        if (lastUpdateTime > lastRefresh) {
          handleRefresh();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [lastRefresh]);

  const startWorkflow = async (orderId: string) => {
    try {
      setProcessingOrder(orderId);
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

  const getStatusIcon = (order: any) => {
    // Check if invoice is paid
    if (order.invoiceId) {
      const invoice = typeof order.invoiceId === 'object' ? order.invoiceId : null;
      if (invoice?.status === 'paid') {
        return <PackageCheck className="h-4 w-4 text-green-600" />;
      }
    }
    
    // Check if quote exists
    if (order.quoteId) {
      const quote = typeof order.quoteId === 'object' ? order.quoteId : null;
      if (quote?.status === 'approved') {
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      }
    }
    
    return null;
  };

  const getWorkflowStatus = (order: any) => {
    // If invoice is paid, show completed workflow
    if (order.invoiceId) {
      const invoice = typeof order.invoiceId === 'object' ? order.invoiceId : null;
      if (invoice?.status === 'paid') {
        return (
          <div className="flex items-center gap-1">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
              Completed
            </span>
            <PackageCheck className="h-4 w-4 text-green-600" />
          </div>
        );
      }
    }
    
    // If quote is approved, show invoice pending
    if (order.quoteId) {
      const quote = typeof order.quoteId === 'object' ? order.quoteId : null;
      if (quote?.status === 'approved') {
        return (
          <div className="flex items-center gap-1">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
              Invoice Pending
            </span>
            <Receipt className="h-4 w-4 text-blue-600" />
          </div>
        );
      }
    }
    
    return null;
  };

  // ✨ Improved rendering below — only UI changes
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* 🔵🟣 Header - Preserved as requested */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
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
              aria-label="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 text-white" />
              )}
            </button>
            {/* <Link
              href="/orders/sales-orders/create"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Order</span>
            </Link> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Stats */}
        {statsLoading ? (
          <SkeletonStats />
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Completed', value: stats.byStatus?.find((s: any) => s._id === 'delivered')?.count || 0, icon: PackageCheck, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue || 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Avg Order Value', value: formatCurrency(stats.avgOrderValue || 0), icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">{item.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{item.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order number, customer..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="relative min-w-[180px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            ) : salesOrders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
                  <ShoppingBag className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales orders found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Create your first sales order to get started.
                </p>
                <Link
                  href="/orders/sales-orders/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Create Sales Order
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesOrders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => {
                        // close any open dropdown when navigating (optional)
                        setExpandedRow(null);
                        router.push(`/orders/sales-orders/${order._id}`);
                      }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedRow(null);
                          router.push(`/orders/sales-orders/${order._id}`);
                        }
                      }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{order.salesOrderNumber}</p>
                          {getStatusIcon(order)}
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">
                          {typeof order.opportunityId === 'object'
                            ? order.opportunityId.customer?.name || '—'
                            : '—'}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[160px]">
                          {typeof order.opportunityId === 'object' ? order.opportunityId.subject || '' : ''}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-gray-700">
                        {formatDate(order.orderDate)}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      {/* ✅ Actions cell: prevent row click */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(expandedRow === order._id ? null : order._id);
                            }}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            aria-haspopup="true"
                            aria-expanded={expandedRow === order._id}
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {expandedRow === order._id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRow(null);
                                }}
                              />
                              <div
                                className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 animate-fade-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/orders/sales-orders/${order._id}`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                                  onClick={() => setExpandedRow(null)}
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Link>

                                {/* Show quote actions if needed */}
                                {!order.quoteId && (
                                  <Link
                                    href={`/quotes/create?orderId=${order._id}`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                                    onClick={() => setExpandedRow(null)}
                                  >
                                    <FileText className="h-4 w-4" />
                                    Create Quote
                                  </Link>
                                )}

                                {/* Show invoice link if quote is approved */}
                                {order.quoteId && typeof order.quoteId === 'object' && order.quoteId.status === 'approved' && (
                                  <Link
                                    href={`/invoices/create?orderId=${order._id}&quoteId=${order.quoteId._id}`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                                    onClick={() => setExpandedRow(null)}
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    Create Invoice
                                  </Link>
                                )}

                                {/* Refresh this order */}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const updatedOrder = await salesOrderService.getSalesOrderById(order._id);
                                      setSalesOrders(prev => prev.map(o => 
                                        o._id === order._id ? updatedOrder : o
                                      ));
                                      setExpandedRow(null);
                                      showToast('Order refreshed', 'success');
                                    } catch (error) {
                                      showToast('Failed to refresh order', 'error');
                                    }
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                  Refresh Status
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Status Summary */}
        {!statsLoading && stats?.byStatus && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Status Overview</h3>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.byStatus.map((status: any) => (
                <div key={status._id} className={`p-3 rounded-lg text-center ${
                  status._id === 'delivered' ? 'bg-green-50 border border-green-100' : 'bg-gray-50'
                }`}>
                  <div className="text-xs text-gray-600 capitalize mb-1 flex items-center justify-center gap-1">
                    {status._id}
                    {status._id === 'delivered' && <CheckCircle className="h-3 w-3 text-green-600" />}
                  </div>
                  <div className={`text-lg font-bold ${
                    status._id === 'delivered' ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    {status.count}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(status.totalAmount || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-3">Workflow Status Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Quote Pending</p>
                <p className="text-xs text-gray-600">Awaiting quote creation and approval</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Invoice Pending</p>
                <p className="text-xs text-gray-600">Quote approved, invoice to be created</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <PackageCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Completed</p>
                <p className="text-xs text-gray-600">Invoice paid, sales order delivered</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}