'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  FileText,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  AlertTriangle,
  XCircle,
  UserCircle,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  workOrderService,
  WorkOrder,
  WorkOrderStats,
} from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

// Constants outside component to prevent recreation
const STATUS_OPTIONS = [
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

const STATUS_CONFIG = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: FileText },
  pre_checklist: { color: 'bg-purple-100 text-purple-800', label: 'Pre-Checklist', icon: FileText },
  in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: Clock },
  job_card: { color: 'bg-indigo-100 text-indigo-800', label: 'Job Card', icon: Wrench },
  post_checklist: { color: 'bg-teal-100 text-teal-800', label: 'Post-Checklist', icon: FileText },
  ready_for_invoice: { color: 'bg-yellow-100 text-yellow-800', label: 'Ready for Invoice', icon: FileText },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle },
  delayed: { color: 'bg-orange-100 text-orange-800', label: 'Delayed', icon: AlertTriangle },
} as const;

// Memoized components to prevent unnecessary re-renders
const SkeletonRow = () => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="py-4 px-4">
        <div className="space-y-2">
          <div
            className="h-4 bg-gray-200 rounded animate-pulse"
            style={{
              width:
                i === 1 ? '100px' :
                i === 2 ? '180px' :
                i === 6 ? '70px' :
                '120px',
            }}
          />
        </div>
      </td>
    ))}
  </tr>
);

