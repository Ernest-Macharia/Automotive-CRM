// src/components/workOrders/WorkOrdersList.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Plus, Search, Filter, RefreshCw, MoreVertical,
  Eye, AlertTriangle, Clock, CheckCircle, Loader2,
  Users, DollarSign, ChevronLeft, ChevronRight,
  LayoutDashboard, TrendingUp, Receipt, ClipboardCheck, ClipboardList
} from 'lucide-react';
import { workOrderService } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

// Cache for customer names
const customerNameCache = new Map();

export default function WorkOrdersList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Core state
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [stageStats, setStageStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // UI state
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  // Status options - memoized
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pre_checklist', label: 'Pre-Checklist' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'job_card', label: 'Job Card' },
    { value: 'post_checklist', label: 'Post-Checklist' },
    { value: 'ready_for_invoice', label: 'Ready for Invoice' },
    { value: 'completed', label: 'Completed' },
    { value: 'delayed', label: 'Delayed' },
    { value: 'cancelled', label: 'Cancelled' },
  ], []);

  const stageOptions = useMemo(() => [
    { value: 'all', label: 'All Stages' },
    { value: 'pre_checklist', label: 'Pre-Checklist' },
    { value: 'job_card', label: 'Job Card' },
    { value: 'post_checklist', label: 'Post-Checklist' },
    { value: 'invoice', label: 'Invoice' },
  ], []);

  // Debounce search
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = undefined; // Reset the ref
      }
    };
  }, [searchTerm, setDebouncedSearch, setPagination]);

  // In WorkOrdersList.tsx, modify the initial useEffect:
