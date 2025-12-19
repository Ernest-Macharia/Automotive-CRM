'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Plus, Search, Filter, Download, 
  TrendingUp, DollarSign, Clock, Users, CheckCircle,
  Calendar, FileText, RefreshCw, ChevronRight, Sparkles,
  Eye, Edit, Trash2, MoreVertical
} from 'lucide-react';
import { workOrderService, WorkOrdersResponse, WorkOrderStats } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

export default function WorkOrdersList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'bg-gray-100 text-gray-800' },
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateRange.from) params.fromDate = dateRange.from;
      if (dateRange.to) params.toDate = dateRange.to;
      
      const response = await workOrderService.getAllWorkOrders(params);
      setWorkOrders(response.data);
      
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      showToast('Failed to load work orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, dateRange, showToast]);

  const fetchStats = async () => {
    try {
      const statsData = await workOrderService.getWorkOrderStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchStats();
  }, [fetchWorkOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await workOrderService.updateWorkOrderStatus(orderId, newStatus);
      showToast('Work order status updated successfully!', 'success');
      fetchWorkOrders();
    } catch (error) {
      console.error('Error updating work order status:', error);
      showToast('Failed to update work order status', 'error');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      try {
        await workOrderService.deleteWorkOrder(orderId);
        showToast('Work order deleted successfully!', 'success');
        fetchWorkOrders();
      } catch (error) {
        console.error('Error deleting work order:', error);
        showToast('Failed to delete work order', 'error');
      }
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
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Work Orders</h1>
                <p className="text-green-100 text-sm">Manage and track all work orders</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchWorkOrders}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              <Link
                href="/orders/work-orders/create"
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Create New Work Order"
              >
                <Plus className="h-5 w-5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Total Work Orders</p>
                  <p className="text-2xl font-bold text-green-800">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/20">
                  <Wrench className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">In Progress</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {stats.byStatus?.find(s => s._id === 'in_progress')?.count || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl p-4 border border-teal-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-teal-700">Total Cost</p>
                  <p className="text-2xl font-bold text-teal-800">
                    {formatCurrency(stats.totalCost || 0)}
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
                  <p className="text-sm text-yellow-700">Avg Hours</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {(stats.avgHours || 0).toFixed(1)} hrs
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50/50 to-teal-50/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search work orders by number, customer, or description..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                
                <button
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    setDateRange({
                      from: lastMonth.toISOString().split('T')[0],
                      to: today.toISOString().split('T')[0]
                    });
                  }}
                  className="px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span>Last Month</span>
                </button>
              </div>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            ) : workOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-100 to-teal-100 mb-4">
                  <Wrench className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No work orders found</h3>
                <p className="text-gray-500 mb-6">Create your first work order from an opportunity</p>
                <Link
                  href="/orders/work-orders/create"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700 font-medium inline-flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create New Work Order
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Start Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total Cost</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-green-100 to-green-200">
                              <Wrench className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{order.workOrderNumber}</p>
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
                                ? order.opportunityId.customer.name
                                : 'Loading...'
                              }
                            </p>
                            <p className="text-xs text-gray-500">
                              {typeof order.opportunityId === 'object' 
                                ? order.opportunityId.customer.email || 'No email'
                                : ''
                              }
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {order.startDate ? formatDate(order.startDate) : 'Not scheduled'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-800">
                            {formatCurrency((order.laborCost || 0) + (order.partsCost || 0))}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/orders/work-orders/${order._id}`}
                              className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/orders/work-orders/${order._id}/edit`}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(order._id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => {
                                  const nextStatus = order.status === 'draft' ? 'in_progress' :
                                                   order.status === 'in_progress' ? 'on_hold' :
                                                   order.status === 'on_hold' ? 'completed' :
                                                   'cancelled';
                                  handleStatusChange(order._id, nextStatus);
                                }}
                                className="px-3 py-1 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm hover:from-green-600 hover:to-teal-700"
                              >
                                {order.status === 'draft' ? 'Start Work' :
                                 order.status === 'in_progress' ? 'Hold' :
                                 'Complete'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status Summary */}
          {stats?.byStatus && (
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Status Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {stats.byStatus.map((status) => (
                  <div
                    key={status._id}
                    className="p-3 rounded-xl bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${
                        status._id === 'draft' ? 'bg-gray-400' :
                        status._id === 'in_progress' ? 'bg-blue-400' :
                        status._id === 'on_hold' ? 'bg-yellow-400' :
                        status._id === 'completed' ? 'bg-green-400' :
                        'bg-red-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {status._id.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">{status.count}</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(status.totalCost || 0)}
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