const SkeletonStats = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-14 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Optimized row component to prevent unnecessary re-renders
const WorkOrderRow = React.memo(({
  order,
  expandedRow,
  updatingStatus,
  handleRowClick,
  handleStatusChange,
  handleDelete,
  setExpandedRow,
  getNextStatus,
  canComplete,
}: {
  order: WorkOrder;
  expandedRow: string | null;
  updatingStatus: string | null;
  handleRowClick: (id: string) => void;
  handleStatusChange: (id: string, status: string) => void;
  handleDelete: (id: string) => void;
  setExpandedRow: (id: string | null) => void;
  getNextStatus: (status: string) => { label: string; value: string } | null;
  canComplete: (status: string) => boolean;
}) => {
  // Helper functions to extract data from order object
  const getCustomerName = () => {
    if (typeof order.opportunityId === 'object' && order.opportunityId.customer) {
      return order.opportunityId.customer.name;
    }
    return '—';
  };

  const getCustomerCompany = () => {
    if (typeof order.opportunityId === 'object' && order.opportunityId.customer) {
      return order.opportunityId.customer.companyName;
    }
    return '';
  };

  const getAssigneeName = () => {
    if (typeof order.assignedTo === 'object') {
      return `${order.assignedTo.firstName || ''} ${order.assignedTo.lastName || ''}`.trim();
    }
    return 'Unassigned';
  };

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const IconComponent = statusConfig.icon;
  const nextStatus = getNextStatus(order.status);
  
  return (
    <tr
      key={order._id}
      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => handleRowClick(order._id)}
    >
      <td className="py-4 px-4">
        <div className="hover:text-blue-600 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{order.workOrderNumber || 'N/A'}</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            {order.createdAt ? format(new Date(order.createdAt), 'MM/dd/yyyy') : '—'}
          </div>
        </div>
      </td>

      <td className="py-4 px-4">
        <div className="hover:text-blue-600 transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {getCustomerName()}
              </p>
              {getCustomerCompany() && (
                <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                  <Building className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{getCustomerCompany()}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </td>

      <td className="py-4 px-4">
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
            <IconComponent className="h-3 w-3" />
            {statusConfig.label}
          </span>
          {order.delayDays && order.delayDays > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Delayed by {order.delayDays} day{order.delayDays !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </td>

      <td className="py-4 px-4">
        <div className="hover:text-blue-600 transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <span className="text-sm text-gray-700">{getAssigneeName()}</span>
        </div>
      </td>

      <td className="py-4 px-4 font-semibold text-gray-900 hover:text-blue-600 transition-colors">
        {workOrderService.formatCurrency(order.totalCost || 0)}
      </td>

      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedRow(expandedRow === order._id ? null : order._id);
            }}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="More actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {expandedRow === order._id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExpandedRow(null)} />
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

                {nextStatus && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setExpandedRow(null);
                      handleStatusChange(order._id, nextStatus.value);
                    }}
                    disabled={updatingStatus === order._id}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left disabled:opacity-50"
                  >
                    {updatingStatus === order._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {nextStatus.label}
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

                <div className="border-t border-gray-200 my-1" />

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
});

WorkOrderRow.displayName = 'WorkOrderRow';

// Pagination component
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }

    return pages.map((page, index) =>
      page === '...' ? (
        <span
          key={index}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
        >
          ...
        </span>
      ) : (
        <button
          key={index}
          onClick={() => onPageChange(page)}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            currentPage === page
              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      )
    );
  };

  return (
    <div className="px-6 py-4 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>
          </div>

          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WorkOrdersList() {
  const router = useRouter();
  const { showToast } = useToast();

  // State management
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for showing/hiding filters
  const [showFilters, setShowFilters] = useState(true);

  // Pagination state - REDUCED TO 10 ITEMS PER PAGE
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10); // Changed from 20 to 10

  // Abort controllers
  const ordersAbortRef = useRef<AbortController | null>(null);
  const statsAbortRef = useRef<AbortController | null>(null);

  // Stats cache (short TTL) to avoid refetching on every minor change
  const statsCacheRef = useRef<{ value: WorkOrderStats | null; fetchedAt: number }>({
    value: null,
    fetchedAt: 0,
  });
  const STATS_TTL_MS = 30_000; // 30s

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoized functions to prevent recreation
  const hasActiveFilters = useMemo(() => {
    return !!(searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to);
  }, [searchTerm, statusFilter, dateRange]);

  const getNextStatus = useCallback((currentStatus: string) => {
    switch (currentStatus) {
      case 'draft': return { label: 'Start Pre-Checklist', value: 'pre_checklist' };
      case 'pre_checklist': return { label: 'Move to Job Card', value: 'job_card' };
      case 'job_card': return { label: 'Move to Post-Checklist', value: 'post_checklist' };
      case 'post_checklist': return { label: 'Ready for Invoice', value: 'ready_for_invoice' };
      case 'in_progress': return { label: 'Complete', value: 'completed' };
      default: return null;
    }
  }, []);

  const canComplete = useCallback((status: string) => {
    return ['in_progress', 'job_card', 'post_checklist', 'ready_for_invoice'].includes(status);
  }, []);

  // Fetch orders whenever filters/page change (optimized)
  useEffect(() => {
    ordersAbortRef.current?.abort();
    const controller = new AbortController();
    ordersAbortRef.current = controller;

    let alive = true;

    const fetchOrders = async () => {
      try {
        setError(null);
        setLoading(true);

        const response = await workOrderService.getAllWorkOrders({
          page: currentPage,
          limit: itemsPerPage,
          sort: 'createdAt:desc',
          // Removed 'populate' parameter since it's not in the interface
          ...(debouncedSearchTerm.trim() && { search: debouncedSearchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(dateRange.from && { fromDate: dateRange.from }),
          ...(dateRange.to && { toDate: dateRange.to }),
        });

        if (!alive) return;

        if (response?.data) {
          setWorkOrders(response.data);

          // Update pagination
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
            setTotalItems(response.pagination.total || 0);
          } else {
            setTotalItems(response.data.length);
            setTotalPages(Math.max(1, Math.ceil(response.data.length / itemsPerPage)));
          }
        } else {
          setWorkOrders([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;

        console.error('Error fetching work orders:', err);
        showToast('Failed to load work orders', 'error');
        setError('Failed to load work orders. Please try again.');
        setWorkOrders([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        if (alive) setLoading(false);
      }
    };

    // Add small delay to prioritize initial render
    const timer = setTimeout(fetchOrders, 50);
    
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [debouncedSearchTerm, statusFilter, dateRange, currentPage, itemsPerPage, showToast]);

  // Fetch stats (cached TTL) so it doesn't slow down typing/pagination
  useEffect(() => {
    let alive = true;

    const now = Date.now();
    const cached = statsCacheRef.current;

    // If cache fresh, use it immediately
    if (cached.value && (now - cached.fetchedAt) < STATS_TTL_MS) {
      setStats(cached.value);
      setStatsLoading(false);
      return () => { alive = false; };
    }

    statsAbortRef.current?.abort();
    const controller = new AbortController();
    statsAbortRef.current = controller;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const statsData = await workOrderService.getWorkOrderStats();

        if (!alive) return;

        setStats(statsData);
        statsCacheRef.current = { value: statsData, fetchedAt: Date.now() };
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Error fetching stats:', err);
        // keep UI: stats just won't show; don't hard-fail the page
      } finally {
        if (alive) setStatsLoading(false);
      }
    };

    // Delay stats fetch to prioritize orders
    const timer = setTimeout(fetchStats, 200);

    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [debouncedSearchTerm, statusFilter, dateRange, currentPage]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Bust stats cache so refresh is "real"
      statsCacheRef.current = { value: null, fetchedAt: 0 };

      const [ordersResponse, statsData] = await Promise.all([
        workOrderService.getAllWorkOrders({
          page: currentPage,
          limit: itemsPerPage,
          sort: 'createdAt:desc',
          // Removed 'populate' parameter
        }),
        workOrderService.getWorkOrderStats(),
      ]);

      if (ordersResponse?.data) {
        setWorkOrders(ordersResponse.data);

        if (ordersResponse.pagination) {
          setTotalPages(ordersResponse.pagination.totalPages || 1);
          setTotalItems(ordersResponse.pagination.total || 0);
        } else {
          setTotalItems(ordersResponse.data.length);
          setTotalPages(Math.max(1, Math.ceil(ordersResponse.data.length / itemsPerPage)));
        }
      }

      setStats(statsData);
      statsCacheRef.current = { value: statsData, fetchedAt: Date.now() };

      showToast('Work orders refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Failed to refresh work orders', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [currentPage, itemsPerPage, showToast]);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await workOrderService.updateWorkOrderStatus(orderId, newStatus);
      showToast('Work order status updated successfully!', 'success');

      setWorkOrders((prev) =>
        prev.map((order) => 
          order._id === orderId ? { ...order, status: newStatus as WorkOrder['status'] } : order
        )
      );

      setExpandedRow(null);
    } catch (error) {
      console.error('Error updating work order status:', error);
      showToast('Failed to update work order status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  }, [showToast]);

  const handleDelete = useCallback(async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
      try {
        await workOrderService.deleteWorkOrder(orderId);
        showToast('Work order deleted successfully!', 'success');

        setWorkOrders((prev) => prev.filter((order) => order._id !== orderId));
        setTotalItems((prev) => Math.max(0, prev - 1));
        setExpandedRow(null);
      } catch (error) {
        console.error('Error deleting work order:', error);
        showToast('Failed to delete work order', 'error');
      }
    }
  }, [showToast]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: '', to: '' });
    setCurrentPage(1);
  }, []);

  const handleRowClick = useCallback((orderId: string) => {
    router.push(`/orders/work-orders/${orderId}`);
  }, [router]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // Optimized table rows memoization
  const tableRows = useMemo(() => {
    if (loading) return null;

    return workOrders.map((order) => {
      return (
        <WorkOrderRow
          key={order._id}
          order={order}
          expandedRow={expandedRow}
          updatingStatus={updatingStatus}
          handleRowClick={handleRowClick}
          handleStatusChange={handleStatusChange}
          handleDelete={handleDelete}
          setExpandedRow={setExpandedRow}
          getNextStatus={getNextStatus}
          canComplete={canComplete}
        />
      );
    });
  }, [
    workOrders,
    loading,
    expandedRow,
    updatingStatus,
    handleRowClick,
    handleStatusChange,
    handleDelete,
    getNextStatus,
    canComplete,
  ]);

  // Error state
  if (error && workOrders.length === 0 && !loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center justify-between px-6">
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
            <span className="hidden sm:inline">New Work Order</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Stats */}
        {statsLoading ? (
          <SkeletonStats />
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Orders', value: stats.total || 0, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'In Progress', value: stats.byStatus?.find((s) => s._id === 'in_progress')?.count || 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Delayed', value: stats.delayedOrders || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Completed', value: stats.byStatus?.find((s) => s._id === 'completed')?.count || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">{item.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{item.value.toLocaleString()}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toggle Button for Filters */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters Section - Conditionally Rendered */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} className="text-sm text-blue-600 hover:text-blue-700">
                  Clear all filters
                </button>
              )}
            </div>

            <div className="space-y-4">
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

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => {
                      setDateRange((prev) => ({ ...prev, from: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => {
                      setDateRange((prev) => ({ ...prev, to: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!loading && workOrders.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} work orders
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
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
                  {hasActiveFilters ? 'Try adjusting your filters to see more results.' : 'Create your first work order to get started.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/orders/work-orders/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 shadow-sm"
                    prefetch={false}
                  >
                    <Plus className="h-4 w-4" /> Create Work Order
                  </Link>
                  {hasActiveFilters && (
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
              <>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{tableRows}</tbody>
                </table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}