useEffect(() => {
  let mounted = true;
  
  const loadInitialData = async () => {
    try {
      // Load work orders and stats in parallel
      const [workOrdersResponse, summaryStats, stageStatsData] = await Promise.all([
        workOrderService.getAllWorkOrders({ page: 1, limit: 10 }),
        workOrderService.getWorkOrderStats().catch(() => null),
        workOrderService.getStageStats().catch(() => null)
      ]);
      
      if (mounted) {
        if (Array.isArray(workOrdersResponse)) {
          setWorkOrders(workOrdersResponse);
        } else if (workOrdersResponse && 'data' in workOrdersResponse) {
          setWorkOrders(workOrdersResponse.data || []);
          setPagination({
            page: workOrdersResponse.pagination?.page || 1,
            limit: workOrdersResponse.pagination?.limit || 10,
            total: workOrdersResponse.pagination?.total || 0,
            totalPages: workOrdersResponse.pagination?.totalPages || 0
          });
        }
        
        setStats(summaryStats);
        setStageStats(stageStatsData);
        setInitialLoad(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      if (mounted) {
        setInitialLoad(false);
        setLoading(false);
      }
    }
  };
  
  loadInitialData();
  
  return () => { mounted = false; };
}, []);

  // Fetch work orders with pagination
  const fetchWorkOrders = useCallback(async (page: number) => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        limit: pagination.limit
      };
      
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (stageFilter !== 'all') params.stage = stageFilter;
      
      const startTime = performance.now();
      const response = await workOrderService.getAllWorkOrders(params);
      const endTime = performance.now();
      
      console.log(`API call took ${endTime - startTime}ms`);
      
      // Handle response
      if (Array.isArray(response)) {
        setWorkOrders(response);
        setPagination(prev => ({
          ...prev,
          page,
          total: response.length,
          totalPages: Math.ceil(response.length / prev.limit)
        }));
      } else if (response && 'data' in response) {
        setWorkOrders(response.data || []);
        setPagination({
          page: response.pagination?.page || page,
          limit: response.pagination?.limit || 10,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching work orders:', error);
      showToast('Failed to load work orders', 'error');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [debouncedSearch, statusFilter, stageFilter, pagination.limit, showToast]);

  // Trigger fetch when deps change
  useEffect(() => {
    fetchWorkOrders(pagination.page);
  }, [fetchWorkOrders, pagination.page]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchWorkOrders(1);
      showToast('Work orders refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === pagination.page) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Memoized getters
  const getCustomerName = useCallback((workOrder: any) => {
    if (!workOrder.opportunityId) return 'Unknown';
    
    // Check cache first
    const cacheKey = workOrder._id + '_customer';
    if (customerNameCache.has(cacheKey)) {
      return customerNameCache.get(cacheKey);
    }
    
    let name = 'Unknown Customer';
    if (typeof workOrder.opportunityId === 'object') {
      name = workOrder.opportunityId.customer?.name || 
             workOrder.opportunityId.customer?.companyName || 
             workOrder.opportunityId.subject || 
             'Unknown Customer';
    }
    
    customerNameCache.set(cacheKey, name);
    return name;
  }, []);

  const getAssignedToName = useCallback((workOrder: any) => {
    if (typeof workOrder.assignedTo === 'object' && workOrder.assignedTo) {
      const firstName = workOrder.assignedTo.firstName || '';
      const lastName = workOrder.assignedTo.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Unnamed';
    }
    if (typeof workOrder.assignedTo === 'string') {
      return 'Assigned';
    }
    return 'Unassigned';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pre_checklist': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'job_card': return 'bg-indigo-100 text-indigo-800';
      case 'post_checklist': return 'bg-teal-100 text-teal-800';
      case 'ready_for_invoice': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }, []);

  // Quick stats components
  const StatsSkeleton = () => (
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

  const TableSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="p-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (initialLoad) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="h-16 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <StatsSkeleton />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header - Fixed height, no re-renders */}
      <div className="h-16 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Work Orders</h1>
              <p className="text-indigo-100 text-sm">Manage and track work orders</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
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
              href="/orders/work-orders/create"
              className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Work Order</span>
            </Link> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Stats Overview - Only show if we have stats */}
        {stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.byStatus?.find((s: any) => s._id === 'delayed')?.count || 0} Delayed
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50">
                  <LayoutDashboard className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.byStatus?.find((s: any) => s._id === 'in_progress')?.count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{stats.byStatus?.find((s: any) => s._id === 'job_card')?.count || 0} Job Cards
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.byStatus?.find((s: any) => s._id === 'completed')?.count || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
                <div className="p-2.5 rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.costSummary?.totalLaborCost + stats.costSummary?.totalPartsCost || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {formatCurrency(stats.costSummary?.avgCostPerOrder || 0)}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-50">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <StatsSkeleton />
        )}

        {/* Stage Distribution - Only show if we have stage stats */}
        {stageStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-700 font-medium">Pre-Checklist</p>
                  <p className="text-lg font-bold text-purple-900">{stageStats.pre_checklist || 0}</p>
                </div>
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-700 font-medium">Job Cards</p>
                  <p className="text-lg font-bold text-indigo-900">{stageStats.job_card || 0}</p>
                </div>
                <Wrench className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-700 font-medium">Post-Checklist</p>
                  <p className="text-lg font-bold text-teal-900">{stageStats.post_checklist || 0}</p>
                </div>
                <ClipboardList className="h-5 w-5 text-teal-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700 font-medium">Invoice</p>
                  <p className="text-lg font-bold text-amber-900">{stageStats.invoice || 0}</p>
                </div>
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
            </div>
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
                  placeholder="Search by WO number, customer..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="relative min-w-[160px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative min-w-[160px]">
                <select
                  value={stageFilter}
                  onChange={(e) => {
                    setStageFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {stageOptions.map((option) => (
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
              <div className="p-8">
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
                <p className="text-center text-gray-500 mt-2">Loading work orders...</p>
              </div>
            ) : workOrders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-4">
                  <Wrench className="h-7 w-7 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No work orders found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {debouncedSearch || statusFilter !== 'all' || stageFilter !== 'all' 
                    ? 'Try adjusting your filters or search term' 
                    : 'Create your first work order to get started.'}
                </p>
                {(debouncedSearch || statusFilter !== 'all' || stageFilter !== 'all') ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setDebouncedSearch('');
                      setStatusFilter('all');
                      setStageFilter('all');
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                  >
                    <RefreshCw className="h-4 w-4" /> Clear Filters
                  </button>
                ) : (
                  <Link
                    href="/orders/work-orders/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4" /> Create Work Order
                  </Link>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">WO #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => router.push(`/orders/work-orders/${order._id}`)}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{order.workOrderNumber || 'N/A'}</p>
                          {order.status === 'delayed' && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{getCustomerName(order)}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[160px]">
                          {typeof order.opportunityId === 'object' 
                            ? order.opportunityId.subject || '' 
                            : ''}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{getAssignedToName(order)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {order.currentStage?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-gray-900">
                        {formatCurrency(order.totalCost || order.laborCost + order.partsCost)}
                      </td>

                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(expandedRow === order._id ? null : order._id);
                            }}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
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

          {/* Pagination */}
          {!loading && workOrders.length > 0 && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.page - 1) * pagination.limit) + 1}
                  </span>
                  {' '}-{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}