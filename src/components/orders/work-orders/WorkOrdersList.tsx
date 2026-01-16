'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Plus, Search, Filter, Download, 
  TrendingUp, DollarSign, Clock, Users, CheckCircle,
  Calendar, FileText, RefreshCw, ChevronRight, Sparkles,
  Eye, Edit, Trash2, MoreVertical, Loader2, Briefcase,
  Car, Truck, AlertCircle, FileSignature, ClipboardCheck,
  ClipboardList, Receipt, AlertTriangle, Shield, CheckCheck,
  BarChart3, XCircle
} from 'lucide-react';
import { workOrderService, WorkOrder, WorkOrderFilterParams, WorkOrdersResponse, WorkOrderStats, StatusSummary } from '@/services/workOrderService';
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
      <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
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

export default function WorkOrdersList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [statusSummary, setStatusSummary] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Updated status options to match new API
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pre_checklist', label: 'Pre-Checklist' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'job_card', label: 'Job Card' },
    { value: 'post_checklist', label: 'Post-Checklist' },
    { value: 'ready_for_invoice', label: 'Ready for Invoice' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'delayed', label: 'Delayed' },
  ];

  const stageOptions = [
    { value: 'all', label: 'All Stages' },
    { value: 'pre_checklist', label: 'Pre-Checklist' },
    { value: 'job_card', label: 'Job Card' },
    { value: 'post_checklist', label: 'Post-Checklist' },
    { value: 'invoice', label: 'Invoice' },
  ];

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: WorkOrderFilterParams = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateRange.from) params.fromDate = dateRange.from;
      if (dateRange.to) params.toDate = dateRange.to;
      
      const response = await workOrderService.getAllWorkOrders(params);
      // ✅ Correctly handle the WorkOrdersResponse type
      setWorkOrders(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      showToast('Failed to load work orders', 'error');
      setError('Failed to load work orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, dateRange, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await workOrderService.getWorkOrderStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchStatusSummary = useCallback(async () => {
    try {
      const summaryData = await workOrderService.getStatusSummary();
      setStatusSummary(summaryData);
    } catch (error) {
      console.error('Error fetching status summary:', error);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await Promise.all([fetchWorkOrders(), fetchStats(), fetchStatusSummary()]);
      showToast('Work orders refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  useEffect(() => {
    fetchStats();
    fetchStatusSummary();
  }, [fetchStats, fetchStatusSummary]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await workOrderService.updateWorkOrderStatus(orderId, newStatus);
      showToast('Work order status updated successfully!', 'success');
      fetchWorkOrders();
      fetchStatusSummary();
    } catch (error) {
      console.error('Error updating work order status:', error);
      showToast('Failed to update work order status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
      try {
        setDeletingOrder(orderId);
        await workOrderService.deleteWorkOrder(orderId);
        showToast('Work order deleted successfully!', 'success');
        fetchWorkOrders();
        fetchStatusSummary();
        setExpandedRow(null);
      } catch (error) {
        console.error('Error deleting work order:', error);
        showToast('Failed to delete work order', 'error');
      } finally {
        setDeletingOrder(null);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusConfig = (status: string) => {
    return {
      color: workOrderService.getStatusColor(status),
      icon: workOrderService.getStatusIcon(status),
      label: workOrderService.getStatusLabel(status)
    };
  };

  const getStageConfig = (stage?: string) => {
    if (!stage) return {
      color: 'bg-gray-100 text-gray-800',
      icon: <div className="h-2 w-2 rounded-full bg-current" />,
      label: 'Not started'
    };

    const config = {
      color: 'bg-gray-100 text-gray-800',
      icon: <div className="h-2 w-2 rounded-full bg-current" />,
      label: workOrderService.getStageLabel(stage) || stage
    };

    switch (stage) {
      case 'pre_checklist':
        config.color = 'bg-purple-100 text-purple-800';
        break;
      case 'job_card':
        config.color = 'bg-blue-100 text-blue-800';
        break;
      case 'post_checklist':
        config.color = 'bg-teal-100 text-teal-800';
        break;
      case 'invoice':
        config.color = 'bg-yellow-100 text-yellow-800';
        break;
    }

    return config;
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft': return { label: 'Start Pre-Checklist', value: 'pre_checklist' };
      case 'pre_checklist': return { label: 'Move to Job Card', value: 'job_card' };
      case 'job_card': return { label: 'Move to Post-Checklist', value: 'post_checklist' };
      case 'post_checklist': return { label: 'Ready for Invoice', value: 'ready_for_invoice' };
      case 'in_progress': return { label: 'Complete', value: 'completed' };
      default: return null;
    }
  };

  const canComplete = (status: string) => {
    return ['in_progress', 'job_card', 'post_checklist', 'ready_for_invoice'].includes(status);
  };

  const getCustomerName = (order: WorkOrder) => {
    return workOrderService.getCustomerName(order);
  };

  const getCustomerEmail = (order: WorkOrder) => {
    return workOrderService.getCustomerEmail(order) || '';
  };

  const getAssignedToName = (order: WorkOrder) => {
    return workOrderService.getAssignedToName(order);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStageFilter('all');
    setDateRange({ from: '', to: '' });
  };

  // If there's an error, show error state
  if (error && workOrders.length === 0 && !loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Work Orders</h1>
                <p className="text-blue-100 text-sm">Manage and track all work orders</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Work Orders</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Work Orders</h1>
              <p className="text-blue-100 text-sm">Manage and track all work orders</p>
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
            <Link
              href="/orders/work-orders/create"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Order</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Stats */}
        {!error && statsLoading ? (
          <SkeletonStats />
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { 
                label: 'Total Orders', 
                value: stats.total || workOrders.length, 
                icon: Wrench, 
                color: 'text-blue-600', 
                bg: 'bg-blue-50'
              },
              { 
                label: 'In Progress', 
                value: stats.byStatus?.find(s => s._id === 'in_progress')?.count || workOrders.filter(o => o.status === 'in_progress').length, 
                icon: Clock, 
                color: 'text-blue-600', 
                bg: 'bg-blue-50' 
              },
              { 
                label: 'Delayed', 
                value: stats.delayedOrders || workOrders.filter(o => o.status === 'delayed').length, 
                icon: AlertTriangle, 
                color: 'text-amber-600', 
                bg: 'bg-amber-50' 
              },
              { 
                label: 'Completed', 
                value: stats.byStatus?.find(s => s._id === 'completed')?.count || workOrders.filter(o => o.status === 'completed').length, 
                icon: CheckCircle, 
                color: 'text-green-600', 
                bg: 'bg-green-50' 
              },
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

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {(searchTerm || statusFilter !== 'all' || stageFilter !== 'all' || dateRange.from || dateRange.to) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Search and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order number, customer..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
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

                <div className="relative">
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {stageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <BarChart3 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            ) : workOrders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
                  <Wrench className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No work orders found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {searchTerm || statusFilter !== 'all' || stageFilter !== 'all' || dateRange.from || dateRange.to
                    ? 'Try adjusting your filters to see more results.'
                    : 'Create your first work order to get started.'
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/orders/work-orders/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Create Work Order
                  </Link>
                  {(searchTerm || statusFilter !== 'all' || stageFilter !== 'all' || dateRange.from || dateRange.to) && (
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const stageConfig = getStageConfig(order.currentStage);
                    return (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{order.workOrderNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">
                            {getCustomerName(order)}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[160px]">
                            {getCustomerEmail(order) || 'No email'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          {order.currentStage ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stageConfig.color}`}>
                              {stageConfig.icon}
                              {stageConfig.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Not started</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                            {order.delayDays && order.delayDays > 0 && (
                              <span className="text-xs text-amber-600">
                                Delayed by {order.delayDays} day{order.delayDays !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700 text-sm">
                          {getAssignedToName(order)}
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {workOrderService.formatCurrency(order.totalCost || 0)}
                        </td>
                        <td className="py-4 px-4">
                          {/* Kebab Menu */}
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
                                  onClick={() => setExpandedRow(null)}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                  <Link
                                    href={`/orders/work-orders/${order._id}`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                                    onClick={() => setExpandedRow(null)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </Link>
                                  <Link
                                    href={`/orders/work-orders/${order._id}/edit`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                                    onClick={() => setExpandedRow(null)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Link>
                                  
                                  {/* Status Actions */}
                                  {getNextStatus(order.status) && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setExpandedRow(null);
                                        handleStatusChange(order._id, getNextStatus(order.status)!.value);
                                      }}
                                      disabled={updatingStatus === order._id}
                                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left disabled:opacity-50"
                                    >
                                      {updatingStatus === order._id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Sparkles className="h-4 w-4" />
                                      )}
                                      {getNextStatus(order.status)!.label}
                                    </button>
                                  )}
                                  
                                  {canComplete(order.status) && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setExpandedRow(null);
                                        handleStatusChange(order._id, 'completed');
                                      }}
                                      disabled={updatingStatus === order._id}
                                      className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 w-full text-left disabled:opacity-50"
                                    >
                                      {updatingStatus === order._id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                      Complete Order
                                    </button>
                                  )}
                                  
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setExpandedRow(null);
                                      handleDelete(order._id);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}