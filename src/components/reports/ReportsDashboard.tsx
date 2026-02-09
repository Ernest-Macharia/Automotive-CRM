'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Target, Users, ShoppingBag, 
  DollarSign, Calendar, Download, Filter, RefreshCw, Clock,
  PieChart, LineChart, BarChart, Activity, ArrowUpRight, ArrowDownRight,
  CheckCircle, XCircle, AlertCircle, FileText, Eye, Printer,
  ChevronRight, ChevronDown, MoreVertical, Share2, Loader2,
  Building, User, Globe, Smartphone, Mail
} from 'lucide-react';
import { reportService, type ReportSummary, type SalesPerformance, type RevenueTimelinePoint, type TopCustomer, type DateRangeDto } from '@/services/reportService';
import { useToast } from '@/contexts/ToastContext';

// Skeleton Loading Components
const StatCardSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-gray-300/50 rounded"></div>
        <div className="h-8 w-16 bg-gray-300/50 rounded"></div>
      </div>
      <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl"></div>
    </div>
    <div className="mt-4 pt-4 border-t border-blue-100/30">
      <div className="h-3 w-32 bg-gray-300/50 rounded"></div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 animate-pulse">
    <div className="h-6 w-48 bg-gray-300/50 rounded mb-6"></div>
    <div className="h-64 bg-gray-300/30 rounded-lg"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 animate-pulse">
    <div className="h-6 w-48 bg-gray-300/50 rounded mb-6"></div>
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-300/50 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-300/50 rounded"></div>
              <div className="h-3 w-24 bg-gray-300/50 rounded"></div>
            </div>
          </div>
          <div className="h-4 w-16 bg-gray-300/50 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  from: string;
  to: string;
  branchId?: string;
  salesRepId?: string;
}

