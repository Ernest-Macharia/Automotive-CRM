'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Plus, Search, Filter, RefreshCw, MoreVertical,
  Eye, AlertTriangle, Clock, CheckCircle, Loader2,
  Users, DollarSign, ChevronLeft, ChevronRight,
  LayoutDashboard, TrendingUp, Receipt, ClipboardCheck, ClipboardList, Upload, FileText
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
  const [importingCsv, setImportingCsv] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  const normalizePagination = useCallback(
    (
      incoming: { page?: number; limit?: number; total?: number; totalPages?: number; pages?: number } | undefined,
      fallbackPage: number,
      fallbackLimit: number,
      dataLength: number
    ) => {
      const toPositiveInt = (value: unknown, fallback: number) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        const intValue = Math.floor(numeric);
        return intValue > 0 ? intValue : fallback;
      };

      const toNonNegativeInt = (value: unknown, fallback: number) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        const intValue = Math.floor(numeric);
        return intValue >= 0 ? intValue : fallback;
      };

      let page = toPositiveInt(incoming?.page, fallbackPage);
      const limit = toPositiveInt(incoming?.limit, fallbackLimit);
      const reportedTotal = toNonNegativeInt(incoming?.total, 0);
      const total = Math.max(reportedTotal, dataLength);
      const apiTotalPages = toPositiveInt(incoming?.totalPages ?? incoming?.pages, 0);
      const totalPages = apiTotalPages > 0 ? apiTotalPages : Math.max(1, Math.ceil(total / limit));

      if (page > totalPages) {
        page = totalPages;
      }

      return { page, limit, total, totalPages };
    },
    []
  );

  const resolveWorkOrdersRows = useCallback((response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.rows)) return response.rows;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
  }, []);

  const resolvePaginationPayload = useCallback((response: any) => {
    const nestedPagination =
      response?.pagination ||
      response?.meta ||
      response?.data?.pagination ||
      response?.data?.meta ||
      {};

    return {
      page:
        nestedPagination?.page ??
        nestedPagination?.currentPage ??
        nestedPagination?.current_page ??
        response?.page ??
        response?.currentPage ??
        response?.current_page ??
        response?.data?.page ??
        response?.data?.currentPage ??
        response?.data?.current_page,
      limit:
        nestedPagination?.limit ??
        nestedPagination?.perPage ??
        nestedPagination?.per_page ??
        nestedPagination?.pageSize ??
        nestedPagination?.page_size ??
        response?.limit ??
        response?.perPage ??
        response?.per_page ??
        response?.pageSize ??
        response?.page_size ??
        response?.data?.limit ??
        response?.data?.perPage ??
        response?.data?.per_page ??
        response?.data?.pageSize ??
        response?.data?.page_size,
      total:
        nestedPagination?.total ??
        nestedPagination?.totalCount ??
        nestedPagination?.total_count ??
        nestedPagination?.count ??
        nestedPagination?.totalItems ??
        nestedPagination?.total_items ??
        nestedPagination?.recordsTotal ??
        response?.total ??
        response?.totalCount ??
        response?.total_count ??
        response?.count ??
        response?.totalItems ??
        response?.total_items ??
        response?.recordsTotal ??
        response?.data?.total ??
        response?.data?.totalCount ??
        response?.data?.total_count ??
        response?.data?.count ??
        response?.data?.totalItems ??
        response?.data?.total_items ??
        response?.data?.recordsTotal,
      totalPages:
        nestedPagination?.totalPages ??
        nestedPagination?.total_pages ??
        nestedPagination?.pages ??
        nestedPagination?.pageCount ??
        nestedPagination?.page_count ??
        nestedPagination?.lastPage ??
        nestedPagination?.last_page ??
        response?.totalPages ??
        response?.total_pages ??
        response?.pages ??
        response?.pageCount ??
        response?.page_count ??
        response?.lastPage ??
        response?.last_page ??
        response?.data?.totalPages ??
        response?.data?.total_pages ??
        response?.data?.pages ??
        response?.data?.pageCount ??
        response?.data?.page_count ??
        response?.data?.lastPage ??
        response?.data?.last_page,
      pages:
        nestedPagination?.pages ??
        nestedPagination?.totalPages ??
        response?.pages ??
        response?.totalPages ??
        response?.data?.pages ??
        response?.data?.totalPages,
    };
  }, []);

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
        searchTimeoutRef.current = undefined;
      }
    };
  }, [searchTerm]);

  // Initial data load
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setInitialLoad(true);
        
        // Load work orders and stats in parallel
        const [workOrdersResponse, summaryStats, stageStatsData] = await Promise.all([
          workOrderService.getAllWorkOrders({ page: 1, limit: 10 }),
          workOrderService.getWorkOrderStats().catch(() => null),
          workOrderService.getStageStats().catch(() => null)
        ]);
        
        if (mounted) {
          const rows = resolveWorkOrdersRows(workOrdersResponse);
          setWorkOrders(rows);
          setPagination(
            normalizePagination(
              resolvePaginationPayload(workOrdersResponse),
              1,
              10,
              rows.length
            )
          );
          
          setStats(summaryStats);
          setStageStats(stageStatsData);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        if (mounted) {
          showToast('Failed to load work orders', 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };
    
    loadInitialData();
    
    return () => { mounted = false; };
  }, [showToast, normalizePagination]);

  // Fetch work orders with pagination and filters
  const fetchWorkOrders = useCallback(async (page: number) => {
    // Don't fetch if we're already loading initial data
    if (initialLoad) return;
    
    try {
      setLoading(true);
      
      const params: any = {
        page,
        limit: pagination.limit
      };
      
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (stageFilter !== 'all') params.stage = stageFilter;
      
      const response = await workOrderService.getAllWorkOrders(params);
      
      const rows = resolveWorkOrdersRows(response);
      setWorkOrders(rows);
      setPagination(
        normalizePagination(
          resolvePaginationPayload(response),
          page,
          pagination.limit,
          rows.length
        )
      );
      
    } catch (error) {
      console.error('Error fetching work orders:', error);
      showToast('Failed to load work orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    stageFilter,
    pagination.limit,
    showToast,
    initialLoad,
    normalizePagination,
    resolveWorkOrdersRows,
    resolvePaginationPayload,
  ]);

  // Trigger fetch when deps change
  useEffect(() => {
    // Don't fetch on initial mount if initialLoad is true
    if (!initialLoad) {
      fetchWorkOrders(pagination.page);
    }
  }, [fetchWorkOrders, pagination.page, initialLoad]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchWorkOrders(1);
      showToast('Work orders refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Failed to refresh', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportingCsv(true);
      const preview = await workOrderService.previewCsvImport(file);
      const rowCount = preview?.totalRows ?? preview?.rows?.length ?? 0;
      const proceed = window.confirm(`Preview complete (${rowCount} rows). Continue import?`);
      if (!proceed) return;

      const result = await workOrderService.executeCsvImport(file);
      const imported = result?.importedCount ?? result?.created ?? result?.successCount ?? 0;
      showToast(`Work Orders CSV imported${imported ? `: ${imported} rows` : ''}`, 'success');
      await handleRefresh();
    } catch (error) {
      console.error('Error importing work orders CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import work orders CSV';
      showToast(errorMessage, 'error');
    } finally {
      setImportingCsv(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    const maxPages = pagination.totalPages > 0
      ? pagination.totalPages
      : Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 10)));
    if (newPage === pagination.page || newPage < 1 || newPage > maxPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    setExpandedRow(null);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      page: 1,
      limit: newLimit
    }));
    setExpandedRow(null);
  };

  const effectiveTotalPages = pagination.totalPages > 0
    ? pagination.totalPages
    : Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 10)));

  // Memoized getters
  const getCustomerName = useCallback((workOrder: any) => {
    if (!workOrder.opportunityId) return 'Unknown Customer';
    
    // Check cache first
    const cacheKey = workOrder._id + '_customer';
    if (customerNameCache.has(cacheKey)) {
      return customerNameCache.get(cacheKey);
    }
    
    let name = 'Unknown Customer';
    
    // Handle different data structures
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId) {
      const opp = workOrder.opportunityId;
      
      // Try to get customer name from various possible paths
      if (opp.customer) {
        if (typeof opp.customer === 'object') {
          name = opp.customer.name || opp.customer.companyName || opp.subject || 'Unknown Customer';
        } else {
          name = opp.customer || opp.subject || 'Unknown Customer';
        }
      } else if (opp.subject) {
        name = opp.subject;
      }
    } else if (typeof workOrder.opportunityId === 'string') {
      // If it's just a string ID, we can't get the name without additional API call
      name = 'Customer ID: ' + workOrder.opportunityId.substring(0, 8) + '...';
    }
    
    customerNameCache.set(cacheKey, name);
    return name;
  }, []);

  const getAssignedToName = useCallback((workOrder: any) => {
    // First check if assignedTo exists directly on workOrder
    if (workOrder.assignedTo) {
      if (typeof workOrder.assignedTo === 'object' && workOrder.assignedTo) {
        const firstName = workOrder.assignedTo.firstName || '';
        const lastName = workOrder.assignedTo.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) return fullName;
        if (workOrder.assignedTo.email) return workOrder.assignedTo.email.split('@')[0];
        if (workOrder.assignedTo.name) return workOrder.assignedTo.name;
        return 'Assigned';
      }
      // If it's a string ID
      if (typeof workOrder.assignedTo === 'string') {
        return 'Assigned (ID: ' + workOrder.assignedTo.substring(0, 6) + '...)';
      }
    }
    
    // Then check if opportunity has assignedTo
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId) {
      const opp = workOrder.opportunityId;
      
      // Check if opportunity has assignedTo directly
      if (opp.assignedTo) {
        if (typeof opp.assignedTo === 'object' && opp.assignedTo) {
          const firstName = opp.assignedTo.firstName || '';
          const lastName = opp.assignedTo.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          if (fullName) return fullName;
          if (opp.assignedTo.email) return opp.assignedTo.email.split('@')[0];
          if (opp.assignedTo.name) return opp.assignedTo.name;
          return 'Assigned (from opp)';
        }
        return opp.assignedTo || 'Assigned';
      }
      
      // Check if opportunity has assignedTo in a different path (like salesRep, etc.)
      if (opp.salesRep) {
        if (typeof opp.salesRep === 'object') {
          const firstName = opp.salesRep.firstName || '';
          const lastName = opp.salesRep.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          if (fullName) return fullName;
        }
      }
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

  const getStageRoute = useCallback((stage?: string) => {
    switch (stage) {
      case 'pre_checklist':
        return '/pre-checklist';
      case 'job_card':
        return '/job-cards';
      case 'post_checklist':
        return '/post-checklist';
      case 'invoice':
      case 'ready_for_invoice':
      case 'completed':
        return '/invoices';
      default:
        return null;
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
              <div className="h-8 w-14 bg-gray-200 rounded"></div>
            </div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const StageStatsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-full sm:w-40 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-full sm:w-40 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <th key={i} className="py-3 px-4">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="border-b border-gray-100">
                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                  <td key={col} className="py-4 px-4">
                    <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Show full page skeleton during initial load
  if (initialLoad) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="h-16 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <StatsSkeleton />
          <StageStatsSkeleton />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-600 to-purple-500 shadow-md flex items-center px-6 flex-shrink-0">
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
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCsv}
            />
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={importingCsv || loading}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              aria-label="Import CSV"
              title="Import CSV"
            >
              {importingCsv ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Upload className="h-5 w-5 text-white" />
              )}
            </button>
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
            <Link
              href="/settings/webforms"
              className="px-4 py-2 bg-white/15 text-white border border-white/30 font-semibold rounded-xl hover:bg-white/25 flex items-center gap-2 transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span className="hidden sm:inline">Web Forms</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Stats Overview */}
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
                    {formatCurrency((stats.costSummary?.totalLaborCost || 0) + (stats.costSummary?.totalPartsCost || 0))}
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

        {/* Stage Distribution */}
        {stageStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <Link
              href="/pre-checklist"
              className="block bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition"
              aria-label="Open pre-checklists"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-700 font-medium">Pre-Checklist</p>
                  <p className="text-lg font-bold text-purple-900">{stageStats.pre_checklist || 0}</p>
                </div>
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
              </div>
            </Link>
            <Link
              href="/job-cards"
              className="block bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition"
              aria-label="Open job cards"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-700 font-medium">Job Cards</p>
                  <p className="text-lg font-bold text-indigo-900">{stageStats.job_card || 0}</p>
                </div>
                <Wrench className="h-5 w-5 text-indigo-600" />
              </div>
            </Link>
            <Link
              href="/post-checklist"
              className="block bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition"
              aria-label="Open post-checklists"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-700 font-medium">Post-Checklist</p>
                  <p className="text-lg font-bold text-teal-900">{stageStats.post_checklist || 0}</p>
                </div>
                <ClipboardList className="h-5 w-5 text-teal-600" />
              </div>
            </Link>
            <Link
              href="/invoices"
              className="block bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition"
              aria-label="Open invoices"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700 font-medium">Invoice</p>
                  <p className="text-lg font-bold text-amber-900">{stageStats.invoice || 0}</p>
                </div>
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
            </Link>
            <Link
              href="/settings/webforms"
              className="block bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition"
              aria-label="Open web forms builder"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyan-700 font-medium">Web Forms</p>
                  <p className="text-lg font-bold text-cyan-900">Builder</p>
                </div>
                <FileText className="h-5 w-5 text-cyan-600" />
              </div>
            </Link>
          </div>
        ) : (
          <StageStatsSkeleton />
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
              <div className="p-12">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">Loading work orders...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the data</p>
                </div>
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
                        <p className="font-medium text-gray-900">
                          {(() => {
                            // First check if we have the enriched customer name from the service
                            if (order._customerName) return order._customerName;
                            
                            // Handle if opportunityId is an object (populated)
                            if (typeof order.opportunityId === 'object' && order.opportunityId) {
                              const opp = order.opportunityId;
                              // Check if customer exists in different possible paths
                              if (opp.customer) {
                                if (typeof opp.customer === 'object') {
                                  return opp.customer.name || opp.customer.companyName || 'Unknown Customer';
                                }
                                return opp.customer || 'Unknown Customer';
                              }
                              return opp.subject || 'Unknown Customer';
                            }
                            
                            // If opportunityId is just a string ID, use the getCustomerName function
                            if (typeof order.opportunityId === 'string' && order.opportunityId) {
                              // Use the memoized function to get the name
                              return getCustomerName(order);
                            }
                            
                            return 'Unknown Customer';
                          })()}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[160px]">
                          {(() => {
                            // Show subject if available
                            if (typeof order.opportunityId === 'object' && order.opportunityId) {
                              return order.opportunityId.subject || '';
                            }
                            // If it's a string ID, show a truncated version
                            if (typeof order.opportunityId === 'string' && order.opportunityId) {
                              return `Opportunity: ${order.opportunityId.substring(0, 8)}...`;
                            }
                            return '';
                          })()}
                        </p>
                      </td>

                      {/* <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {(() => {
                              // First check if we have the enriched assignee name
                              if (order._assignedToName) return order._assignedToName;
                              
                              // Check if assignedTo is an object (populated)
                              if (order.assignedTo && typeof order.assignedTo === 'object') {
                                const firstName = order.assignedTo.firstName || '';
                                const lastName = order.assignedTo.lastName || '';
                                const fullName = `${firstName} ${lastName}`.trim();
                                if (fullName) return fullName;
                                if (order.assignedTo.email) return order.assignedTo.email.split('@')[0];
                                if (order.assignedTo.name) return order.assignedTo.name;
                                return 'Assigned';
                              }
                              
                              // If assignedTo is a string ID, use the getAssignedToName function
                              if (order.assignedTo && typeof order.assignedTo === 'string') {
                                return getAssignedToName(order);
                              }
                              
                              // Check if opportunity has assignedTo (if it's an object)
                              if (typeof order.opportunityId === 'object' && order.opportunityId) {
                                const opp = order.opportunityId;
                                if (opp.assignedTo) {
                                  if (typeof opp.assignedTo === 'object') {
                                    const firstName = opp.assignedTo.firstName || '';
                                    const lastName = opp.assignedTo.lastName || '';
                                    const fullName = `${firstName} ${lastName}`.trim();
                                    if (fullName) return fullName;
                                    if (opp.assignedTo.email) return opp.assignedTo.email.split('@')[0];
                                    return 'Assigned';
                                  }
                                  return opp.assignedTo || 'Assigned';
                                }
                              }
                              
                              return 'Unassigned';
                            })()}
                          </span>
                        </div>
                      </td> */}

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {getStageRoute(order.currentStage) ? (
                          <Link
                            href={getStageRoute(order.currentStage) || '/orders/work-orders'}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            {order.currentStage?.replace(/_/g, ' ') || 'N/A'}
                          </Link>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {order.currentStage?.replace(/_/g, ' ') || 'N/A'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-semibold text-gray-900">
                        {formatCurrency(order.totalCost || (order.laborCost || 0) + (order.partsCost || 0))}
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
          {!loading && workOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="px-2 py-1.5 rounded-md border border-gray-300 bg-white text-sm"
                    aria-label="Rows per page"
                  >
                    {[10, 20, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}/page
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="text-sm text-gray-700 min-w-[90px] text-center">
                    Page {pagination.page} of {Math.max(effectiveTotalPages, 1)}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === effectiveTotalPages}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
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