export default function ReportsDashboard() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformance | null>(null);
  const [revenueTimeline, setRevenueTimeline] = useState<RevenueTimelinePoint[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'month',
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'customers' | 'revenue'>('overview');

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const getDateRange = useCallback((): DateRangeDto => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = January, 11 = December
  
  let from: Date;
  let to: Date;

  switch (filters.dateRange) {
    case 'today':
      from = new Date(now);
      to = new Date(now);
      break;
      
    case 'week':
      // Get start of current week (Monday)
      from = new Date(now);
      const dayOfWeek = from.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      from.setDate(from.getDate() + diffToMonday);
      from.setHours(0, 0, 0, 0);
      
      to = new Date(now);
      to.setHours(23, 59, 59, 999);
      break;
      
    case 'month':
      // Get current month (January 2026)
      from = new Date(currentYear, currentMonth, 1);
      to = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
      break;
      
    case 'quarter':
      const currentQuarter = Math.floor(currentMonth / 3);
      from = new Date(currentYear, currentQuarter * 3, 1);
      to = new Date(currentYear, currentQuarter * 3 + 3, 0);
      break;
      
    case 'year':
      from = new Date(currentYear, 0, 1); // Jan 1 of current year
      to = new Date(currentYear, 11, 31); // Dec 31 of current year
      break;
      
    case 'custom':
      if (filters.from && filters.to) {
        from = new Date(filters.from);
        to = new Date(filters.to);
      } else {
        // Default to last 30 days
        from = new Date(now);
        from.setDate(from.getDate() - 30);
        to = new Date(now);
      }
      break;
      
    default:
      // Default to last 30 days
      from = new Date(now);
      from.setDate(from.getDate() - 30);
      to = new Date(now);
  }

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const params: DateRangeDto = {
    from: formatDate(from),
    to: formatDate(to)
  };

  if (filters.branchId) params.branchId = filters.branchId;
  if (filters.salesRepId) params.salesRepId = filters.salesRepId;

  return params;
}, [filters]);

  const fetchReportData = async () => {
    try {
        setLoading(true);
        setError(null);
        const dateRange = getDateRange();

        const [summaryData, performanceData, timelineData, customersData] = await Promise.all([
        reportService.getSummary(dateRange).catch(err => {
            console.error('Error in getSummary:', err);
            throw err;
        }),
        reportService.getSalesPerformance(dateRange).catch(err => {
            console.error('Error in getSalesPerformance:', err);
            throw err;
        }),
        reportService.getRevenueTimeline(dateRange).catch(err => {
            console.error('Error in getRevenueTimeline:', err);
            throw err;
        }),
        reportService.getTopCustomers(dateRange, 5).catch(err => {
            console.error('Error in getTopCustomers:', err);
            throw err;
        })
        ]);

        setSummary(summaryData);
        setSalesPerformance(performanceData);
        setRevenueTimeline(timelineData);
        setTopCustomers(customersData);
    } catch (error: any) {
        console.error('❌ Error fetching report data:', error);
        
        // Check for specific error types
        if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        setError('Network error: Cannot connect to the server. Please check your internet connection and make sure the API server is running.');
        } else if (error.message?.includes('401')) {
        setError('Authentication error: Please log in again.');
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
        } else if (error.message?.includes('404')) {
        setError('API endpoint not found. Please check if the reports API is available.');
        } else {
        setError(error.message || 'Failed to load report data. Please try again.');
        }
        
        showToast('Failed to load report data', 'error');
    } finally {
        setLoading(false);
    }
    };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
    showToast('Reports refreshed', 'success', 2000);
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const dateRange = getDateRange();
      const csvData = await reportService.exportReport('summary', format, dateRange);
      
      const blob = new Blob([csvData], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${filters.dateRange}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast(`Report exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showToast('Failed to export report', 'error');
    }
  };

  const testApiConnection = async () => {
    try {
      const result = await reportService.testConnection();
      if (result.success) {
        showToast('API connection successful!', 'success');
      } else {
        showToast(`API connection failed: ${result.message}`, 'error');
      }
    } catch (error) {
      showToast('Failed to test API connection', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-blue-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600 bg-green-50';
    if (trend < 0) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  // ... (keep all your render methods: renderOverviewTab, renderSalesTab, etc.)
  // They should work the same way with the real data

  const renderErrorState = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-br from-red-50 to-red-100/30 backdrop-blur-sm rounded-2xl border border-red-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-xl">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-800">Unable to Load Reports</h3>
            <p className="text-red-600 mt-1">There was an error fetching report data</p>
          </div>
        </div>
        
        <div className="bg-white/50 rounded-xl p-6 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Error Details:</h4>
          <p className="text-gray-700 font-mono text-sm bg-gray-50 p-3 rounded-lg">{error}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchReportData}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Loading
          </button>
          <button
            onClick={testApiConnection}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Test API Connection
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, dateRange: 'month' }))}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Reset Filters
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-red-200/50">
          <h4 className="font-semibold text-gray-800 mb-3">Troubleshooting Tips:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Verify your internet connection is stable
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Check if you're properly authenticated (try refreshing login)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Ensure the API server is running at: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Check browser console for detailed error information
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-blue-100/90 mt-1">
                  {loading ? 'Loading reports...' : 
                   error ? 'Error loading reports' : 
                   'Comprehensive business insights and performance metrics'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={testApiConnection}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-colors flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Test API
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  JSON
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {['today', 'week', 'month', 'quarter', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: range as any }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.dateRange === range
                      ? 'bg-white text-blue-600'
                      : 'text-white/90 hover:bg-white/20'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            {filters.dateRange === 'custom' && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-2">
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-1.5 bg-white/20 text-white rounded-lg border border-white/30 text-sm"
                />
                <span className="text-white/70">to</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-1.5 bg-white/20 text-white rounded-lg border border-white/30 text-sm"
                />
              </div>
            )}

            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-colors">
              <Filter className="h-4 w-4" />
              More Filters
            </button>
          </div>

          {/* Navigation Tabs */}
          {!error && (
            <div className="flex gap-2 mt-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'sales', label: 'Sales', icon: TrendingUp },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'revenue', label: 'Revenue', icon: DollarSign }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600'
                        : 'text-white/90 hover:bg-white/20'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        renderErrorState()
      ) : loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className={`text-sm font-medium ${(summary?.opportunitiesCount || 0) > 10 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {(summary?.opportunitiesCount || 0) > 10 ? 'High' : 'Normal'}
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{summary?.opportunitiesCount || 0}</h3>
                    <p className="text-sm text-gray-600">Opportunities</p>
                    <div className="mt-4 pt-4 border-t border-blue-100/30">
                      <div className="text-xs text-blue-600 font-medium">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        Sales Pipeline
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg">
                        <ShoppingBag className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className={`text-sm font-medium ${(salesPerformance?.conversion?.opportunitiesToQuotes || 0) > 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {(salesPerformance?.conversion?.opportunitiesToQuotes || 0).toFixed(1)}%
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{summary?.quotesCount || 0}</h3>
                    <p className="text-sm text-gray-600">Quotes</p>
                    <div className="mt-4 pt-4 border-t border-blue-100/30">
                      <div className="text-xs text-purple-600 font-medium">
                        <BarChart3 className="h-3 w-3 inline mr-1" />
                        Conversion Rate
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <span className={`text-sm font-medium ${(summary?.totalPayments || 0) > 10000 ? 'text-green-600' : 'text-blue-600'}`}>
                        {formatCurrency(summary?.totalPayments || 0)}
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{summary?.invoicesCount || 0}</h3>
                    <p className="text-sm text-gray-600">Invoices</p>
                    <div className="mt-4 pt-4 border-t border-blue-100/30">
                      <div className="text-xs text-green-600 font-medium">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        Revenue Generated
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-gradient-to-r from-amber-100 to-amber-200 rounded-lg">
                        <Users className="h-6 w-6 text-amber-600" />
                      </div>
                      <span className={`text-sm font-medium ${(summary?.totalOutstanding || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(summary?.totalOutstanding || 0)}
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{summary?.vehiclesCount || 0}</h3>
                    <p className="text-sm text-gray-600">Active Vehicles</p>
                    <div className="mt-4 pt-4 border-t border-blue-100/30">
                      <div className="text-xs text-amber-600 font-medium">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Outstanding Balance
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Revenue Timeline</h3>
                        <p className="text-sm text-gray-600">Daily revenue over selected period</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="h-4 w-4 text-blue-500" />
                        </button>
                        <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download className="h-4 w-4 text-blue-500" />
                        </button>
                      </div>
                    </div>
                    
                    {revenueTimeline.length > 0 ? (
                      <div className="h-64">
                        <div className="h-full flex items-end justify-between gap-1">
                          {revenueTimeline.slice(-14).map((point, index) => {
                            const maxAmount = Math.max(...revenueTimeline.map(p => p.amount));
                            const height = maxAmount > 0 ? (point.amount / maxAmount) * 100 : 0;
                            
                            return (
                              <div key={index} className="flex flex-col items-center flex-1">
                                <div className="text-xs text-gray-500 mb-1">{formatDate(point.date)}</div>
                                <div
                                  className="w-8 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-700"
                                  style={{ height: `${height}%` }}
                                  title={`${formatDate(point.date)}: ${formatCurrency(point.amount)}`}
                                />
                                <div className="text-xs text-gray-700 mt-1">
                                  {formatCurrency(point.amount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <LineChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No revenue data available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversion Metrics */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Conversion Metrics</h3>
                        <p className="text-sm text-gray-600">Sales funnel performance</p>
                      </div>
                      <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        <PieChart className="h-4 w-4 text-blue-500" />
                      </button>
                    </div>
                    
                    {salesPerformance && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          {/* Opportunities to Quotes */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Opportunities → Quotes</span>
                              <span className="font-medium text-blue-600">
                                {salesPerformance.conversion.opportunitiesToQuotes.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-blue-100/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${salesPerformance.conversion.opportunitiesToQuotes}%` }}
                              />
                            </div>
                          </div>

                          {/* Quotes to Invoices */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Quotes → Invoices</span>
                              <span className="font-medium text-green-600">
                                {salesPerformance.conversion.quotesToInvoices.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-green-100/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                                style={{ width: `${salesPerformance.conversion.quotesToInvoices}%` }}
                              />
                            </div>
                          </div>

                          {/* Overall Conversion */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Overall Conversion</span>
                              <span className="font-medium text-purple-600">
                                {(
                                  salesPerformance.totalopportunities > 0
                                    ? (salesPerformance.totalInvoices / salesPerformance.totalopportunities) * 100
                                    : 0
                                ).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-purple-100/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                                style={{
                                  width: `${salesPerformance.totalopportunities > 0
                                    ? (salesPerformance.totalInvoices / salesPerformance.totalopportunities) * 100
                                    : 0}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{salesPerformance.totalopportunities}</div>
                            <div className="text-xs text-gray-500">Opportunities</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{salesPerformance.totalQuotes}</div>
                            <div className="text-xs text-gray-500">Quotes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{salesPerformance.totalInvoices}</div>
                            <div className="text-xs text-gray-500">Invoices</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Add other tabs as needed */}
          </div>
          
          {/* Summary Footer */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Report Summary</h3>
                  <p className="text-sm text-gray-600">
                    Period: {new Date(filters.from).toLocaleDateString()} - {new Date(filters.to).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{summary?.opportunitiesCount || 0}</div>
                    <div className="text-gray-600">Opportunities</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(salesPerformance?.totalPaid || 0)}
                    </div>
                    <div className="text-gray-600">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">
                      {salesPerformance?.conversion.opportunitiesToQuotes.toFixed(1)}%
                    </div>
                    <div className="text-gray-600">Conversion</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200/50 text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()} • Data refreshes every 15 minutes
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}